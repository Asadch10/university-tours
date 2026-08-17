// 7.2 Profile, devices & guides  +  7.3 Onboarding & applications
import { Router } from 'express';
import type { ApplicantKind } from '@ucpt/db';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { imageUpload, uploadUrl, optimizeUpload } from '../lib/uploads.js';
import * as svc from '../services/account.service.js';
import * as connect from '../services/connect.service.js';
import * as cards from '../services/payment-method.service.js';

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

// Counselor equivalents of the two routes above.
usersRouter.post('/me/counselor-listing', requireAuth, asyncHandler(async (req, res) => {
  const listing = (req.body ?? {}) as Record<string, unknown>;
  res.status(201).json(await svc.saveCounselorListing(req.user!.id, listing));
}));

usersRouter.delete('/me/counselor-listing', requireAuth, asyncHandler(async (req, res) => {
  res.json(await svc.deleteCounselorListing(req.user!.id));
}));

// ─── Saved cards (Stripe Customer + SetupIntent) ──────────────────────────────
usersRouter.get('/me/payment-methods', requireAuth, asyncHandler(async (req, res) => {
  res.json(await cards.listPaymentMethods(req.user!.id));
}));

// POST → start saving a card: returns a SetupIntent client secret for the Payment Element.
usersRouter.post('/me/payment-methods/setup', requireAuth, asyncHandler(async (req, res) => {
  res.status(201).json(await cards.createSetupIntent(req.user!.id));
}));

usersRouter.post('/me/payment-methods/:id/default', requireAuth, asyncHandler(async (req, res) => {
  res.json(await cards.setDefaultPaymentMethod(req.user!.id, req.params['id'] as string));
}));

usersRouter.delete('/me/payment-methods/:id', requireAuth, asyncHandler(async (req, res) => {
  res.json(await cards.deletePaymentMethod(req.user!.id, req.params['id'] as string));
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

// Authenticated single-image upload (field name `file`) → { url }. Used by the
// become-a-guide flow to persist profile photos so they survive the session.
usersRouter.post('/me/uploads', requireAuth, (req, res, next) => {
  imageUpload(req, res, (err: unknown) => {
    if (err) {
      next(err instanceof HttpError ? err : new HttpError(400, 'upload_failed', (err as Error).message));
      return;
    }
    if (!req.file) {
      next(new HttpError(400, 'no_file', 'No file was uploaded'));
      return;
    }
    // Downscale/re-encode before handing back the URL, so the stored file is the
    // optimised one and clients never see the original.
    void optimizeUpload(req.file.filename)
      .then((stored) => res.status(201).json({ url: uploadUrl(stored), filename: stored }))
      .catch(() => res.status(201).json({ url: uploadUrl(req.file!.filename), filename: req.file!.filename }));
  });
});

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

// ─── Stripe Connect (guide bank onboarding). requireAuth only — a user is a
// guest AND a guide; connecting a bank is authorized by being signed in. ───────
sellersRouter.get('/me/connect/status', requireAuth, asyncHandler(async (req, res) => {
  res.json(await connect.getConnectStatus(req.user!.id));
}));

sellersRouter.post('/me/connect/onboard', requireAuth, asyncHandler(async (req, res) => {
  const { country } = req.body as { country?: string };
  res.json(await connect.startConnectOnboarding(req.user!.id, country));
}));

sellersRouter.post('/me/connect/dashboard', requireAuth, asyncHandler(async (req, res) => {
  res.json(await connect.getConnectDashboardLink(req.user!.id));
}));

sellersRouter.get('/me/connect/payouts', requireAuth, asyncHandler(async (req, res) => {
  res.json(await connect.getPayoutSummary(req.user!.id));
}));

sellersRouter.post('/me/connect/cashout', requireAuth, asyncHandler(async (req, res) => {
  res.json(await connect.cashOut(req.user!.id));
}));

export const applicationsRouter = Router();

/**
 * Which application flow the request is for, from `?kind=` or the body.
 *
 * Absent or unrecognised means GUIDE. That default is load-bearing: the shipped
 * mobile app calls these endpoints with no `kind` at all, and must keep getting the
 * guide questionnaire and the guide application.
 */
function kindOf(req: { query: Record<string, unknown>; body?: unknown }): ApplicantKind {
  const raw = (req.query['kind'] ?? (req.body as { kind?: unknown } | undefined)?.kind);
  return String(raw ?? '').toUpperCase() === 'COUNSELOR' ? 'COUNSELOR' : 'GUIDE';
}

applicationsRouter.get('/questionnaire/active', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  res.json(await svc.getActiveQuestionnaire(kindOf(req)));
}));

applicationsRouter.post('/', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  const { answers } = req.body as { answers?: { questionId: string; answer: string }[] };
  if (!answers?.length) throw new HttpError(400, 'validation_error', 'answers[] required');
  res.status(201).json(await svc.submitApplication(req.user!.id, answers, kindOf(req)));
}));

applicationsRouter.get('/me', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  res.json(await svc.getMyApplication(req.user!.id, kindOf(req)));
}));

applicationsRouter.patch('/me', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  const { answers } = req.body as { answers?: { questionId: string; answer: string }[] };
  if (!answers?.length) throw new HttpError(400, 'validation_error', 'answers[] required');
  res.json(await svc.resubmitApplication(req.user!.id, answers, kindOf(req)));
}));

applicationsRouter.post('/me/documents', requireAuth, requireRole('SELLER'), asyncHandler(async (_req, res) => {
  res.status(201).json({ ok: true, message: 'Document upload not implemented in v1' });
}));
