// Identity / enrolment verification for guide and counselor applicants.
//
// Provider-agnostic by design. Today only Stripe Identity is wired up; ID.me slots in
// as another `method` without touching callers, the schema, or the admin screens.
//
// IMPORTANT — what Stripe Identity actually proves:
//   It confirms a government ID is genuine and matches a selfie. It does NOT confirm
//   the person is an enrolled student. Enrolment still relies on the uploaded document
//   plus admin review (MANUAL), or ID.me once that is available. Nothing here should be
//   read as "this person is a student".
import type { ApplicantKind, VerificationMethod } from '@ucpt/db';
import { prisma, Prisma } from '@ucpt/db';
import type Stripe from 'stripe';
import { HttpError } from '../lib/http.js';
import { logger } from '../lib/logger.js';
import { config } from '../config.js';
import { stripe, isStripeEnabled } from '../lib/stripe.js';

/** Stripe session status → our status. Kept explicit so a new Stripe state can't silently pass. */
function mapStripeStatus(s: Stripe.Identity.VerificationSession.Status) {
  switch (s) {
    case 'verified': return 'VERIFIED' as const;
    case 'processing': return 'PROCESSING' as const;
    case 'requires_input': return 'FAILED' as const;
    case 'canceled': return 'CANCELED' as const;
    default: return 'PENDING' as const;
  }
}

/**
 * Only ever persist the coarse outcome — never the document images, the raw ID number,
 * or the extracted date of birth. Those stay with Stripe; storing them would put us in
 * scope for handling identity documents with no upside.
 */
function redactedReport(s: Stripe.Identity.VerificationSession) {
  return {
    status: s.status,
    type: s.type,
    lastErrorCode: s.last_error?.code ?? null,
    // `verified_outputs` is only present when expanded; we deliberately do not expand it.
    checkedAt: new Date().toISOString(),
  };
}

export async function getMyVerification(userId: string, kind: ApplicantKind = 'GUIDE') {
  return prisma.identityVerification.findUnique({ where: { userId_kind: { userId, kind } } });
}

/**
 * Create (or reuse) a Stripe Identity session and hand back the client secret.
 *
 * Reuses an unfinished session rather than creating a new one on every click — each
 * created session is billable, and a user refreshing the page should not cost money.
 */
export async function startStripeVerification(userId: string, kind: ApplicantKind = 'GUIDE') {
  if (!isStripeEnabled()) {
    throw new HttpError(503, 'stripe_disabled', 'Identity verification is not configured');
  }

  const existing = await prisma.identityVerification.findUnique({
    where: { userId_kind: { userId, kind } },
  });
  if (existing?.status === 'VERIFIED') {
    throw new HttpError(409, 'already_verified', 'This applicant is already verified');
  }

  // An in-flight session can be resumed; only its client secret is re-fetched.
  if (existing?.sessionId && existing.method === 'STRIPE_IDENTITY' &&
      (existing.status === 'PENDING' || existing.status === 'PROCESSING')) {
    const s = await stripe().identity.verificationSessions.retrieve(existing.sessionId);
    // Stripe's status union has no 'created' — a live session is either awaiting the
    // user (requires_input) or being checked (processing).
    if (s.status === 'requires_input' || s.status === 'processing') {
      return { id: s.id, clientSecret: s.client_secret, url: s.url, status: mapStripeStatus(s.status) };
    }
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');

  const session = await stripe().identity.verificationSessions.create({
    type: 'document',
    provided_details: { email: user.email },
    // metadata is echoed back on the webhook — this is how we find the row again
    // without trusting anything the client sends.
    metadata: { userId, kind },
    options: { document: { require_matching_selfie: true, require_live_capture: true } },
    return_url: `${config.APP_WEB_URL.replace(/\/+$/, '')}/manage-listing?verified=1`,
  });

  await prisma.identityVerification.upsert({
    where: { userId_kind: { userId, kind } },
    update: {
      method: 'STRIPE_IDENTITY', status: 'PENDING', sessionId: session.id,
      lastError: null, reportJson: Prisma.DbNull, decidedBy: null,
    },
    create: {
      userId, kind, method: 'STRIPE_IDENTITY', status: 'PENDING', sessionId: session.id,
    },
  });

  return { id: session.id, clientSecret: session.client_secret, url: session.url, status: 'PENDING' as const };
}

/**
 * Apply a Stripe session's current state to our row.
 *
 * Used by both the webhook and an on-demand sync, so a missed webhook never leaves an
 * applicant stuck — the status can always be re-derived from Stripe.
 */
export async function syncStripeSession(session: Stripe.Identity.VerificationSession) {
  const row = await prisma.identityVerification.findUnique({ where: { sessionId: session.id } });
  if (!row) {
    logger.warn({ sessionId: session.id }, 'Identity session has no matching verification row');
    return null;
  }
  const status = mapStripeStatus(session.status);
  return prisma.identityVerification.update({
    where: { id: row.id },
    data: {
      status,
      lastError: session.last_error?.reason ?? null,
      reportJson: redactedReport(session) as Prisma.InputJsonValue,
      verifiedAt: status === 'VERIFIED' ? new Date() : null,
    },
  });
}

/** Re-read the provider's truth on demand (used by the "refresh" action in admin). */
export async function refreshVerification(userId: string, kind: ApplicantKind = 'GUIDE') {
  const row = await prisma.identityVerification.findUnique({ where: { userId_kind: { userId, kind } } });
  if (!row?.sessionId || row.method !== 'STRIPE_IDENTITY') return row;
  if (!isStripeEnabled()) return row;
  const session = await stripe().identity.verificationSessions.retrieve(row.sessionId);
  return syncStripeSession(session);
}

/**
 * Admin override. Manual review stays first-class: automated checks fail for plenty of
 * legitimate applicants (international IDs especially), and an admin must always be
 * able to decide.
 */
export async function setManualVerification(
  userId: string,
  kind: ApplicantKind,
  verified: boolean,
  note: string | undefined,
  adminId: string,
) {
  const row = await prisma.identityVerification.upsert({
    where: { userId_kind: { userId, kind } },
    update: {
      method: 'MANUAL' as VerificationMethod,
      status: verified ? 'VERIFIED' : 'FAILED',
      lastError: note ?? null,
      decidedBy: adminId,
      verifiedAt: verified ? new Date() : null,
    },
    create: {
      userId, kind, method: 'MANUAL' as VerificationMethod,
      status: verified ? 'VERIFIED' : 'FAILED',
      lastError: note ?? null, decidedBy: adminId,
      verifiedAt: verified ? new Date() : null,
    },
  });
  await prisma.auditLog.create({
    data: {
      adminId,
      action: `verification.manual_${verified ? 'approve' : 'reject'}`,
      entity: `users/${userId} (${kind})`,
      ip: '127.0.0.1',
    },
  });
  return row;
}

/** Admin list, newest first, with just enough of the applicant to render a row. */
export async function listVerifications(opts: { status?: string; kind?: string }) {
  const where: Record<string, unknown> = {};
  if (opts.status && opts.status !== 'ALL') where.status = opts.status;
  if (opts.kind && opts.kind !== 'ALL') where.kind = opts.kind;
  return prisma.identityVerification.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });
}
