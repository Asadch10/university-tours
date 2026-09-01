// Identity verification endpoints. See services/verification.service.ts for what
// Stripe Identity does and does not prove.
import { Router } from 'express';
import type { ApplicantKind } from '@ucpt/db';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import * as svc from '../services/verification.service.js';

/** `?kind=` → GUIDE unless explicitly COUNSELOR, matching the applications routes. */
function kindOf(req: { query: Record<string, unknown>; body?: unknown }): ApplicantKind {
  const raw = req.query['kind'] ?? (req.body as { kind?: unknown } | undefined)?.kind;
  return String(raw ?? '').toUpperCase() === 'COUNSELOR' ? 'COUNSELOR' : 'GUIDE';
}

/**
 * Which app is asking. Anything but an explicit 'mobile' is treated as the website, so
 * existing callers keep the behaviour they already had.
 */
function clientOf(req: { query: Record<string, unknown>; body?: unknown }): 'web' | 'mobile' {
  const raw = req.query['client'] ?? (req.body as { client?: unknown } | undefined)?.client;
  return String(raw ?? '') === 'mobile' ? 'mobile' : 'web';
}

export const verificationRouter = Router();

// The applicant's own status — drives the button state in the application flow.
verificationRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json(await svc.getMyVerification(req.user!.id, kindOf(req)));
}));

// Start (or resume) a Stripe Identity session. Returns a client secret for
// Stripe.js plus a hosted URL as a fallback for browsers that can't open the modal.
verificationRouter.post('/stripe/start', requireAuth, asyncHandler(async (req, res) => {
  res.status(201).json(await svc.startStripeVerification(req.user!.id, kindOf(req), clientOf(req)));
}));

// Pull the provider's current state on demand — a safety net for a missed webhook.
verificationRouter.post('/refresh', requireAuth, asyncHandler(async (req, res) => {
  res.json(await svc.refreshVerification(req.user!.id, kindOf(req)));
}));

export const adminVerificationRouter = Router();

adminVerificationRouter.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const { status, kind } = req.query as Record<string, string>;
  res.json({ data: await svc.listVerifications({ status, kind }) });
}));

// Re-read a specific applicant's session from the provider.
adminVerificationRouter.post('/:userId/refresh', requireAdmin, asyncHandler(async (req, res) => {
  res.json(await svc.refreshVerification(req.params['userId'] as string, kindOf(req)));
}));

// Manual decision. Kept first-class: automated checks reject plenty of legitimate
// applicants (non-US IDs especially), so an admin must always be able to override.
adminVerificationRouter.post('/:userId/manual', requireAdmin, asyncHandler(async (req, res) => {
  const { verified, note } = req.body as { verified?: boolean; note?: string };
  if (typeof verified !== 'boolean') {
    throw new HttpError(400, 'validation_error', 'verified (boolean) is required');
  }
  res.json(await svc.setManualVerification(
    req.params['userId'] as string, kindOf(req), verified, note, req.user!.id,
  ));
}));
