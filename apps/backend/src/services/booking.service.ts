import { prisma, Prisma } from '@ucpt/db';
import type Stripe from 'stripe';
import { HttpError } from '../lib/http.js';
import { logger } from '../lib/logger.js';
import { stripe, isStripeEnabled, publishableKey, currency } from '../lib/stripe.js';
import { sendNewBookingEmails, sendBookingStatusEmails, type BookingEmailSummary } from './mailer.service.js';

/** Notify both sides that a request has been sent (guide: new request, guest: sent). */
async function notifyNewBooking(id: string): Promise<void> {
  const b = await prisma.booking.findUnique({
    where: { id },
    include: { buyer: { select: { name: true, email: true } }, seller: { select: { name: true, email: true } } },
  });
  if (!b) return;
  await sendNewBookingEmails({
    guide: { email: b.seller.email, name: b.seller.name },
    guest: { email: b.buyer.email, name: b.buyer.name },
    summary: bookingEmailSummary(b),
  }).catch((err) => logger.error({ err, bookingId: id }, 'New booking emails failed'));
}

/** Email both the guest and guide about a booking's new status (best-effort). */
async function notifyStatusChange(id: string, status: string): Promise<void> {
  const b = await prisma.booking.findUnique({
    where: { id },
    include: { buyer: { select: { name: true, email: true } }, seller: { select: { name: true, email: true } } },
  });
  if (!b) return;
  await sendBookingStatusEmails({
    guide: { email: b.seller.email, name: b.seller.name },
    guest: { email: b.buyer.email, name: b.buyer.name },
    status,
    summary: bookingEmailSummary(b),
  }).catch((err) => logger.error({ err, bookingId: id }, 'Booking status emails failed'));
}

/** Friendly service label for a ServiceType. */
export function serviceLabelFor(t: string): string {
  return t === 'VIDEO_CONSULTATION' ? 'Video chat' : t === 'CONSULTATION' ? 'Consultancy' : 'Campus tour';
}

/** Build the summary shown in every booking email from a booking row. */
export function bookingEmailSummary(b: {
  serviceType: string;
  scheduledDate: Date;
  scheduledTime: string | null;
  durationMinutes: number | null;
  guestCount: number;
  grossCents: number;
  listingTitle: string | null;
  schoolName: string | null;
}): BookingEmailSummary {
  const when =
    new Date(b.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) +
    (b.scheduledTime ? ` · ${b.scheduledTime}` : '');
  const duration = b.durationMinutes
    ? b.durationMinutes % 60 === 0
      ? `${b.durationMinutes / 60} hour${b.durationMinutes > 60 ? 's' : ''}`
      : `${b.durationMinutes} minutes`
    : null;
  return {
    service: serviceLabelFor(b.serviceType),
    whenText: when,
    durationText: duration,
    guests: b.guestCount,
    amountCents: b.grossCents,
    title: b.listingTitle,
    school: b.schoolName,
  };
}

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
  const payEnabled = isStripeEnabled();

  const booking = await prisma.booking.create({
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
      // With payments on, the booking is invisible to the guide until the card
      // hold clears (PENDING_PAYMENT → PENDING). Without Stripe it goes straight to PENDING.
      status: payEnabled ? 'PENDING_PAYMENT' : 'PENDING',
      requestedAt: new Date(),
      grossCents: option.priceCents,
      commissionPctSnapshot: commissionPct,
      events: {
        create: { fromState: null, toState: payEnabled ? 'PENDING_PAYMENT' : 'PENDING', actor: buyerId },
      },
    },
    include: {
      listing: { select: { title: true, serviceType: true } },
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      option: true,
    },
  });

  if (!payEnabled) {
    void notifyNewBooking(booking.id);
    return { ...booking, clientSecret: null, publishableKey: null };
  }
  const pay = await createPaymentIntentForBooking(booking.id, booking.grossCents, booking.serviceType);
  return { ...booking, ...pay };
}

// ─── Stripe payment intent (authorize-then-capture) ───────────────────────────

/**
 * Create a manual-capture PaymentIntent for a booking and store its id. The card is
 * only authorized (a hold); we capture later when the guide accepts. Returns the
 * client secret + publishable key the browser needs to render the Payment Element.
 */
async function createPaymentIntentForBooking(bookingId: string, grossCents: number, serviceType: string) {
  const intent = await stripe().paymentIntents.create({
    amount: grossCents,
    currency,
    capture_method: 'manual',
    automatic_payment_methods: { enabled: true },
    description: `${serviceLabelFor(serviceType)} booking ${bookingId}`,
    metadata: { bookingId },
  });
  await prisma.booking.update({ where: { id: bookingId }, data: { stripePaymentIntentId: intent.id } });
  return { clientSecret: intent.client_secret, publishableKey: publishableKey() };
}

/**
 * Persist the full Stripe PaymentIntent payload + the extracted invoice fields
 * (card, billing, receipt) as the booking's Payment record. Upsert so it works for
 * both the initial authorization and later capture. `intent` should be retrieved
 * with `latest_charge` expanded so card/billing/receipt are available.
 */
async function savePaymentFromIntent(
  bookingId: string,
  intent: Stripe.PaymentIntent,
  opts: { capturedAt?: Date } = {},
): Promise<void> {
  const charge =
    intent.latest_charge && typeof intent.latest_charge === 'object'
      ? (intent.latest_charge as Stripe.Charge)
      : null;
  const card = charge?.payment_method_details?.card ?? null;
  const billing = charge?.billing_details ?? null;
  const authorized = intent.status === 'requires_capture' || intent.status === 'succeeded';

  // Strip Stripe's non-payload `lastResponse` (present on retrieved objects) before storing.
  const raw = JSON.parse(JSON.stringify(intent)) as Record<string, unknown>;
  delete raw['lastResponse'];

  const data = {
    stripePaymentIntentId: intent.id,
    stripeChargeId: charge?.id ?? null,
    amountCents: intent.amount,
    amountRefundedCents: charge?.amount_refunded ?? 0,
    currency: intent.currency,
    status: charge?.refunded
      ? 'refunded'
      : charge && charge.amount_refunded > 0
        ? 'partially_refunded'
        : intent.status,
    cardBrand: card?.brand ?? null,
    cardLast4: card?.last4 ?? null,
    cardExpMonth: card?.exp_month ?? null,
    cardExpYear: card?.exp_year ?? null,
    billingName: billing?.name ?? null,
    billingEmail: billing?.email ?? null,
    receiptUrl: charge?.receipt_url ?? null,
    rawJson: raw as Prisma.InputJsonValue,
    ...(authorized ? { authorizedAt: new Date() } : {}),
    ...(opts.capturedAt ? { capturedAt: opts.capturedAt } : {}),
  };

  await prisma.payment
    .upsert({ where: { bookingId }, create: { bookingId, ...data }, update: data })
    .catch((err) => logger.error({ err, bookingId }, 'Saving payment record failed'));
}

/** Re-read a PaymentIntent from Stripe and refresh the stored Payment (e.g. after a refund). */
export async function syncPaymentRecord(bookingId: string, paymentIntentId: string): Promise<void> {
  if (!isStripeEnabled()) return;
  try {
    const intent = await stripe().paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] });
    await savePaymentFromIntent(bookingId, intent);
  } catch (err) {
    logger.error({ err, bookingId }, 'Payment record sync failed');
  }
}

// ─── Create booking against a website "become a guide" listing ────────────────
// Those listings live in User.profileJson (no Listing/Option row), so the booking
// stores a snapshot (title, service, duration, price) instead of FK references.

const GUIDE_SERVICE_TYPES = ['CAMPUS_TOUR', 'VIDEO_CONSULTATION', 'CONSULTATION'] as const;

export async function createGuideBooking(buyerId: string, data: {
  sellerId: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime?: string;
  guestCount?: number;
  durationMinutes?: number;
  priceCents: number;
  listingTitle?: string;
  schoolName?: string;
  noteForGuide?: string;
}) {
  if (data.sellerId === buyerId) throw new HttpError(400, 'cannot_book_self', 'You cannot book your own listing');
  if (!GUIDE_SERVICE_TYPES.includes(data.serviceType as never)) {
    throw new HttpError(400, 'validation_error', 'Invalid tour type');
  }
  if (!data.scheduledDate) throw new HttpError(400, 'validation_error', 'A date is required');
  if (!Number.isFinite(data.priceCents) || data.priceCents < 0) throw new HttpError(400, 'validation_error', 'Invalid price');

  // The seller must be a published website guide.
  const seller = await prisma.user.findUnique({ where: { id: data.sellerId }, select: { id: true, role: true, status: true, profileJson: true } });
  const gl = ((seller?.profileJson as Record<string, unknown> | null)?.guideListing ?? null) as Record<string, unknown> | null;
  if (!seller || seller.status !== 'ACTIVE' || !gl || gl.status !== 'published') {
    throw new HttpError(404, 'not_found', 'Guide not found or not available for booking');
  }

  const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  const commissionPct = settings?.commissionPct ?? 25;
  const payEnabled = isStripeEnabled();

  const booking = await prisma.booking.create({
    data: {
      buyerId,
      sellerId: data.sellerId,
      serviceType: data.serviceType as never,
      listingTitle: data.listingTitle ?? (typeof gl.listingTitle === 'string' ? gl.listingTitle : null),
      durationMinutes: data.durationMinutes ?? null,
      schoolName: data.schoolName ?? (typeof gl.school === 'string' ? gl.school : null),
      scheduledDate: new Date(data.scheduledDate),
      scheduledTime: data.scheduledTime,
      guestCount: data.guestCount ?? 1,
      noteForGuide: data.noteForGuide,
      // Payments on → hidden until the card hold clears; off → visible immediately.
      status: payEnabled ? 'PENDING_PAYMENT' : 'PENDING',
      requestedAt: new Date(),
      grossCents: data.priceCents,
      commissionPctSnapshot: commissionPct,
      events: { create: { fromState: null, toState: payEnabled ? 'PENDING_PAYMENT' : 'PENDING', actor: buyerId } },
    },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  });

  if (!payEnabled) {
    // No Stripe: notify both sides immediately (guide gets "new request", guest "sent").
    void notifyNewBooking(booking.id);
    return { ...booking, clientSecret: null, publishableKey: null };
  }
  // Emails are sent once the card is authorized (see authorizeBookingPayment).
  const pay = await createPaymentIntentForBooking(booking.id, booking.grossCents, booking.serviceType);
  return { ...booking, ...pay };
}

// ─── Authorize (card hold cleared) ────────────────────────────────────────────

/**
 * Move a booking from PENDING_PAYMENT → PENDING once its PaymentIntent is authorized
 * (status `requires_capture`). Idempotent — safe to call from both the browser's
 * post-payment callback and the Stripe webhook. Returns true if it transitioned.
 */
export async function authorizeBookingPayment(paymentIntentId: string): Promise<boolean> {
  const booking = await prisma.booking.findFirst({ where: { stripePaymentIntentId: paymentIntentId } });
  if (!booking) return false;
  if (booking.status !== 'PENDING_PAYMENT') return false; // already handled

  const intent = await stripe().paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] });
  // `requires_capture` = card authorized, awaiting our capture. Anything else isn't a hold yet.
  if (intent.status !== 'requires_capture' && intent.status !== 'succeeded') return false;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: booking.id }, data: { status: 'PENDING' } });
    await tx.bookingEvent.create({ data: { bookingId: booking.id, fromState: 'PENDING_PAYMENT', toState: 'PENDING', actor: booking.buyerId, reason: 'payment authorized' } });
  });
  // Persist the full payment payload (guest name, card, receipt, raw JSON) for the invoice view.
  await savePaymentFromIntent(booking.id, intent);
  void notifyNewBooking(booking.id);
  return true;
}

/** Mark a still-unpaid booking EXPIRED when its PaymentIntent is canceled (webhook). */
export async function expireUnpaidBooking(paymentIntentId: string): Promise<boolean> {
  const booking = await prisma.booking.findFirst({ where: { stripePaymentIntentId: paymentIntentId } });
  if (!booking || booking.status !== 'PENDING_PAYMENT') return false;
  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: booking.id }, data: { status: 'EXPIRED' } });
    await tx.bookingEvent.create({ data: { bookingId: booking.id, fromState: 'PENDING_PAYMENT', toState: 'EXPIRED', actor: 'system', reason: 'payment not completed' } });
  });
  return true;
}

/** Browser-driven confirmation after the Payment Element succeeds (buyer-owned). */
export async function confirmBookingPayment(id: string, userId: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new HttpError(404, 'not_found', 'Booking not found');
  if (booking.buyerId !== userId) throw new HttpError(403, 'forbidden', 'Not your booking');
  if (!booking.stripePaymentIntentId) throw new HttpError(409, 'invalid_state', 'Booking has no payment');
  if (booking.status === 'PENDING_PAYMENT') {
    await authorizeBookingPayment(booking.stripePaymentIntentId);
  }
  return { ok: true, status: booking.status === 'PENDING_PAYMENT' ? 'PENDING' : booking.status };
}

// ─── List bookings ────────────────────────────────────────────────────────────

export async function listBookings(
  userId: string,
  perspective: 'buyer' | 'seller',
  page = 1,
  limit = 50,
) {
  // "As guest" (buyer) → tours I booked; "As guide" (seller) → tours I host.
  // Unpaid bookings (PENDING_PAYMENT) are hidden from both lists until the hold clears.
  const where = {
    ...(perspective === 'seller' ? { sellerId: userId } : { buyerId: userId }),
    status: { not: 'PENDING_PAYMENT' as const },
  };

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        listing: { select: { title: true, serviceType: true, school: { select: { name: true } } } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        option: true,
        payment: { select: { status: true } },
      },
      // listingTitle / durationMinutes / schoolName snapshots come through by default.
      orderBy: { scheduledDate: 'desc' },
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

  // Capture the authorized card hold (actually take the money). If Stripe isn't
  // configured, or the booking predates payments, we skip and just confirm.
  if (isStripeEnabled() && booking.stripePaymentIntentId) {
    try {
      const captured = await stripe().paymentIntents.capture(booking.stripePaymentIntentId, {
        expand: ['latest_charge'],
      });
      await savePaymentFromIntent(id, captured, { capturedAt: new Date() });
    } catch (err) {
      logger.error({ err, bookingId: id }, 'Stripe capture failed');
      throw new HttpError(502, 'capture_failed', 'Could not capture payment — please try again');
    }
  }

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
  void notifyStatusChange(id, 'CONFIRMED');
  return { ok: true };
}

/** Release an uncaptured card hold (guide declined / booking cancelled before capture). */
async function releaseHold(paymentIntentId: string | null, bookingId: string): Promise<void> {
  if (!isStripeEnabled() || !paymentIntentId) return;
  try {
    await stripe().paymentIntents.cancel(paymentIntentId);
  } catch (err) {
    // Non-fatal: the hold expires on its own; log and continue with the state change.
    logger.error({ err, bookingId }, 'Stripe payment intent cancel failed');
  }
}

export async function declineBooking(id: string, sellerId: string, reason?: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new HttpError(404, 'not_found', 'Booking not found');
  if (booking.sellerId !== sellerId) throw new HttpError(403, 'forbidden', 'Not your booking');
  if (booking.status !== 'PENDING') throw new HttpError(409, 'invalid_state', `Cannot decline booking in state ${booking.status}`);

  // Card was only authorized (never captured) — release the hold, no charge.
  await releaseHold(booking.stripePaymentIntentId, id);

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id }, data: { status: 'DECLINED' } });
    await tx.bookingEvent.create({ data: { bookingId: id, fromState: 'PENDING', toState: 'DECLINED', actor: sellerId, reason } });
  });
  void notifyStatusChange(id, 'DECLINED');
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
  void notifyStatusChange(id, 'COMPLETED');
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

  // PENDING → only a hold exists, release it. CONFIRMED → money was captured, refund it.
  if (booking.status === 'PENDING') {
    await releaseHold(booking.stripePaymentIntentId, id);
  } else if (booking.status === 'CONFIRMED' && isStripeEnabled() && booking.stripePaymentIntentId) {
    try {
      const refund = await stripe().refunds.create({ payment_intent: booking.stripePaymentIntentId });
      const commissionCents = Math.round((booking.grossCents * (booking.commissionPctSnapshot ?? 25)) / 100);
      await prisma.$transaction(async (tx) => {
        await tx.refund.create({ data: { bookingId: id, amountCents: booking.grossCents, stripeRefundId: refund.id, reason: reason ?? 'Booking cancelled', createdBy: userId } });
        await tx.ledgerEntry.create({
          data: { bookingId: id, type: 'REFUND', grossCents: -booking.grossCents, commissionPct: booking.commissionPctSnapshot ?? 25, commissionCents: -commissionCents, sellerNetCents: -(booking.grossCents - commissionCents) },
        });
      });
      await syncPaymentRecord(id, booking.stripePaymentIntentId);
    } catch (err) {
      logger.error({ err, bookingId: id }, 'Stripe refund on cancel failed');
      throw new HttpError(502, 'refund_failed', 'Could not refund payment — please try again');
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id }, data: { status: 'CANCELLED' } });
    await tx.bookingEvent.create({ data: { bookingId: id, fromState: booking.status as never, toState: 'CANCELLED', actor: userId, reason } });
  });
  void notifyStatusChange(id, 'CANCELLED');
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
