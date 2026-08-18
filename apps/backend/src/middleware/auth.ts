// Auth guards (deny-by-default). Verifies the Bearer access JWT and attaches
// the principal. Single-admin mode: any ADMIN role passes all permission checks.
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { forbidden, unauthorized } from '../lib/http.js';

export interface Principal {
  id: string;
  role: string;
  adminRoleName?: string;
  permissions?: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: Principal;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return next(unauthorized('Missing access token'));
  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as { sub: string; role: string; adminRoleName?: string; permissions?: string[] };
    req.user = { id: payload.sub, role: payload.role, adminRoleName: payload.adminRoleName, permissions: payload.permissions };
    return next();
  } catch {
    return next(unauthorized('Invalid or expired token'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden(`Requires role: ${roles.join('/')}`));
    return next();
  };
}

/**
 * The console guard. Single-admin mode: there is one kind of admin and it can do
 * everything, so being an authenticated ADMIN *is* the whole check.
 *
 * This replaced `requirePermission('some.permission')`, which took a permission
 * name and then ignored it. The behaviour was correct for single-admin mode but
 * the name promised a granular check that was never performed — anyone reading a
 * route saw an access rule that did not exist.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== 'ADMIN') return next(forbidden('Admin only'));
  return next();
}
