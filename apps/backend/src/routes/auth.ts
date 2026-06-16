// 7.1 Authentication & account
import { Router } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import * as authService from '../services/auth.service.js';
import { loginSchema, registerSchema } from '@ucpt/validation';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(async (req, res) => {
  const body = registerSchema.safeParse(req.body);
  if (!body.success) throw new HttpError(400, 'validation_error', 'Invalid request', body.error.flatten());
  const result = await authService.register(body.data.email, body.data.password, body.data.role, (req.body as { name?: string }).name);
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

authRouter.post('/verify-email', asyncHandler(async (_req, res) => {
  // Email verification is out of scope for v1 demo — mark verified immediately.
  res.json({ ok: true });
}));

authRouter.post('/forgot-password', asyncHandler(async (_req, res) => {
  // Password reset email not implemented in v1 demo.
  res.json({ ok: true, message: 'If that email exists, a reset link has been sent.' });
}));

authRouter.post('/reset-password', asyncHandler(async (_req, res) => {
  res.json({ ok: true });
}));

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user!.id);
  res.json(user);
}));
