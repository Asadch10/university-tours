// Mobile auth/session — mirrors the website's authApi (apps/website/lib/client-api.ts)
// but persists the access/refresh JWTs and the current user in SecureStore instead of
// localStorage. Built on the shared SDK `request` so the backend contract matches the web.
import * as SecureStore from 'expo-secure-store';
import { api, ApiClientError } from './client';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

export type Role = 'BUYER' | 'SELLER';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role | null; // null until onboarding decides it
  emailVerified?: boolean;
  hasListing?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

async function persist(res: AuthResponse) {
  await SecureStore.setItemAsync(ACCESS_KEY, res.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, res.refreshToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(res.user));
}

/**
 * Tells the backend which app is asking, so the "Verify my email" link in the email
 * lands somewhere useful for THIS client. A mobile sign-up gets a page that confirms and
 * says "go back to the app"; the website keeps sending people into its own onboarding.
 */
const CLIENT = 'mobile' as const;

export const session = {
  // Role is omitted — the backend defaults new sign-ups to null until onboarding.
  async register(email: string, password: string, name?: string) {
    const res = await api.request<AuthResponse>('POST', '/auth/register', {
      email,
      password,
      name,
      client: CLIENT,
    });
    await persist(res);
    return res;
  },
  async login(email: string, password: string) {
    const res = await api.request<AuthResponse>('POST', '/auth/login', { email, password });
    await persist(res);
    return res;
  },
  // Save phone/contact details after sign-up (register itself takes no phone).
  updateContact(body: { email?: string; phone?: string; promo?: boolean }) {
    return api.request('POST', '/users/me/contact', body);
  },
  // Confirm an email address from a verification token (from the email link / deep link).
  verifyEmail(token: string) {
    return api.request<{ ok: true; email: string; name: string; emailVerified: true }>(
      'POST',
      '/auth/verify-email',
      { token },
    );
  },
  // Re-send the verification email to the signed-in user. Sends `client` too, so the
  // resent link is the mobile one — not the website's onboarding link.
  resendVerification() {
    return api.request<{ ok: true; alreadyVerified?: boolean }>(
      'POST',
      '/auth/resend-verification',
      { client: CLIENT },
    );
  },
  // Fresh account snapshot — includes `emailVerified`, used to poll for verification.
  me() {
    return api.request<{ id: string; email: string; name: string; role: Role | null; emailVerified: boolean }>(
      'GET',
      '/auth/me',
    );
  },
  async currentUser(): Promise<SessionUser | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  },
  // Merge fields into the stored user (e.g. after verification or onboarding sets the role).
  async setUser(patch: Partial<SessionUser>) {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    const current = raw ? (JSON.parse(raw) as SessionUser) : null;
    if (!current) return;
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify({ ...current, ...patch }));
  },
  async isSignedIn() {
    return Boolean(await SecureStore.getItemAsync(ACCESS_KEY));
  },
  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  },
};

/** Turn any thrown error into a friendly, user-facing message. */
export function friendlyError(e: unknown): string {
  if (e instanceof ApiClientError) {
    if (e.status === 401) return 'Wrong email or password. Please try again.';
    if (e.status === 403) return "You don't have permission to do that.";
    if (e.status === 409) return 'That email is already registered. Try signing in.';
    if (e.status === 429) return 'Too many attempts. Please wait a moment and try again.';
    if (e.status >= 500) return 'Something went wrong on our end. Please try again shortly.';
    return e.payload?.error || 'That didn’t work. Please try again.';
  }
  if (e instanceof TypeError) return 'Can’t reach the server. Please check your connection.';
  return 'Something went wrong. Please try again.';
}
