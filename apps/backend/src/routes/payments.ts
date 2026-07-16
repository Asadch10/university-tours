// 7.6 Payments & webhooks. The Stripe webhook needs the raw body for signature
// verification, so it is mounted separately in app.ts BEFORE the JSON body parser.
import { Router, type Request, type Response } from 'express';
import type Stripe from 'stripe';
import { prisma } from '@ucpt/db';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';
import { stripe, isStripeEnabled } from '../lib/stripe.js';
import { authorizeBookingPayment, expireUnpaidBooking } from '../services/booking.service.js';
import { syncConnectAccount } from '../services/connect.service.js';

export const webhooksRouter = Router();

// HOOK /api/v1/webhooks/stripe — signature-verified, idempotent (dedup by event id).
webhooksRouter.post('/stripe', async (req: Request, res: Response) => {
  if (!isStripeEnabled()) return res.status(503).json({ error: 'Stripe not configured', code: 'stripe_disabled' });

  const secret = config.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers['stripe-signature'];
  if (!secret || !secret.startsWith('whsec_') || !sig) {
    return res.status(400).json({ error: 'Missing webhook signature/secret', code: 'bad_signature' });
  }

  let event: Stripe.Event;
  try {
    // req.body is the raw Buffer (express.raw mounted before json() in app.ts).
    event = stripe().webhooks.constructEvent(req.body as Buffer, sig as string, secret);
  } catch (err) {
    logger.warn({ err }, 'Stripe webhook signature verification failed');
    return res.status(400).json({ error: 'Invalid signature', code: 'bad_signature' });
  }

  // Idempotency: ignore events we have already processed.
  const seen = await prisma.webhookEvent.findUnique({ where: { stripeEventId: event.id } });
  if (seen) return res.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case 'payment_intent.amount_capturable_updated':
      case 'payment_intent.succeeded': {
        // Card authorized (hold cleared) → make the booking visible to the guide.
        const pi = event.data.object as Stripe.PaymentIntent;
        await authorizeBookingPayment(pi.id);
        break;
      }
      case 'payment_intent.canceled':
      case 'payment_intent.payment_failed': {
        // Hold released / payment failed → expire the still-unpaid booking.
        const pi = event.data.object as Stripe.PaymentIntent;
        await expireUnpaidBooking(pi.id);
        break;
      }
      case 'account.updated': {
        // A guide's Connect onboarding progressed → cache whether they can be paid.
        const acct = event.data.object as Stripe.Account;
        await syncConnectAccount(acct.id, !!acct.payouts_enabled);
        break;
      }
      default:
        // Acknowledge everything else so Stripe stops retrying.
        break;
    }
    await prisma.webhookEvent.create({ data: { stripeEventId: event.id, type: event.type } });
  } catch (err) {
    logger.error({ err, eventId: event.id, type: event.type }, 'Stripe webhook handler failed');
    // Return 500 so Stripe retries; the event was NOT recorded, so a retry is safe.
    return res.status(500).json({ error: 'Webhook handler error', code: 'handler_error' });
  }

  return res.json({ received: true });
});
