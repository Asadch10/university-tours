// 7.5 Bookings & lifecycle  +  review create (7.7)
import { Router } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as svc from '../services/booking.service.js';

export const bookingsRouter = Router();

bookingsRouter.post('/', requireAuth, requireRole('BUYER'), asyncHandler(async (req, res) => {
  const body = req.body as { listingId: string; optionId: string; scheduledDate: string; scheduledTime?: string; guestCount?: number; noteForGuide?: string };
  if (!body.listingId || !body.optionId || !body.scheduledDate) {
    throw new HttpError(400, 'validation_error', 'listingId, optionId, scheduledDate required');
  }
  res.status(201).json(await svc.createBooking(req.user!.id, body));
}));

bookingsRouter.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { page, limit } = req.query as Record<string, string>;
  res.json(await svc.listBookings(req.user!.id, req.user!.role, page ? +page : 1, limit ? +limit : 20));
}));

bookingsRouter.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  res.json(await svc.getBooking(req.params['id'] as string, req.user!.id));
}));

bookingsRouter.post('/:id/accept', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  res.json(await svc.acceptBooking(req.params['id'] as string, req.user!.id));
}));

bookingsRouter.post('/:id/decline', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  const { reason } = req.body as { reason?: string };
  res.json(await svc.declineBooking(req.params['id'] as string, req.user!.id, reason));
}));

bookingsRouter.post('/:id/cancel', requireAuth, asyncHandler(async (req, res) => {
  const { reason } = req.body as { reason?: string };
  res.json(await svc.cancelBooking(req.params['id'] as string, req.user!.id, reason));
}));

bookingsRouter.post('/:id/complete', requireAuth, requireRole('SELLER'), asyncHandler(async (req, res) => {
  res.json(await svc.completeBooking(req.params['id'] as string, req.user!.id));
}));

bookingsRouter.get('/:id/events', requireAuth, asyncHandler(async (req, res) => {
  res.json(await svc.getBookingEvents(req.params['id'] as string, req.user!.id));
}));

bookingsRouter.post('/:id/review', requireAuth, requireRole('BUYER'), asyncHandler(async (req, res) => {
  const { rating, text } = req.body as { rating?: number; text?: string };
  if (!rating || rating < 1 || rating > 5) throw new HttpError(400, 'validation_error', 'rating must be 1–5');
  res.status(201).json(await svc.submitReview(req.params['id'] as string, req.user!.id, { rating, text }));
}));
