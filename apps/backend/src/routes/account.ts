// 7.2 Profile, devices & guides  +  7.3 Onboarding & applications
import { Router } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as svc from '../services/account.service.js';

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json(await svc.getMyProfile(req.user!.id));
}));

usersRouter.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const { name, profileJson } = req.body as { name?: string; profileJson?: Record<string, unknown> };
  res.json(await svc.updateMyProfile(req.user!.id, { name, profileJson: profileJson as never }));
}));

usersRouter.post('/me/onboarding', requireAuth, asyncHandler(async (req, res) => {
  const { intent, schools } = req.body as { intent?: string; schools?: string[] };
  res.status(201).json(await svc.completeOnboarding(req.user!.id, { intent, schools }));
}));

usersRouter.post('/me/guide-listing', requireAuth, asyncHandler(async (req, res) => {
  const listing = (req.body ?? {}) as Record<string, unknown>;
  res.status(201).json(await svc.saveGuideListing(req.user!.id, listing));
}));

usersRouter.delete('/me/guide-listing', requireAuth, asyncHandler(async (req, res) => {
  res.json(await svc.deleteGuideListing(req.user!.id));
}));

usersRouter.post('/me/contact', requireAuth, asyncHandler(async (req, res) => {
  const { email, phone, promo } = req.body as { email?: string; phone?: string; promo?: boolean };
  res.json(await svc.updateContact(req.user!.id, { email, phone, promo }));
}));

usersRouter.post('/me/password', requireAuth, asyncHandler(async (req, res) => {
  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword) throw new HttpError(400, 'validation_error', 'newPassword is required');
  res.json(await svc.changePassword(req.user!.id, newPassword));
}));

usersRouter.delete('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json(await svc.deleteAccount(req.user!.id));
}));

usersRouter.post('/me/devices', requireAuth, asyncHandler(async (_req, res) => {
  res.status(201).json({ ok: true });
}));

usersRouter.delete('/me/devices/:id', requireAuth, asyncHandler(async (_req, res) => {
  res.json({ ok: true });
}));

export const sellersRouter = Router();

sellersRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await svc.getPublicSellerProfile(req.params['id'] as string));
}));

sellersRouter.get('/:id/reviews', asyncHandler(async (req, res) => {
  const { page, limit } = req.query as Record<string, string>;
  res.json(await svc.getSellerReviews(req.params['id'] as string, page ? +page : 1, limit ? +limit : 20));
}));

sellersRouter.get('/me/listings', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  res.json(await svc.getMyListings(req.user!.id));
}));

sellersRouter.get('/me/earnings', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  res.json(await svc.getMyEarnings(req.user!.id));
}));

sellersRouter.get('/me/payouts', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  const { page, limit } = req.query as Record<string, string>;
  res.json(await svc.getMyPayouts(req.user!.id, page ? +page : 1, limit ? +limit : 20));
}));

export const applicationsRouter = Router();

applicationsRouter.get('/questionnaire/active', requireAuth, requireRole('SELLER'), asyncHandler(async (_req, res) => {
  res.json(await svc.getActiveQuestionnaire());
}));

applicationsRouter.post('/', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  const { answers } = req.body as { answers?: { questionId: string; answer: string }[] };
  if (!answers?.length) throw new HttpError(400, 'validation_error', 'answers[] required');
  res.status(201).json(await svc.submitApplication(req.user!.id, answers));
}));

applicationsRouter.get('/me', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  res.json(await svc.getMyApplication(req.user!.id));
}));

applicationsRouter.patch('/me', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  const { answers } = req.body as { answers?: { questionId: string; answer: string }[] };
  if (!answers?.length) throw new HttpError(400, 'validation_error', 'answers[] required');
  res.json(await svc.resubmitApplication(req.user!.id, answers));
}));

applicationsRouter.post('/me/documents', requireAuth, requireRole('SELLER'), asyncHandler(async (_req, res) => {
  res.status(201).json({ ok: true, message: 'Document upload not implemented in v1' });
}));
