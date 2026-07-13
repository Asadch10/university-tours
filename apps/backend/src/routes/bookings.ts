// 7.5 Bookings & lifecycle  +  review create (7.7)
import { Router } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import * as svc from '../services/booking.service.js';

export const bookingsRouter = Router();

// Any signed-in user can book as a guest — a user is a guest AND a guide at the
// same time (My tours has an "As guest / As guide" view switch), so we never gate
// guest actions on role. The buyer is whoever is logged in.
bookingsRouter.post('/', requireAuth, asyncHandler(async (req, res) => {
  const body = req.body as { listingId: string; optionId: string; scheduledDate: string; scheduledTime?: string; guestCount?: number; noteForGuide?: string };
  if (!body.listingId || !body.optionId || !body.scheduledDate) {
    throw new HttpError(400, 'validation_error', 'listingId, optionId, scheduledDate required');
  }
  res.status(201).json(await svc.createBooking(req.user!.id, body));
}));

// Booking against a website "become a guide" listing (no Listing/Option row).
// Any signed-in user can book a guide (except themselves).
bookingsRouter.post('/guide', requireAuth, asyncHandler(async (req, res) => {
  const body = req.body as {
    sellerId?: string; serviceType?: string; scheduledDate?: string; scheduledTime?: string;
    guestCount?: number; durationMinutes?: number; priceCents?: number; listingTitle?: string;
    schoolName?: string; noteForGuide?: string;
  };
  if (!body.sellerId || !body.serviceType || !body.scheduledDate || typeof body.priceCents !== 'number') {
    throw new HttpError(400, 'validation_error', 'sellerId, serviceType, scheduledDate and priceCents are required');
  }
  res.status(201).json(await svc.createGuideBooking(req.user!.id, {
    sellerId: body.sellerId,
    serviceType: body.serviceType,
    scheduledDate: body.scheduledDate,
    scheduledTime: body.scheduledTime,
    guestCount: body.guestCount,
    durationMinutes: body.durationMinutes,
    priceCents: body.priceCents,
    listingTitle: body.listingTitle,
    schoolName: body.schoolName,
    noteForGuide: body.noteForGuide,
  }));
}));

// Called by the browser after the Payment Element authorizes the card — flips the
// booking from PENDING_PAYMENT → PENDING (idempotent; the webhook is a backstop).
bookingsRouter.post('/:id/confirm-payment', requireAuth, asyncHandler(async (req, res) => {
  res.json(await svc.confirmBookingPayment(req.params['id'] as string, req.user!.id));
}));

bookingsRouter.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { page, limit, as } = req.query as Record<string, string>;
  // ?as=guide → tours I host (seller); default ?as=guest → tours I booked (buyer).
  const perspective = as === 'guide' ? 'seller' : 'buyer';
  res.json(await svc.listBookings(req.user!.id, perspective, page ? +page : 1, limit ? +limit : 50));
}));

bookingsRouter.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  res.json(await svc.getBooking(req.params['id'] as string, req.user!.id));
}));

// Guide actions: authorized by booking ownership (service checks sellerId === userId),
// NOT by the role enum — a user is a guest and a guide at once, and a user's role can
// even flip back to BUYER (e.g. after deleting their listing) while they still own
// past bookings as the seller.
bookingsRouter.post('/:id/accept', requireAuth, asyncHandler(async (req, res) => {
  const { videoLink } = req.body as { videoLink?: string };
  res.json(await svc.acceptBooking(req.params['id'] as string, req.user!.id, videoLink));
}));

bookingsRouter.post('/:id/decline', requireAuth, asyncHandler(async (req, res) => {
  const { reason } = req.body as { reason?: string };
  res.json(await svc.declineBooking(req.params['id'] as string, req.user!.id, reason));
}));

bookingsRouter.post('/:id/cancel', requireAuth, asyncHandler(async (req, res) => {
  const { reason } = req.body as { reason?: string };
  res.json(await svc.cancelBooking(req.params['id'] as string, req.user!.id, reason));
}));

bookingsRouter.post('/:id/complete', requireAuth, asyncHandler(async (req, res) => {
  res.json(await svc.completeBooking(req.params['id'] as string, req.user!.id));
}));

bookingsRouter.get('/:id/events', requireAuth, asyncHandler(async (req, res) => {
  res.json(await svc.getBookingEvents(req.params['id'] as string, req.user!.id));
}));

// Any authenticated user can review — a guide (role SELLER) can also book as a
// guest, so we don't gate on BUYER. submitReview enforces buyer ownership of the
// booking (booking.buyerId === userId), which is the real authorization check.
bookingsRouter.post('/:id/review', requireAuth, asyncHandler(async (req, res) => {
  const { rating, text } = req.body as { rating?: number; text?: string };
  if (!rating || rating < 1 || rating > 5) throw new HttpError(400, 'validation_error', 'rating must be 1–5');
  res.status(201).json(await svc.submitReview(req.params['id'] as string, req.user!.id, { rating, text }));
}));
