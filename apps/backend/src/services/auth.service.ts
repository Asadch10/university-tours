import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '@ucpt/db';
import { config } from '../config.js';
import { HttpError } from '../lib/http.js';

// In-memory refresh token store (Redis in production).
// Key = jti (UUID), value = userId
const validRefreshJtis = new Set<string>();

function generateJti(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface JwtPayload {
  sub: string;
  role: string;
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

async function getPermissions(adminRoleName: string | null | undefined): Promise<string[]> {
  if (!adminRoleName) return [];
  const { AdminRoleName } = await import('@ucpt/db');
  const role = await prisma.adminRole.findUnique({ where: { role: adminRoleName as never } });
  return (role?.permissionsJson as string[]) ?? [];
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) throw new HttpError(401, 'invalid_credentials', 'Invalid email or password');

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) throw new HttpError(401, 'invalid_credentials', 'Invalid email or password');

  if (user.status === 'SUSPENDED') throw new HttpError(403, 'account_suspended', 'Account suspended');
  if (user.status === 'BANNED') throw new HttpError(403, 'account_banned', 'Account banned');

  const permissions = await getPermissions(user.adminRoleName);

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

export async function register(email: string, password: string, role: 'BUYER' | 'SELLER', name?: string) {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) throw new HttpError(409, 'email_in_use', 'Email already registered');

  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      name: name ?? email.split('@')[0],
      role: role as never,
      passwordHash,
    },
  });

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

  if (!validRefreshJtis.has(payload.jti)) {
    throw new HttpError(401, 'token_revoked', 'Refresh token has been revoked');
  }

  // Rotate: invalidate old jti
  validRefreshJtis.delete(payload.jti);

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== 'ACTIVE') throw new HttpError(401, 'user_inactive', 'User not active');

  const permissions = await getPermissions(user.adminRoleName);
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
  const permissions = await getPermissions(user.adminRoleName);
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
