// 7.1 Authentication & account
import { Router } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import * as authService from '../services/auth.service.js';
import { loginSchema } from '@ucpt/validation';

export const authRouter = Router();

/**
 * Which client is asking, so the verification email links somewhere useful for it.
 * Anything other than an explicit 'mobile' is treated as the website, so every existing
 * caller keeps exactly the behaviour it already had.
 */
function verifyClient(body: unknown): 'web' | 'mobile' {
  return (body as { client?: string } | null)?.client === 'mobile' ? 'mobile' : 'web';
}

authRouter.post('/register', asyncHandler(async (req, res) => {
  // Website sign-ups don't pick a role — it stays null until onboarding decides it.
  const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
  if (!email || typeof email !== 'string') throw new HttpError(400, 'validation_error', 'A valid email is required');
  if (!password || password.length < 8) throw new HttpError(400, 'validation_error', 'Password must be at least 8 characters');
  const result = await authService.register(email, password, name, verifyClient(req.body));
  res.status(201).json(result);
}));

authRouter.post('/login', asyncHandler(async (req, res) => {
  const body = loginSchema.safeParse(req.body);
  if (!body.success) throw new HttpError(400, 'validation_error', 'Invalid request', body.error.flatten());
  const result = await authService.login(body.data.email, body.data.password);
  res.json(result);
}));

authRouter.post('/refresh', asyncHandler(async (req, res) => {
  const token = (req.body as { refreshToken?: string }).refreshToken;
  if (!token) throw new HttpError(400, 'missing_token', 'refreshToken required');
  const result = await authService.refresh(token);
  res.json(result);
}));

authRouter.post('/logout', requireAuth, asyncHandler(async (req, res) => {
  const token = (req.body as { refreshToken?: string }).refreshToken;
  if (token) await authService.logout(token);
  res.json({ ok: true });
}));

authRouter.post('/verify-email', asyncHandler(async (req, res) => {
  const token = (req.body as { token?: string }).token;
  if (!token || typeof token !== 'string') throw new HttpError(400, 'missing_token', 'A verification token is required');
  const result = await authService.verifyEmail(token);
  res.json(result);
}));

authRouter.post('/resend-verification', requireAuth, asyncHandler(async (req, res) => {
  const result = await authService.resendVerification(req.user!.id, verifyClient(req.body));
  res.json(result);
}));

authRouter.post('/forgot-password', asyncHandler(async (req, res) => {
  const email = (req.body as { email?: string }).email;
  if (!email || typeof email !== 'string') throw new HttpError(400, 'validation_error', 'A valid email is required');
  await authService.forgotPassword(email);
  // Same response whether or not the account exists (avoids email enumeration).
  res.json({ ok: true, message: 'If that email exists, a reset link has been sent.' });
}));

authRouter.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || typeof token !== 'string') throw new HttpError(400, 'missing_token', 'A reset token is required');
  if (!password || typeof password !== 'string') throw new HttpError(400, 'validation_error', 'A new password is required');
  const result = await authService.resetPassword(token, password);
  res.json(result);
}));

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user!.id);
  res.json(user);
}));
