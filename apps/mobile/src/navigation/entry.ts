/**
 * Where a signed-in session belongs.
 *
 * Two gates, checked in order, matching the website's flow:
 *
 *   1. Email not verified → VerifyEmail
 *   2. Never onboarded    → Onboarding
 *   otherwise             → Main
 *
 * Both are read from the SERVER, never from the cached session user. That is the whole
 * point: someone can register, close the app before tapping the link in their email, and
 * sign in again days later. The cached record still holds whatever was true at sign-up,
 * so trusting it let an unverified account walk straight into the home screen.
 */
import { session, type Role } from '../api/auth';

export type EntryRoute = 'VerifyEmail' | 'Onboarding' | 'Main';

/** True once onboarding has run. */
function isOnboarded(role: Role | null | undefined): boolean {
  // A new account is created with a null role and onboarding is what assigns one
  // (guide/counselor → SELLER, guest → BUYER), so a null role means it never ran.
  return !!role;
}

/** Apply the two gates to a known-fresh snapshot of the account. */
function routeFor(emailVerified: boolean, role: Role | null | undefined): EntryRoute {
  if (!emailVerified) return 'VerifyEmail';
  if (!isOnboarded(role)) return 'Onboarding';
  return 'Main';
}

/**
 * `known` is the user object from a login/register response, which already carries both
 * fields. Passing it skips the round trip AND removes a failure mode: if the extra
 * request happened to fail, the fallback below would let the user past the gate we were
 * trying to enforce.
 */
export async function resolveEntryRoute(known?: {
  emailVerified?: boolean;
  role?: Role | null;
}): Promise<EntryRoute> {
  if (typeof known?.emailVerified === 'boolean') {
    return routeFor(known.emailVerified, known.role);
  }

  let me: Awaited<ReturnType<typeof session.me>>;
  try {
    me = await session.me();
  } catch {
    // Offline, or a transient server error, with nothing fresh to judge from. Don't
    // strand the user on a gate we cannot verify — each screen surfaces its own errors.
    return 'Main';
  }

  // Keep the cached session in step with what the server just said.
  await session.setUser({ role: me.role, emailVerified: me.emailVerified });

  return routeFor(me.emailVerified, me.role);
}
