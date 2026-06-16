// 7.7 Chat & reviews (REST fallback; realtime is on the worker's Socket.IO gateway)
import { Router } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '@ucpt/db';

export const conversationsRouter = Router();

conversationsRouter.get('/', requireAuth, asyncHandler(async (req, res) => {
  // Return conversations (bookings with messages) for this user
  const conversations = await prisma.booking.findMany({
    where: {
      OR: [{ buyerId: req.user!.id }, { sellerId: req.user!.id }],
      status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
    },
    include: {
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      listing: { select: { title: true } },
    },
    orderBy: { requestedAt: 'desc' },
  });
  res.json(conversations);
}));

conversationsRouter.get('/:id/messages', requireAuth, asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) throw new HttpError(404, 'not_found', 'Conversation not found');
  if (booking.buyerId !== req.user!.id && booking.sellerId !== req.user!.id) {
    throw new HttpError(403, 'forbidden', 'Access denied');
  }
  // Chat messages not yet stored in DB — return empty array (Socket.IO handles realtime)
  res.json({ data: [], bookingId: req.params.id });
}));

conversationsRouter.post('/:id/messages', requireAuth, asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) throw new HttpError(404, 'not_found', 'Conversation not found');
  if (booking.buyerId !== req.user!.id && booking.sellerId !== req.user!.id) {
    throw new HttpError(403, 'forbidden', 'Access denied');
  }
  const { text } = req.body as { text?: string };
  if (!text?.trim()) throw new HttpError(400, 'validation_error', 'text required');
  // In v1 real-time messaging is via Socket.IO — REST returns stub for now
  res.status(201).json({ ok: true, message: 'Message routing via Socket.IO in production' });
}));

conversationsRouter.post('/:id/attachments', requireAuth, asyncHandler(async (_req, res) => {
  res.status(201).json({ ok: true, message: 'Attachment upload not implemented in v1' });
}));
