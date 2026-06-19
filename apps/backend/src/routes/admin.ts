// 7.9 Admin — operations  +  7.10 Admin — money, content & configuration
import { Router } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import * as svc from '../services/admin.service.js';
import { questionnaireApiRouter } from './api/questionnaire.js';

export const adminRouter = Router();
adminRouter.use(requireAuth);

// Question-level CRUD (add/edit/delete/reorder) — must be registered before
// the broader /questionnaires routes so sub-paths are matched first.
adminRouter.use('/questionnaires', questionnaireApiRouter);

// ─── Dashboard ────────────────────────────────────────────────────────────────

adminRouter.get('/dashboard', requirePermission('dashboard.view'), asyncHandler(async (_req, res) => {
  res.json(await svc.getDashboard());
}));

adminRouter.get('/reports', requirePermission('dashboard.view'), asyncHandler(async (req, res) => {
  const { from, to } = req.query as Record<string, string>;
  res.json(await svc.getReports(from, to));
}));

// ─── Applications ─────────────────────────────────────────────────────────────

adminRouter.get('/applications', requirePermission('applications.decide'), asyncHandler(async (req, res) => {
  const { status, q, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listApplications({ status, q, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

adminRouter.get('/applications/:id', requirePermission('applications.decide'), asyncHandler(async (req, res) => {
  res.json(await svc.getApplication(req.params['id'] as string));
}));

adminRouter.post('/applications/:id/approve', requirePermission('applications.decide'), asyncHandler(async (req, res) => {
  res.json(await svc.decideApplication(req.params['id'] as string, 'APPROVED', undefined, req.user!.id));
}));

adminRouter.post('/applications/:id/reject', requirePermission('applications.decide'), asyncHandler(async (req, res) => {
  const { reason } = req.body as { reason?: string };
  res.json(await svc.decideApplication(req.params['id'] as string, 'REJECTED', reason, req.user!.id));
}));

adminRouter.post('/applications/:id/request-changes', requirePermission('applications.decide'), asyncHandler(async (req, res) => {
  const { reason } = req.body as { reason?: string };
  res.json(await svc.decideApplication(req.params['id'] as string, 'CHANGES_REQUESTED', reason, req.user!.id));
}));

// ─── Questionnaire (singleton) ────────────────────────────────────────────────

adminRouter.get('/questionnaires', requirePermission('questionnaires.manage'), asyncHandler(async (_req, res) => {
  res.json(await svc.getOrCreateQuestionnaire());
}));

// ─── Users ────────────────────────────────────────────────────────────────────

adminRouter.get('/users', requirePermission('users.manage'), asyncHandler(async (req, res) => {
  const { q, role, status, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listUsers({ q, role, status, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

adminRouter.patch('/users/:id', requirePermission('users.manage'), asyncHandler(async (req, res) => {
  res.json(await svc.updateUser(req.params['id'] as string, req.body as { status?: string }, req.user!.id));
}));

// ─── Listings ─────────────────────────────────────────────────────────────────

adminRouter.get('/listings', requirePermission('listings.moderate'), asyncHandler(async (req, res) => {
  const { q, status, schoolId, service, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listListings({ q, status, schoolId, service, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

adminRouter.patch('/listings/:id', requirePermission('listings.moderate'), asyncHandler(async (req, res) => {
  res.json(await svc.moderateListing(req.params['id'] as string, req.body as { status?: string }, req.user!.id));
}));

// ─── Bookings ─────────────────────────────────────────────────────────────────

adminRouter.get('/bookings', requirePermission('bookings.forcecancel'), asyncHandler(async (req, res) => {
  const { status, q, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listBookings({ status, q, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

adminRouter.post('/bookings/:id/force-cancel', requirePermission('bookings.forcecancel'), asyncHandler(async (req, res) => {
  const { reason } = req.body as { reason?: string };
  if (!reason) throw new HttpError(400, 'validation_error', 'reason required');
  res.json(await svc.forceCancelBooking(req.params['id'] as string, reason, req.user!.id));
}));

adminRouter.post('/bookings/:id/refund', requirePermission('refunds.issue'), asyncHandler(async (req, res) => {
  const { amountCents, reason } = req.body as { amountCents?: number; reason: string };
  if (!reason) throw new HttpError(400, 'validation_error', 'reason required');
  res.json(await svc.refundBooking(req.params['id'] as string, amountCents, reason, req.user!.id));
}));

// ─── Refunds ──────────────────────────────────────────────────────────────────

adminRouter.get('/refunds', requirePermission('refunds.issue'), asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listRefunds({ q, page: page ? +page : 1, limit: limit ? +limit : 50 }));
}));

// ─── Reviews ──────────────────────────────────────────────────────────────────

adminRouter.get('/reviews', requirePermission('reviews.moderate'), asyncHandler(async (req, res) => {
  const { q, hidden, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listReviews({ q, hidden: hidden !== undefined ? hidden === 'true' : undefined, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

adminRouter.patch('/reviews/:id', requirePermission('reviews.moderate'), asyncHandler(async (req, res) => {
  const { hidden } = req.body as { hidden: boolean };
  res.json(await svc.moderateReview(req.params['id'] as string, { hidden: Boolean(hidden) }, req.user!.id));
}));

// ─── Commission & settings ────────────────────────────────────────────────────

adminRouter.get('/commission', requirePermission('commission.set'), asyncHandler(async (_req, res) => {
  res.json(await svc.getCommission());
}));

adminRouter.put('/commission', requirePermission('commission.set'), asyncHandler(async (req, res) => {
  const { commissionPct } = req.body as { commissionPct?: number };
  if (commissionPct === undefined || commissionPct < 0 || commissionPct > 100) {
    throw new HttpError(400, 'validation_error', 'commissionPct must be 0–100');
  }
  res.json(await svc.setCommission(commissionPct, req.user!.id));
}));

adminRouter.get('/settings', requirePermission('appconfig.manage'), asyncHandler(async (_req, res) => {
  res.json(await svc.getSettings());
}));

adminRouter.put('/settings', requirePermission('appconfig.manage'), asyncHandler(async (req, res) => {
  res.json(await svc.updateSettings(req.body as { refundWindowsJson?: unknown; requestExpiryHours?: number; maskingEnabled?: boolean }, req.user!.id));
}));

adminRouter.get('/price-bounds', requirePermission('commission.set'), asyncHandler(async (_req, res) => {
  res.json(await svc.getPriceBounds());
}));

adminRouter.put('/price-bounds', requirePermission('commission.set'), asyncHandler(async (req, res) => {
  res.json(await svc.setPriceBounds(req.body as { serviceType: string; minCents: number; maxCents: number; suggested1hCents: number; suggested2hCents: number }));
}));

// ─── Transactions & payouts ───────────────────────────────────────────────────

adminRouter.get('/transactions', requirePermission('transactions.view'), asyncHandler(async (req, res) => {
  const { type, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listTransactions({ type, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

adminRouter.get('/guide-balances', requirePermission('payouts.record'), asyncHandler(async (_req, res) => {
  res.json(await svc.getGuideBalances());
}));

adminRouter.get('/payouts', requirePermission('payouts.record'), asyncHandler(async (req, res) => {
  const { sellerId, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listPayouts({ sellerId, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

adminRouter.post('/sellers/:id/payouts', requirePermission('payouts.record'), asyncHandler(async (req, res) => {
  const data = req.body as { amountCents: number; method: string; reference?: string; note?: string };
  if (!data.amountCents || !data.method) throw new HttpError(400, 'validation_error', 'amountCents and method required');
  res.status(201).json(await svc.recordPayout(req.params['id'] as string, data, req.user!.id));
}));

// ─── Schools ──────────────────────────────────────────────────────────────────

adminRouter.get('/schools', requirePermission('universities.manage'), asyncHandler(async (req, res) => {
  const { q, enabled, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listSchools({ q, enabled: enabled !== undefined ? enabled === 'true' : undefined, page: page ? +page : 1, limit: limit ? +limit : 50 }));
}));

adminRouter.post('/schools', requirePermission('universities.manage'), asyncHandler(async (req, res) => {
  const body = req.body as { name: string; slug: string; location?: string; enabled?: boolean };
  if (!body.name || !body.slug) throw new HttpError(400, 'validation_error', 'name and slug required');
  res.status(201).json(await svc.createSchool(body));
}));

adminRouter.patch('/schools/:id', requirePermission('universities.manage'), asyncHandler(async (req, res) => {
  res.json(await svc.updateSchool(req.params['id'] as string, req.body as { name?: string; location?: string; enabled?: boolean }, req.user!.id));
}));

// ─── CMS ──────────────────────────────────────────────────────────────────────

adminRouter.get('/cms', requirePermission('cms.edit'), asyncHandler(async (req, res) => {
  const { type, published } = req.query as Record<string, string>;
  res.json(await svc.listCmsBlocks({ type, published: published !== undefined ? published === 'true' : undefined }));
}));

adminRouter.get('/cms/:id', requirePermission('cms.edit'), asyncHandler(async (req, res) => {
  res.json(await svc.getCmsBlock(req.params['id'] as string));
}));

adminRouter.post('/cms', requirePermission('cms.edit'), asyncHandler(async (req, res) => {
  const body = req.body as { key: string; type: string; contentJson: unknown; published?: boolean };
  if (!body.key || !body.type) throw new HttpError(400, 'validation_error', 'key and type required');
  res.status(201).json(await svc.createCmsBlock(body, req.user!.id));
}));

adminRouter.patch('/cms/:id', requirePermission('cms.edit'), asyncHandler(async (req, res) => {
  res.json(await svc.updateCmsBlock(req.params['id'] as string, req.body as { contentJson?: unknown; published?: boolean; type?: string }, req.user!.id));
}));

adminRouter.delete('/cms/:id', requirePermission('cms.edit'), asyncHandler(async (req, res) => {
  res.json(await svc.deleteCmsBlock(req.params['id'] as string, req.user!.id));
}));

// ─── App config ───────────────────────────────────────────────────────────────

adminRouter.get('/app-config', requirePermission('appconfig.manage'), asyncHandler(async (_req, res) => {
  res.json(await svc.getAppConfig());
}));

adminRouter.put('/app-config', requirePermission('appconfig.manage'), asyncHandler(async (req, res) => {
  res.json(await svc.setAppConfig(req.body as { minSupportedVersion?: string; forceUpdateMessage?: string | null; maintenanceBanner?: string | null; featureFlagsJson?: unknown }, req.user!.id));
}));

// ─── Templates ────────────────────────────────────────────────────────────────

adminRouter.get('/templates', requirePermission('templates.edit'), asyncHandler(async (_req, res) => {
  res.json(await svc.listTemplates());
}));

adminRouter.patch('/templates/:id', requirePermission('templates.edit'), asyncHandler(async (req, res) => {
  res.json(await svc.updateTemplate(req.params['id'] as string, req.body as { subject?: string; body?: string }, req.user!.id));
}));

// ─── Push campaigns ───────────────────────────────────────────────────────────

adminRouter.get('/campaigns', requirePermission('campaigns.send'), asyncHandler(async (_req, res) => {
  res.json(await svc.listCampaigns());
}));

adminRouter.post('/campaigns', requirePermission('campaigns.send'), asyncHandler(async (req, res) => {
  const body = req.body as { segment: string; title: string; body: string; scheduledAt?: string };
  if (!body.segment || !body.title || !body.body) throw new HttpError(400, 'validation_error', 'segment, title, body required');
  res.status(201).json(await svc.createCampaign(body));
}));

adminRouter.post('/campaigns/:id/send', requirePermission('campaigns.send'), asyncHandler(async (req, res) => {
  res.json(await svc.sendCampaign(req.params['id'] as string, req.user!.id));
}));

// ─── Admin accounts ───────────────────────────────────────────────────────────

adminRouter.get('/admins', requirePermission('admins.manage'), asyncHandler(async (_req, res) => {
  res.json(await svc.listAdmins());
}));

adminRouter.post('/admins', requirePermission('admins.manage'), asyncHandler(async (req, res) => {
  const body = req.body as { name: string; email: string; password: string; adminRoleName: string };
  if (!body.name || !body.email || !body.password || !body.adminRoleName) {
    throw new HttpError(400, 'validation_error', 'name, email, password, adminRoleName required');
  }
  res.status(201).json(await svc.createAdmin(body, req.user!.id));
}));

adminRouter.patch('/admins/:id', requirePermission('admins.manage'), asyncHandler(async (req, res) => {
  res.json(await svc.updateAdmin(req.params['id'] as string, req.body as { adminRoleName?: string; status?: string }, req.user!.id));
}));

// ─── Audit logs ───────────────────────────────────────────────────────────────

adminRouter.get('/audit-logs', requirePermission('audit.view'), asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query as Record<string, string>;
  res.json(await svc.listAuditLogs({ q, page: page ? +page : 1, limit: limit ? +limit : 50 }));
}));

