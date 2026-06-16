// 7.4 Universities, listings & search
import { Router } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as svc from '../services/catalog.service.js';

export const schoolsRouter = Router();

schoolsRouter.get('/', asyncHandler(async (req, res) => {
  const { q } = req.query as Record<string, string>;
  res.json(await svc.listSchools(q));
}));

schoolsRouter.get('/autocomplete', asyncHandler(async (req, res) => {
  const { q } = req.query as Record<string, string>;
  if (!q) return res.json([]);
  res.json(await svc.autocompleteSchools(q));
}));

schoolsRouter.get('/:slug', asyncHandler(async (req, res) => {
  res.json(await svc.getSchoolBySlug(req.params['slug'] as string));
}));

export const listingsRouter = Router();

listingsRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await svc.getListing(req.params['id'] as string));
}));

listingsRouter.post('/', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  const body = req.body as { schoolId: string; serviceType: string; title: string; description?: string; options: { durationMinutes: number; priceCents: number; label?: string }[] };
  if (!body.schoolId || !body.serviceType || !body.title) throw new HttpError(400, 'validation_error', 'schoolId, serviceType, title required');
  if (!body.options?.length) throw new HttpError(400, 'validation_error', 'At least one option required');
  res.status(201).json(await svc.createListing(req.user!.id, body));
}));

listingsRouter.patch('/:id', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  res.json(await svc.updateListing(req.params['id'] as string, req.user!.id, req.body as { title?: string; description?: string }));
}));

listingsRouter.patch('/:id/status', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  const { status } = req.body as { status?: string };
  if (!status || !['ACTIVE', 'PAUSED'].includes(status)) throw new HttpError(400, 'validation_error', 'status must be ACTIVE or PAUSED');
  res.json(await svc.setListingStatus(req.params['id'] as string, req.user!.id, status as 'ACTIVE' | 'PAUSED'));
}));

listingsRouter.delete('/:id', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  res.json(await svc.deleteListing(req.params['id'] as string, req.user!.id));
}));

export const searchRouter = Router();

searchRouter.get('/guides', asyncHandler(async (req, res) => {
  const { schoolId, serviceType, date, q, page, limit } = req.query as Record<string, string>;
  res.json(await svc.searchGuides({ schoolId, serviceType, date, q, page: page ? +page : 1, limit: limit ? +limit : 20 }));
}));

export const configRouter = Router();

configRouter.get('/price-bounds', asyncHandler(async (_req, res) => {
  res.json(await svc.getPriceBounds());
}));
