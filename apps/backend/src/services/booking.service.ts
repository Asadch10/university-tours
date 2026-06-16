import { prisma } from '@ucpt/db';
import { HttpError } from '../lib/http.js';

// ─── Create booking (Buyer) ───────────────────────────────────────────────────

export async function createBooking(buyerId: string, data: {
  listingId: string;
  optionId: string;
  scheduledDate: string;
  scheduledTime?: string;
  guestCount?: number;
  noteForGuide?: string;
}) {
  const listing = await prisma.listing.findUnique({ where: { id: data.listingId }, include: { options: true } });
  if (!listing || listing.status !== 'ACTIVE') throw new HttpError(404, 'not_found', 'Listing not found or not active');

  const option = listing.options.find((o) => o.id === data.optionId);
  if (!option) throw new HttpError(400, 'invalid_option', 'Invalid listing option');

  const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  const commissionPct = settings?.commissionPct ?? 25;

  return prisma.booking.create({
    data: {
      buyerId,
      sellerId: listing.sellerId,
      listingId: listing.id,
      optionId: option.id,
      serviceType: listing.serviceType,
      schoolId: listing.schoolId,
      scheduledDate: new Date(data.scheduledDate),
      scheduledTime: data.scheduledTime,
      guestCount: data.guestCount ?? 1,
      noteForGuide: data.noteForGuide,
      status: 'PENDING',
      requestedAt: new Date(),
      grossCents: option.priceCents,
      commissionPctSnapshot: commissionPct,
      events: {
        create: { fromState: null, toState: 'PENDING', actor: buyerId },
      },
    },
    include: {
      listing: { select: { title: true, serviceType: true } },
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      option: true,
    },
  });
}

// ─── List bookings ────────────────────────────────────────────────────────────

export async function listBookings(userId: string, role: string, page = 1, limit = 20) {
  const where = role === 'BUYER'
    ? { buyerId: userId }
    : role === 'SELLER'
      ? { sellerId: userId }
      : {};

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        listing: { select: { title: true, serviceType: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        option: true,
      },
      orderBy: { requestedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function getBooking(id: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: { select: { title: true, serviceType: true } },
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      option: true,
      events: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!booking) throw new HttpError(404, 'not_found', 'Booking not found');
  if (booking.buyerId !== userId && booking.sellerId !== userId) {
    throw new HttpError(403, 'forbidden', 'Access denied');
  }
  return booking;
}

// ─── Seller actions ───────────────────────────────────────────────────────────

export async function acceptBooking(id: string, sellerId: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new HttpError(404, 'not_found', 'Booking not found');
  if (booking.sellerId !== sellerId) throw new HttpError(403, 'forbidden', 'Not your booking');
  if (booking.status !== 'PENDING') throw new HttpError(409, 'invalid_state', `Cannot accept booking in state ${booking.status}`);

  const commissionCents = Math.round((booking.grossCents * (booking.commissionPctSnapshot ?? 25)) / 100);

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id }, data: { status: 'CONFIRMED', confirmedAt: new Date() } });
    await tx.bookingEvent.create({ data: { bookingId: id, fromState: 'PENDING', toState: 'CONFIRMED', actor: sellerId } });
    await tx.ledgerEntry.create({
      data: {
        bookingId: id,
        type: 'CAPTURE',
        grossCents: booking.grossCents,
        commissionPct: booking.commissionPctSnapshot ?? 25,
        commissionCents,
        sellerNetCents: booking.grossCents - commissionCents,
      },
    });
  });
  return { ok: true };
}

export async function declineBooking(id: string, sellerId: string, reason?: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new HttpError(404, 'not_found', 'Booking not found');
  if (booking.sellerId !== sellerId) throw new HttpError(403, 'forbidden', 'Not your booking');
  if (booking.status !== 'PENDING') throw new HttpError(409, 'invalid_state', `Cannot decline booking in state ${booking.status}`);

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id }, data: { status: 'DECLINED' } });
    await tx.bookingEvent.create({ data: { bookingId: id, fromState: 'PENDING', toState: 'DECLINED', actor: sellerId, reason } });
  });
  return { ok: true };
}

export async function completeBooking(id: string, sellerId: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new HttpError(404, 'not_found', 'Booking not found');
  if (booking.sellerId !== sellerId) throw new HttpError(403, 'forbidden', 'Not your booking');
  if (booking.status !== 'CONFIRMED') throw new HttpError(409, 'invalid_state', `Cannot complete booking in state ${booking.status}`);

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id }, data: { status: 'COMPLETED', completedAt: new Date() } });
    await tx.bookingEvent.create({ data: { bookingId: id, fromState: 'CONFIRMED', toState: 'COMPLETED', actor: sellerId } });
  });
  return { ok: true };
}

// ─── Buyer / shared cancel ────────────────────────────────────────────────────

export async function cancelBooking(id: string, userId: string, reason?: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new HttpError(404, 'not_found', 'Booking not found');
  if (booking.buyerId !== userId && booking.sellerId !== userId) throw new HttpError(403, 'forbidden', 'Access denied');
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    throw new HttpError(409, 'invalid_state', `Cannot cancel booking in state ${booking.status}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id }, data: { status: 'CANCELLED' } });
    await tx.bookingEvent.create({ data: { bookingId: id, fromState: booking.status as never, toState: 'CANCELLED', actor: userId, reason } });
  });
  return { ok: true };
}

export async function getBookingEvents(id: string, userId: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new HttpError(404, 'not_found', 'Booking not found');
  if (booking.buyerId !== userId && booking.sellerId !== userId) throw new HttpError(403, 'forbidden', 'Access denied');
  return prisma.bookingEvent.findMany({ where: { bookingId: id }, orderBy: { createdAt: 'asc' } });
}

// ─── Review ───────────────────────────────────────────────────────────────────

export async function submitReview(bookingId: string, buyerId: string, data: { rating: number; text?: string }) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new HttpError(404, 'not_found', 'Booking not found');
  if (booking.buyerId !== buyerId) throw new HttpError(403, 'forbidden', 'Not your booking');
  if (booking.status !== 'COMPLETED') throw new HttpError(409, 'not_completed', 'Can only review completed bookings');

  const existing = await prisma.review.findFirst({ where: { bookingId } });
  if (existing) throw new HttpError(409, 'already_reviewed', 'Booking already reviewed');

  return prisma.$transaction(async (tx) => {
    const r = await tx.review.create({
      data: { bookingId, buyerId, sellerId: booking.sellerId, rating: data.rating, text: data.text },
    });
    const agg = await tx.review.aggregate({ where: { sellerId: booking.sellerId, hidden: false }, _avg: { rating: true }, _count: true });
    await tx.sellerProfile.update({
      where: { userId: booking.sellerId },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
    });
    await tx.booking.update({ where: { id: bookingId }, data: { reviewedAt: new Date() } });
    return r;
  });
}
