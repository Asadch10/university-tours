// 7.9 Admin — operations  +  7.10 Admin — money, content & configuration
import { Router } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import * as svc from '../services/admin.service.js';
import * as contactSvc from '../services/contact.service.js';
import { questionnaireApiRouter } from './api/questionnaire.js';
import { imageUpload, uploadUrl } from '../lib/uploads.js';

export const adminRouter = Router();
adminRouter.use(requireAuth);

// Question-level CRUD (add/edit/delete/reorder) — must be registered before
// the broader /questionnaires routes so sub-paths are matched first.
adminRouter.use('/questionnaires', questionnaireApiRouter);

// ─── Dashboard ────────────────────────────────────────────────────────────────

adminRouter.get('/dashboard', requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await svc.getDashboard());
}));

adminRouter.get('/reports', requireAdmin, asyncHandler(async (req, res) => {
  const { from, to } = req.query as Record<string, string>;
  res.json(await svc.getReports(from, to));
}));

// ─── Applications ─────────────────────────────────────────────────────────────

adminRouter.get('/applications', requireAdmin, asyncHandler(async (req, res) => {
  const { status, kind, q, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listApplications({ status, kind, q, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

adminRouter.get('/applications/:id', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.getApplication(req.params['id'] as string));
}));

adminRouter.post('/applications/:id/approve', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.decideApplication(req.params['id'] as string, 'APPROVED', undefined, req.user!.id));
}));

adminRouter.post('/applications/:id/reject', requireAdmin, asyncHandler(async (req, res) => {
  const { reason } = req.body as { reason?: string };
  res.json(await svc.decideApplication(req.params['id'] as string, 'REJECTED', reason, req.user!.id));
}));

adminRouter.post('/applications/:id/request-changes', requireAdmin, asyncHandler(async (req, res) => {
  const { reason } = req.body as { reason?: string };
  res.json(await svc.decideApplication(req.params['id'] as string, 'CHANGES_REQUESTED', reason, req.user!.id));
}));

// ─── Questionnaire (one per applicant kind) ───────────────────────────────────

adminRouter.get('/questionnaires', requireAdmin, asyncHandler(async (req, res) => {
  const kind = String(req.query['kind'] ?? '').toUpperCase() === 'COUNSELOR' ? 'COUNSELOR' : 'GUIDE';
  const [q, requiredPhotos] = await Promise.all([svc.getOrCreateQuestionnaire(kind), svc.getRequiredPhotos()]);
  res.json({ ...q, requiredPhotos });
}));

// ─── Users ────────────────────────────────────────────────────────────────────

adminRouter.get('/users', requireAdmin, asyncHandler(async (req, res) => {
  const { q, role, status, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listUsers({ q, role, status, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

adminRouter.get('/users/:id', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.getUserDetail(req.params['id'] as string));
}));

adminRouter.patch('/users/:id', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.updateUser(req.params['id'] as string, req.body as { status?: string }, req.user!.id));
}));

adminRouter.post('/users/:id/reset-password', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.adminResetPassword(req.params['id'] as string, req.user!.id));
}));

// ─── Listings ─────────────────────────────────────────────────────────────────

adminRouter.get('/listings', requireAdmin, asyncHandler(async (req, res) => {
  const { q, status, service, kind, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listListings({ q, status, service, kind, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

adminRouter.get('/listings/:id', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.getListingDetail(req.params['id'] as string, req.query['kind'] as string | undefined));
}));

adminRouter.patch('/listings/:id', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.moderateListing(req.params['id'] as string, req.body as { status?: string; kind?: string }, req.user!.id));
}));

// ─── Bookings ─────────────────────────────────────────────────────────────────

adminRouter.get('/bookings', requireAdmin, asyncHandler(async (req, res) => {
  const { status, q, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listBookings({ status, q, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

adminRouter.post('/bookings/:id/force-cancel', requireAdmin, asyncHandler(async (req, res) => {
  const { reason } = req.body as { reason?: string };
  if (!reason) throw new HttpError(400, 'validation_error', 'reason required');
  res.json(await svc.forceCancelBooking(req.params['id'] as string, reason, req.user!.id));
}));

adminRouter.post('/bookings/:id/refund', requireAdmin, asyncHandler(async (req, res) => {
  const { amountCents, reason } = req.body as { amountCents?: number; reason: string };
  if (!reason) throw new HttpError(400, 'validation_error', 'reason required');
  res.json(await svc.refundBooking(req.params['id'] as string, amountCents, reason, req.user!.id));
}));

// ─── Refunds ──────────────────────────────────────────────────────────────────

adminRouter.get('/refunds', requireAdmin, asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listRefunds({ q, page: page ? +page : 1, limit: limit ? +limit : 50 }));
}));

// ─── Reviews ──────────────────────────────────────────────────────────────────

adminRouter.get('/reviews', requireAdmin, asyncHandler(async (req, res) => {
  const { q, hidden, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listReviews({ q, hidden: hidden !== undefined ? hidden === 'true' : undefined, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

adminRouter.patch('/reviews/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { hidden } = req.body as { hidden: boolean };
  res.json(await svc.moderateReview(req.params['id'] as string, { hidden: Boolean(hidden) }, req.user!.id));
}));

// ─── Commission & settings ────────────────────────────────────────────────────

adminRouter.get('/commission', requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await svc.getCommission());
}));

adminRouter.get('/commission/history', requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await svc.getCommissionHistory());
}));

adminRouter.put('/commission', requireAdmin, asyncHandler(async (req, res) => {
  const { commissionPct } = req.body as { commissionPct?: number };
  if (commissionPct === undefined || commissionPct < 0 || commissionPct > 100) {
    throw new HttpError(400, 'validation_error', 'commissionPct must be 0–100');
  }
  res.json(await svc.setCommission(commissionPct, req.user!.id));
}));

adminRouter.get('/settings', requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await svc.getSettings());
}));

adminRouter.put('/settings', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.updateSettings(req.body as { refundWindowsJson?: unknown; requestExpiryHours?: number; maskingEnabled?: boolean }, req.user!.id));
}));

// ─── Service pricing ──────────────────────────────────────────────────────────
// Suggested 1h/2h prices and the min/max a guide may set, per tour type. Surfaced in
// the admin console alongside commission on the Price & commission page.

adminRouter.get('/price-bounds', requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await svc.getPriceBounds());
}));

adminRouter.get('/price-bounds/history', requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await svc.getPricingHistory());
}));

adminRouter.put('/price-bounds', requireAdmin, asyncHandler(async (req, res) => {
  const body = req.body as {
    serviceType?: string;
    minCents?: number;
    maxCents?: number;
    suggested1hCents?: number;
    suggested2hCents?: number;
  };
  const required = ['serviceType', 'minCents', 'maxCents', 'suggested1hCents', 'suggested2hCents'] as const;
  for (const key of required) {
    if (body[key] === undefined) throw new HttpError(400, 'validation_error', `${key} is required`);
  }
  // Range/consistency checks live in the service so they apply to every caller.
  res.json(
    await svc.setPriceBounds(
      body as { serviceType: string; minCents: number; maxCents: number; suggested1hCents: number; suggested2hCents: number },
      req.user!.id,
    ),
  );
}));

// ─── Transactions & payouts ───────────────────────────────────────────────────

adminRouter.get('/transactions', requireAdmin, asyncHandler(async (req, res) => {
  const { type, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listTransactions({ type, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

// Invoice detail for a single booking (payment payload, ledger, refunds).
adminRouter.get('/transactions/:bookingId', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.getInvoice(req.params['bookingId'] as string));
}));

adminRouter.get('/guide-balances', requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await svc.getGuideBalances());
}));

adminRouter.get('/payouts', requireAdmin, asyncHandler(async (req, res) => {
  const { sellerId, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listPayouts({ sellerId, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

adminRouter.post('/sellers/:id/payouts', requireAdmin, asyncHandler(async (req, res) => {
  const data = req.body as { amountCents: number; method: string; reference?: string; note?: string };
  if (!data.amountCents || !data.method) throw new HttpError(400, 'validation_error', 'amountCents and method required');
  res.status(201).json(await svc.recordPayout(req.params['id'] as string, data, req.user!.id));
}));

// ─── Media uploads ──────────────────────────────────────────────────────────────

// Single image upload (field name `file`) → { url }. Used for university banners/logos.
adminRouter.post('/uploads', requireAdmin, (req, res, next) => {
  imageUpload(req, res, (err: unknown) => {
    if (err) {
      next(err instanceof HttpError ? err : new HttpError(400, 'upload_failed', (err as Error).message));
      return;
    }
    if (!req.file) {
      next(new HttpError(400, 'no_file', 'No file was uploaded'));
      return;
    }
    res.status(201).json({ url: uploadUrl(req.file.filename), filename: req.file.filename });
  });
});

// ─── Schools ──────────────────────────────────────────────────────────────────

adminRouter.get('/schools', requireAdmin, asyncHandler(async (req, res) => {
  const { q, enabled, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listSchools({ q, enabled: enabled !== undefined ? enabled === 'true' : undefined, page: page ? +page : 1, limit: limit ? +limit : 50 }));
}));

adminRouter.post('/schools', requireAdmin, asyncHandler(async (req, res) => {
  const body = req.body as svc.SchoolInput & { name: string };
  if (!body.name) throw new HttpError(400, 'validation_error', 'name is required');
  res.status(201).json(await svc.createSchool(body));
}));

adminRouter.patch('/schools/:id', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.updateSchool(req.params['id'] as string, req.body as svc.SchoolInput, req.user!.id));
}));

// ─── CMS ──────────────────────────────────────────────────────────────────────

adminRouter.get('/cms', requireAdmin, asyncHandler(async (req, res) => {
  const { type, published } = req.query as Record<string, string>;
  res.json(await svc.listCmsBlocks({ type, published: published !== undefined ? published === 'true' : undefined }));
}));

adminRouter.get('/cms/:id', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.getCmsBlock(req.params['id'] as string));
}));

adminRouter.post('/cms', requireAdmin, asyncHandler(async (req, res) => {
  const body = req.body as { key: string; type: string; contentJson: unknown; published?: boolean };
  if (!body.key || !body.type) throw new HttpError(400, 'validation_error', 'key and type required');
  res.status(201).json(await svc.createCmsBlock(body, req.user!.id));
}));

adminRouter.patch('/cms/:id', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.updateCmsBlock(req.params['id'] as string, req.body as { contentJson?: unknown; published?: boolean; type?: string }, req.user!.id));
}));

adminRouter.delete('/cms/:id', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.deleteCmsBlock(req.params['id'] as string, req.user!.id));
}));

// ─── App config ───────────────────────────────────────────────────────────────

adminRouter.get('/app-config', requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await svc.getAppConfig());
}));

adminRouter.put('/app-config', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.setAppConfig(req.body as { minSupportedVersion?: string; forceUpdateMessage?: string | null; maintenanceBanner?: string | null; featureFlagsJson?: unknown; emailNotificationsEnabled?: boolean; pushNotificationsEnabled?: boolean }, req.user!.id));
}));

// Broadcast a push notification to every registered mobile device.
adminRouter.post('/app-config/broadcast-push', requireAdmin, asyncHandler(async (req, res) => {
  const { title, body } = req.body as { title?: string; body?: string };
  if (!body || !body.trim()) throw new HttpError(400, 'validation_error', 'body is required');
  res.json(await svc.broadcastAppPush({ title: title?.trim() || 'Campus Private Tours', body: body.trim() }, req.user!.id));
}));

// ─── Templates ────────────────────────────────────────────────────────────────

adminRouter.get('/templates', requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await svc.listTemplates());
}));

adminRouter.patch('/templates/:id', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.updateTemplate(req.params['id'] as string, req.body as { subject?: string; body?: string }, req.user!.id));
}));

// ─── Contact-us messages ────────────────────────────────────────────────────────

adminRouter.get('/contact-messages', requireAdmin, asyncHandler(async (req, res) => {
  const { q, status, page, limit } = req.query as Record<string, string>;
  res.json(await contactSvc.listContactMessages({ q, status, page: page ? +page : 1, limit: limit ? +limit : 100 }));
}));

adminRouter.get('/contact-messages/:id', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await contactSvc.getContactMessage(req.params['id'] as string));
}));

adminRouter.patch('/contact-messages/:id', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await contactSvc.updateContactMessage(req.params['id'] as string, req.body as { status?: string }));
}));

adminRouter.delete('/contact-messages/:id', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await contactSvc.deleteContactMessage(req.params['id'] as string));
}));

// ─── Push campaigns ───────────────────────────────────────────────────────────

adminRouter.get('/campaigns', requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await svc.listCampaigns());
}));

adminRouter.post('/campaigns', requireAdmin, asyncHandler(async (req, res) => {
  const body = req.body as { segment: string; title: string; body: string; scheduledAt?: string };
  if (!body.segment || !body.title || !body.body) throw new HttpError(400, 'validation_error', 'segment, title, body required');
  res.status(201).json(await svc.createCampaign(body));
}));

adminRouter.post('/campaigns/:id/send', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.sendCampaign(req.params['id'] as string, req.user!.id));
}));

// ─── Admin accounts ───────────────────────────────────────────────────────────

adminRouter.get('/admins', requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await svc.listAdmins());
}));

adminRouter.post('/admins', requireAdmin, asyncHandler(async (req, res) => {
  // adminRoleName is optional: there is only one admin role, so the service
  // assigns it. It is still accepted (and validated) for older callers.
  const body = req.body as { name: string; email: string; password: string; adminRoleName?: string };
  if (!body.name || !body.email || !body.password) {
    throw new HttpError(400, 'validation_error', 'name, email and password are required');
  }
  res.status(201).json(await svc.createAdmin(body, req.user!.id));
}));

adminRouter.patch('/admins/:id', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.updateAdmin(req.params['id'] as string, req.body as { adminRoleName?: string; status?: string }, req.user!.id));
}));

// ─── Audit logs ───────────────────────────────────────────────────────────────

adminRouter.get('/audit-logs', requireAdmin, asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listAuditLogs({ q, page: page ? +page : 1, limit: limit ? +limit : 50 }));
}));

// Recent-activity feed for the topbar bell (signups, bookings, payments, reviews).
adminRouter.get('/notifications', requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await svc.listNotifications());
}));

