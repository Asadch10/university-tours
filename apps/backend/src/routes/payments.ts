// 7.6 Payments & webhooks. The Stripe webhook needs the raw body for signature
// verification, so it is mounted separately in app.ts BEFORE the JSON body parser.
import { Router, type Request, type Response } from 'express';
import { notImplemented } from '../lib/http.js';

export const webhooksRouter = Router();

// HOOK /api/v1/webhooks/stripe — signature-verified, idempotent (dedup by event id).
webhooksRouter.post('/stripe', (req: Request, res: Response) => {
  // TODO: verify Stripe-Signature header against STRIPE_WEBHOOK_SECRET using req.body (raw Buffer),
  // then dedupe via webhook_events.stripe_event_id and enqueue webhook.process on the worker.
  notImplemented('webhooks.stripe')(req, res);
});
