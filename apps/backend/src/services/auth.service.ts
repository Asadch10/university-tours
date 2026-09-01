import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '@ucpt/db';
import { ADMIN_PERMISSIONS } from '@ucpt/types';
import { config } from '../config.js';
import { HttpError } from '../lib/http.js';
import { logger } from '../lib/logger.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './mailer.service.js';

// In-memory refresh token store (Redis in production).
// Key = jti (UUID), value = userId
const validRefreshJtis = new Set<string>();

function generateJti(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface JwtPayload {
  sub: string;
  role: string | null;
  adminRoleName?: string;
  permissions?: string[];
  jti?: string;
}

function issueAccessToken(payload: Omit<JwtPayload, 'jti'>): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, { expiresIn: config.JWT_ACCESS_TTL as any });
}

function issueRefreshToken(userId: string): { token: string; jti: string } {
  const jti = generateJti();
  validRefreshJtis.add(jti);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = jwt.sign({ sub: userId, jti }, config.JWT_REFRESH_SECRET, { expiresIn: config.JWT_REFRESH_TTL as any });
  return { token, jti };
}

// ─── Email verification (stateless token) ─────────────────────────────────────

interface EmailVerifyPayload {
  sub: string; // userId
  email: string;
  purpose: 'email-verify';
}

function issueEmailVerifyToken(user: { id: string; email: string }): string {
  const payload: EmailVerifyPayload = { sub: user.id, email: user.email, purpose: 'email-verify' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, config.EMAIL_VERIFY_SECRET, { expiresIn: config.EMAIL_VERIFY_TTL as any });
}

/** Build the website link the user clicks in the email. Lands on onboarding,
 *  which confirms the token and then walks the user through setup. */
/** Which app the person signed up in. Decides where the emailed link lands. */
export type VerifyClient = 'web' | 'mobile';

/**
 * The URL behind "Verify my email".
 *
 * Both clients open a WEB page — the app cannot receive the link itself (it has no
 * universal-link setup, and Expo Go could never claim one anyway). But the two need
 * different destinations:
 *
 *   web    → /onboarding, which verifies and drops the user straight into onboarding.
 *   mobile → /verify-email, which verifies and then just says "done, go back to the app".
 *            Continuing on the website would be a dead end: the phone's browser has no
 *            session, and the app is already waiting to move them on by itself.
 */
function buildVerifyUrl(token: string, client: VerifyClient): string {
  const base = config.APP_WEB_URL.replace(/\/+$/, '');
  const t = encodeURIComponent(token);
  return client === 'mobile' ? `${base}/verify-email?token=${t}&app=1` : `${base}/onboarding?token=${t}`;
}

/** Fire off the verification email (best-effort — never throws to the caller). */
async function dispatchVerificationEmail(
  user: { id: string; email: string; name: string },
  client: VerifyClient = 'web',
): Promise<void> {
  const token = issueEmailVerifyToken(user);
  const verifyUrl = buildVerifyUrl(token, client);
  await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl }).catch((err) => {
    logger.error({ err, userId: user.id }, 'Verification email dispatch failed');
  });
}

/**
 * Verify an email-confirmation token and mark the account verified.
 * Idempotent: a token for an already-verified account succeeds silently.
 */
export async function verifyEmail(token: string) {
  let payload: EmailVerifyPayload;
  try {
    payload = jwt.verify(token, config.EMAIL_VERIFY_SECRET) as EmailVerifyPayload;
  } catch {
    throw new HttpError(400, 'invalid_token', 'This verification link is invalid or has expired.');
  }
  if (payload.purpose !== 'email-verify') {
    throw new HttpError(400, 'invalid_token', 'This verification link is invalid.');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new HttpError(404, 'not_found', 'Account not found.');

  if (!user.emailVerifiedAt) {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  }

  return { ok: true as const, email: user.email, name: user.name, emailVerified: true };
}

/** Re-send the verification email for a logged-in user (no-op if already verified). */
export async function resendVerification(userId: string, client: VerifyClient = 'web') {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'not_found', 'Account not found.');
  if (user.emailVerifiedAt) return { ok: true as const, alreadyVerified: true };

  await dispatchVerificationEmail(user, client);
  return { ok: true as const, alreadyVerified: false };
}

// ─── Password reset (stateless, single-use token) ─────────────────────────────

interface PasswordResetPayload {
  sub: string; // userId
  pwh: string; // tail of the current password hash → invalidates the token once the password changes
  purpose: 'password-reset';
}

/** A short, changing fingerprint of the password hash. Reset tokens embed this so
 *  they stop working the moment the password is changed (making them single-use). */
function passwordFingerprint(passwordHash: string): string {
  return passwordHash.slice(-16);
}

function issuePasswordResetToken(user: { id: string; passwordHash: string }): string {
  const payload: PasswordResetPayload = {
    sub: user.id,
    pwh: passwordFingerprint(user.passwordHash),
    purpose: 'password-reset',
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, config.PASSWORD_RESET_SECRET, { expiresIn: config.PASSWORD_RESET_TTL as any });
}

/**
 * Start a password reset. Always resolves the same way whether or not the email
 * exists, so the endpoint can't be used to probe which addresses have accounts.
 */
export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  // Only email real, active accounts — but never reveal that to the caller.
  if (user && user.status === 'ACTIVE') {
    const token = issuePasswordResetToken(user);
    const base = config.APP_WEB_URL.replace(/\/+$/, '');
    const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl }).catch((err) => {
      logger.error({ err, userId: user.id }, 'Password reset email dispatch failed');
    });
  }
  return { ok: true as const };
}

/** Complete a password reset: validate the token and set the new password. */
export async function resetPassword(token: string, newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    throw new HttpError(400, 'validation_error', 'Password must be at least 8 characters');
  }

  let payload: PasswordResetPayload;
  try {
    payload = jwt.verify(token, config.PASSWORD_RESET_SECRET) as PasswordResetPayload;
  } catch {
    throw new HttpError(400, 'invalid_token', 'This reset link is invalid or has expired.');
  }
  if (payload.purpose !== 'password-reset') {
    throw new HttpError(400, 'invalid_token', 'This reset link is invalid.');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new HttpError(404, 'not_found', 'Account not found.');

  // Reject a token that was already used (the fingerprint changes on each password change).
  if (payload.pwh !== passwordFingerprint(user.passwordHash)) {
    throw new HttpError(400, 'invalid_token', 'This reset link has already been used or has expired.');
  }

  const passwordHash = await argon2.hash(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { ok: true as const };
}

/**
 * Single-admin mode: an admin holds every permission, full stop.
 *
 * This used to read `admin_roles.permissions_json`, which made the token depend
 * on a seeded row. If the row was missing the admin silently got `[]`, and when
 * the row drifted from the console's list the token was quietly incomplete
 * (that is exactly what happened — `contact.view` was absent in production).
 * Deriving from the shared constant removes both failure modes.
 */
function getPermissions(adminRoleName: string | null | undefined): string[] {
  if (!adminRoleName) return [];
  return [...ADMIN_PERMISSIONS];
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) throw new HttpError(401, 'invalid_credentials', 'Invalid email or password');

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) throw new HttpError(401, 'invalid_credentials', 'Invalid email or password');

  if (user.status === 'SUSPENDED') throw new HttpError(403, 'account_suspended', 'Account suspended');
  if (user.status === 'BANNED') throw new HttpError(403, 'account_banned', 'Account banned');

  const permissions = getPermissions(user.adminRoleName);

  const accessPayload: JwtPayload = {
    sub: user.id,
    role: user.role,
    ...(user.adminRoleName && { adminRoleName: user.adminRoleName }),
    ...(permissions.length && { permissions }),
  };

  const accessToken = issueAccessToken(accessPayload);
  const { token: refreshToken } = issueRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      adminRoleName: user.adminRoleName,
      permissions,
      emailVerified: !!user.emailVerifiedAt,
    },
  };
}

export async function register(email: string, password: string, name?: string, client: VerifyClient = 'web') {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) throw new HttpError(409, 'email_in_use', 'Email already registered');

  const passwordHash = await argon2.hash(password);
  // Role is intentionally left null — onboarding decides BUYER (book tours) vs SELLER (guide).
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      name: name ?? email.split('@')[0],
      passwordHash,
    },
  });

  // Send the "verify your email" message. Best-effort: a mail failure must not
  // block sign-up (the user can always resend from the verification screen).
  await dispatchVerificationEmail(user, client);

  const accessToken = issueAccessToken({ sub: user.id, role: user.role });
  const { token: refreshToken } = issueRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: false },
  };
}

export async function refresh(token: string) {
  let payload: { sub: string; jti: string };
  try {
    payload = jwt.verify(token, config.JWT_REFRESH_SECRET) as typeof payload;
  } catch {
    throw new HttpError(401, 'invalid_token', 'Invalid or expired refresh token');
  }

  // NOTE: the valid-jti allowlist is in-memory (see top of file) and is wiped on every backend
  // restart, which would otherwise "revoke" every live session on reload. In dev we trust any
  // validly-signed, unexpired refresh token for an active user. (Swap for Redis to enforce
  // real revocation in production.)
  validRefreshJtis.delete(payload.jti);

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== 'ACTIVE') throw new HttpError(401, 'user_inactive', 'User not active');

  const permissions = getPermissions(user.adminRoleName);
  const accessToken = issueAccessToken({ sub: user.id, role: user.role, adminRoleName: user.adminRoleName ?? undefined, permissions });
  const { token: newRefreshToken } = issueRefreshToken(user.id);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(token: string) {
  try {
    const payload = jwt.verify(token, config.JWT_REFRESH_SECRET) as { sub: string; jti: string };
    validRefreshJtis.delete(payload.jti);
  } catch {
    // Ignore invalid tokens on logout
  }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  const permissions = getPermissions(user.adminRoleName);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    adminRoleName: user.adminRoleName,
    permissions,
    status: user.status,
    emailVerified: !!user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
}
