import { prisma, Prisma } from '@ucpt/db';
import { HttpError } from '../lib/http.js';
import { logger } from '../lib/logger.js';
import { config } from '../config.js';
import { stripe, isStripeEnabled } from '../lib/stripe.js';
import { syncPaymentRecord } from './booking.service.js';
import { sendProfileApprovedEmail, sendProfileDeclinedEmail, ensureEmailTemplates, emailTemplateSample } from './mailer.service.js';
import { broadcastPush, sendPushToUsers } from './push.service.js';
import { forgotPassword } from './auth.service.js';
import * as argon2 from 'argon2';

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard() {
  const [
    bookingsTotal,
    activeGuides,
    pendingApplications,
    grossRevenue,
    commissionData,
    pendingPayoutsData,
    bookingsByStatus,
    topSchools,
    revenueSeries,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.sellerProfile.count({ where: { applicationStatus: 'APPROVED' } }),
    prisma.application.count({ where: { status: 'SUBMITTED' } }),
    prisma.ledgerEntry.aggregate({ _sum: { grossCents: true }, where: { type: 'CAPTURE' } }),
    prisma.ledgerEntry.aggregate({ _sum: { commissionCents: true }, where: { type: 'CAPTURE' } }),
    prisma.ledgerEntry.groupBy({
      by: ['bookingId'],
      _sum: { sellerNetCents: true },
      where: { type: 'CAPTURE' },
    }),
    prisma.booking.groupBy({ by: ['status'], _count: true }),
    prisma.school.findMany({
      where: { enabled: true },
      include: { _count: { select: { listings: true } } },
      orderBy: { listings: { _count: 'desc' } },
      take: 5,
    }),
    prisma.$queryRaw<{ month: string; gross: number | bigint; commission: number | bigint }[]>`
      SELECT
        DATE_FORMAT(created_at, '%b') AS month,
        SUM(gross_cents) AS gross,
        SUM(commission_cents) AS commission
      FROM ledger_entries
      WHERE type = 'CAPTURE'
        AND created_at >= (NOW() - INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
      ORDER BY DATE_FORMAT(created_at, '%Y-%m')
    `,
  ]);

  // Calculate pending payouts: total net earned - total paid out per seller
  const totalEarned = (await prisma.ledgerEntry.aggregate({ _sum: { sellerNetCents: true }, where: { type: 'CAPTURE' } }))._sum.sellerNetCents ?? 0;
  const totalPaid = (await prisma.payout.aggregate({ _sum: { amountCents: true } }))._sum.amountCents ?? 0;
  const pendingPayoutsCents = Math.max(0, totalEarned - totalPaid);

  const grossRevenueCents = grossRevenue._sum.grossCents ?? 0;
  const commissionCents = commissionData._sum.commissionCents ?? 0;

  return {
    grossRevenueCents,
    commissionCents,
    bookingsTotal,
    activeGuides,
    pendingApplications,
    pendingPayoutsCents,
    bookingsByStatus: bookingsByStatus.map((b) => ({ status: b.status, count: b._count })),
    topSchools: topSchools.map((s) => ({ id: s.id, name: s.name, slug: s.slug, listings: s._count.listings })),
    // MySQL SUM() can come back as BigInt/string — coerce to plain numbers so the
    // response serializes to JSON cleanly.
    revenueSeries: (Array.isArray(revenueSeries) ? revenueSeries : []).map((r) => ({
      month: r.month,
      gross: Number(r.gross ?? 0),
      commission: Number(r.commission ?? 0),
    })),
  };
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function listApplications(opts: { status?: string; q?: string; page?: number; limit?: number }) {
  const { status, q, page = 1, limit = 20 } = opts;
  const where: Record<string, unknown> = {};
  if (status && status !== 'ALL') where.status = status;
  if (q) {
    where.seller = {
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
      ],
    };
  }
  const [data, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        seller: { select: { id: true, name: true, email: true, sellerProfile: { include: { school: true } } } },
        questionnaire: { select: { version: true } },
        answers: true,
      },
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.application.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function getApplication(id: string) {
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, email: true, sellerProfile: { include: { school: true } } } },
      questionnaire: { include: { questions: { orderBy: { order: 'asc' } } } },
      answers: true,
    },
  });
  if (!app) throw new HttpError(404, 'not_found', 'Application not found');
  return app;
}

export async function decideApplication(id: string, decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED', reason?: string, adminId?: string) {
  const app = await prisma.application.findUnique({ where: { id }, include: { seller: true } });
  if (!app) throw new HttpError(404, 'not_found', 'Application not found');

  await prisma.$transaction(async (tx) => {
    await tx.application.update({ where: { id }, data: { status: decision, reason: reason ?? null } });
    if (decision === 'APPROVED') {
      await tx.sellerProfile.update({ where: { userId: app.sellerId }, data: { applicationStatus: 'APPROVED', approvedAt: new Date() } });
    } else {
      await tx.sellerProfile.update({ where: { userId: app.sellerId }, data: { applicationStatus: decision as never } });
    }
    if (adminId) {
      await tx.auditLog.create({ data: { adminId, action: `application.${decision.toLowerCase()}`, entity: `applications/${id} (${app.seller.name})`, ip: '127.0.0.1' } });
    }
  });
  return { ok: true };
}

// ─── Questionnaire (singleton) ────────────────────────────────────────────────
// There is exactly one questionnaire. This function returns it, creating an
// empty one on first call if the table is empty.

export async function getRequiredPhotos(): Promise<number> {
  const s = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  return s?.requiredPhotos ?? 3;
}

export async function setRequiredPhotos(n: number, adminId: string) {
  const v = Math.max(1, Math.min(10, Math.round(Number(n) || 3)));
  await prisma.settings.update({ where: { id: 'singleton' }, data: { requiredPhotos: v } });
  await prisma.auditLog.create({
    data: { adminId, action: `settings.required_photos → ${v}`, entity: 'settings', ip: '127.0.0.1' },
  });
  return { requiredPhotos: v };
}

export async function getOrCreateQuestionnaire() {
  // Manage the SAME questionnaire the website's become-a-guide form uses: the
  // ACTIVE one. Fall back to the latest version, then create one if none exist.
  const active = await prisma.questionnaire.findFirst({
    where: { status: 'ACTIVE' },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (active) return active;
  const latest = await prisma.questionnaire.findFirst({
    include: { questions: { orderBy: { order: 'asc' } } },
    orderBy: { version: 'desc' },
  });
  if (latest) return latest;
  return prisma.questionnaire.create({
    data: { version: 1, status: 'ACTIVE', questions: {} },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
}

// ─── Questionnaire question CRUD ───────────────────────────────────────────────

export async function addQuestion(
  questionnaireId: string,
  data: { type: string; label: string; required: boolean; options?: string[] },
) {
  const q = await prisma.questionnaire.findUnique({
    where: { id: questionnaireId },
    select: { _count: { select: { questions: true } } },
  });
  if (!q) throw new HttpError(404, 'not_found', 'Questionnaire not found');
  return prisma.questionnaireQuestion.create({
    data: {
      questionnaireId,
      type: data.type as never,
      label: data.label,
      required: data.required ?? false,
      order: q._count.questions,
      optionsJson: data.options !== undefined ? data.options : Prisma.DbNull,
    },
  });
}

export async function updateQuestion(
  questionnaireId: string,
  questionId: string,
  data: { type?: string; label?: string; required?: boolean; options?: string[] | null },
) {
  const existing = await prisma.questionnaireQuestion.findFirst({ where: { id: questionId, questionnaireId } });
  if (!existing) throw new HttpError(404, 'not_found', 'Question not found');
  return prisma.questionnaireQuestion.update({
    where: { id: questionId },
    data: {
      ...(data.type !== undefined && { type: data.type as never }),
      ...(data.label !== undefined && { label: data.label }),
      ...(data.required !== undefined && { required: data.required }),
      ...(data.options !== undefined && { optionsJson: data.options === null ? Prisma.DbNull : data.options }),
    },
  });
}

export async function deleteQuestion(questionnaireId: string, questionId: string) {
  const existing = await prisma.questionnaireQuestion.findFirst({ where: { id: questionId, questionnaireId } });
  if (!existing) throw new HttpError(404, 'not_found', 'Question not found');
  await prisma.questionnaireQuestion.delete({ where: { id: questionId } });
  return { ok: true };
}

export async function reorderQuestions(questionnaireId: string, orderedIds: string[]) {
  const q = await prisma.questionnaire.findUnique({ where: { id: questionnaireId }, select: { id: true } });
  if (!q) throw new HttpError(404, 'not_found', 'Questionnaire not found');
  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.questionnaireQuestion.updateMany({ where: { id, questionnaireId }, data: { order: index } }),
    ),
  );
  return { ok: true };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(opts: { q?: string; role?: string; status?: string; page?: number; limit?: number }) {
  const { q, role, status, page = 1, limit = 20 } = opts;
  const where: Record<string, unknown> = {};
  if (role && role !== 'ALL') where.role = role;
  if (status && status !== 'ALL') where.status = status;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, status: true, emailVerifiedAt: true, createdAt: true, adminRoleName: true, profileJson: true, sellerProfile: { select: { school: true, applicationStatus: true, ratingAvg: true, ratingCount: true } }, _count: { select: { buyerBookings: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);
  // Community guides enter their school in the become-a-guide form → it lives in
  // profileJson.guideListing.school (not the sellerProfile relation). Surface it as
  // `guideSchool` and drop the heavy profileJson from the response.
  const mapped = data.map(({ profileJson, ...u }) => {
    const gl = (profileJson as Record<string, unknown> | null)?.['guideListing'] as Record<string, unknown> | undefined;
    const guideSchool = typeof gl?.['school'] === 'string' && gl['school'].trim() ? (gl['school'] as string) : null;
    return { ...u, guideSchool };
  });
  return { data: mapped, total, page, limit };
}

/** Full detail for one user: profile + guide listing + their bookings and reviews. */
export async function getUserDetail(id: string) {
  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true, status: true,
      emailVerifiedAt: true, createdAt: true, adminRoleName: true, profileJson: true,
      sellerProfile: {
        select: {
          school: { select: { name: true } }, major: true, gradYear: true,
          applicationStatus: true, ratingAvg: true, ratingCount: true,
        },
      },
      _count: { select: { buyerBookings: true, sellerBookings: true } },
    },
  });
  if (!u) throw new HttpError(404, 'not_found', 'User not found');

  const profile = (u.profileJson as Record<string, unknown> | null) ?? {};
  const gl = (profile['guideListing'] ?? null) as Record<string, unknown> | null;
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? (v as string) : null);

  const [bookings, reviews] = await Promise.all([
    prisma.booking.findMany({
      where: { OR: [{ buyerId: id }, { sellerId: id }] },
      select: {
        id: true, bookingNo: true, status: true, serviceType: true, scheduledDate: true,
        grossCents: true, listingTitle: true, schoolName: true, buyerId: true, sellerId: true,
        buyer: { select: { name: true } }, seller: { select: { name: true } },
      },
      orderBy: { requestedAt: 'desc' },
      take: 100,
    }),
    prisma.review.findMany({
      where: { OR: [{ buyerId: id }, { sellerId: id }] },
      select: {
        id: true, rating: true, text: true, hidden: true, createdAt: true, buyerId: true, sellerId: true,
        buyer: { select: { name: true } }, seller: { select: { name: true } },
        booking: { select: { id: true, bookingNo: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: str(profile['phone']),
    role: u.role,
    status: u.status,
    emailVerified: !!u.emailVerifiedAt,
    isAdmin: u.role === 'ADMIN' || !!u.adminRoleName,
    joinedAt: u.createdAt,
    counts: { asGuest: u._count.buyerBookings, asGuide: u._count.sellerBookings },
    guideListing: gl
      ? {
          title: str(gl['listingTitle']) ?? 'Untitled listing',
          school: str(gl['school']),
          status: guideListingStatus(gl['status']),
          tourTypes: Array.isArray(gl['tourTypes']) ? (gl['tourTypes'] as unknown[]).filter((t): t is string => typeof t === 'string') : [],
        }
      : null,
    sellerProfile: u.sellerProfile
      ? {
          school: u.sellerProfile.school?.name ?? null,
          major: u.sellerProfile.major,
          gradYear: u.sellerProfile.gradYear,
          applicationStatus: u.sellerProfile.applicationStatus,
          ratingAvg: u.sellerProfile.ratingAvg,
          ratingCount: u.sellerProfile.ratingCount,
        }
      : null,
    bookings: bookings.map((b) => ({
      id: b.id,
      bookingNo: b.bookingNo,
      status: b.status,
      serviceType: b.serviceType,
      scheduledDate: b.scheduledDate,
      grossCents: b.grossCents,
      listingTitle: b.listingTitle,
      schoolName: b.schoolName,
      side: b.buyerId === id ? ('guest' as const) : ('guide' as const),
      counterparty: b.buyerId === id ? b.seller.name : b.buyer.name,
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text,
      hidden: r.hidden,
      createdAt: r.createdAt,
      side: r.sellerId === id ? ('received' as const) : ('written' as const),
      counterparty: r.sellerId === id ? r.buyer.name : r.seller.name,
      bookingId: r.booking?.id ?? null,
      bookingNo: r.booking?.bookingNo ?? null,
    })),
  };
}

/** Admin-triggered password reset: emails the user a reset link (reuses the public flow). */
export async function adminResetPassword(userId: string, adminId?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, status: true } });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  // forgotPassword only emails ACTIVE accounts (and never reveals status) — surface
  // that back to the admin so the toast is honest.
  await forgotPassword(user.email);
  if (adminId) {
    await prisma.auditLog.create({ data: { adminId, action: 'user.password_reset', entity: `users/${userId} (${user.name})`, ip: '127.0.0.1' } });
  }
  return { ok: true as const, email: user.email, sent: user.status === 'ACTIVE' };
}

export async function updateUser(id: string, data: { status?: string }, adminId?: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  const updated = await prisma.user.update({ where: { id }, data: { status: data.status as never } });
  if (adminId) await prisma.auditLog.create({ data: { adminId, action: `user.${data.status?.toLowerCase()}`, entity: `users/${id} (${user.name})`, ip: '127.0.0.1' } });
  return updated;
}

// ─── Listings ─────────────────────────────────────────────────────────────────

// Guide listings live on the owner's user record (`profileJson.guideListing`) —
// the same JSON the website's become-a-guide flow writes ('draft' → 'under_review'
// on publish; the admin review below moves it to 'published' / 'suspended').
// One listing per user, so the owner's user id doubles as the listing id.

const GUIDE_LISTING_STATUSES = ['DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'SUSPENDED'] as const;
export type GuideListingStatus = (typeof GUIDE_LISTING_STATUSES)[number];

const guideListingStatus = (s: unknown): GuideListingStatus =>
  s === 'published' ? 'PUBLISHED' : s === 'suspended' ? 'SUSPENDED' : s === 'draft' ? 'DRAFT' : 'UNDER_REVIEW';

export async function listListings(opts: { q?: string; status?: string; service?: string; page?: number; limit?: number }) {
  const { q, status, service, page = 1, limit = 20 } = opts;
  // JSON-path filters on nullable Json columns are error-prone across Prisma
  // versions, so fetch candidates and filter in JS — one listing per user keeps
  // this small.
  const users = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      profileJson: true,
      _count: { select: { sellerBookings: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  let rows = users
    .map((u) => {
      const gl = ((u.profileJson as Record<string, unknown> | null)?.guideListing ?? null) as Record<string, unknown> | null;
      if (!gl) return null;
      return {
        id: u.id,
        title: typeof gl.listingTitle === 'string' && gl.listingTitle.trim() ? gl.listingTitle : 'Untitled listing',
        school: typeof gl.school === 'string' && gl.school.trim() ? gl.school : null,
        tourTypes: Array.isArray(gl.tourTypes) ? gl.tourTypes.filter((t): t is string => typeof t === 'string') : [],
        photos: Array.isArray(gl.photos) ? gl.photos.filter((p): p is string => typeof p === 'string') : [],
        intro: typeof gl.intro === 'string' ? gl.intro : null,
        status: guideListingStatus(gl.status),
        submittedAt: typeof gl.submittedAt === 'string' ? gl.submittedAt : null,
        createdAt: u.createdAt,
        seller: { id: u.id, name: u.name, email: u.email },
        bookings: u._count.sellerBookings,
        // Full form answers as saved by the website, for the admin detail view.
        details: gl,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (status && status !== 'ALL') rows = rows.filter((r) => r.status === status);
  if (service && service !== 'ALL') rows = rows.filter((r) => r.tourTypes.includes(service));
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        r.seller.name.toLowerCase().includes(needle) ||
        (r.school ?? '').toLowerCase().includes(needle),
    );
  }

  const total = rows.length;
  const data = rows.slice((page - 1) * limit, (page - 1) * limit + limit);
  return { data, total, page, limit };
}

/** Everything the admin detail page needs: the website listing JSON plus the owner's account and seller profile. */
export async function getListingDetail(id: string) {
  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
      createdAt: true,
      profileJson: true,
      sellerProfile: {
        select: {
          school: { select: { name: true } },
          major: true,
          gradYear: true,
          bio: true,
          applicationStatus: true,
          approvedAt: true,
          ratingAvg: true,
          ratingCount: true,
        },
      },
      _count: { select: { sellerBookings: true, buyerBookings: true } },
    },
  });
  const gl = ((u?.profileJson as Record<string, unknown> | null)?.guideListing ?? null) as Record<string, unknown> | null;
  if (!u || !gl) throw new HttpError(404, 'not_found', 'Listing not found');

  return {
    id: u.id,
    title: typeof gl.listingTitle === 'string' && gl.listingTitle.trim() ? gl.listingTitle : 'Untitled listing',
    school: typeof gl.school === 'string' && gl.school.trim() ? gl.school : null,
    tourTypes: Array.isArray(gl.tourTypes) ? gl.tourTypes.filter((t): t is string => typeof t === 'string') : [],
    photos: Array.isArray(gl.photos) ? gl.photos.filter((p): p is string => typeof p === 'string') : [],
    intro: typeof gl.intro === 'string' ? gl.intro : null,
    status: guideListingStatus(gl.status),
    submittedAt: typeof gl.submittedAt === 'string' ? gl.submittedAt : null,
    publishedAt: typeof gl.publishedAt === 'string' ? gl.publishedAt : null,
    createdAt: u.createdAt,
    bookings: u._count.sellerBookings,
    details: gl,
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      emailVerified: !!u.emailVerifiedAt,
      joinedAt: u.createdAt,
      buyerBookings: u._count.buyerBookings,
    },
    sellerProfile: u.sellerProfile
      ? {
          school: u.sellerProfile.school?.name ?? null,
          major: u.sellerProfile.major,
          gradYear: u.sellerProfile.gradYear,
          bio: u.sellerProfile.bio,
          applicationStatus: u.sellerProfile.applicationStatus,
          approvedAt: u.sellerProfile.approvedAt,
          ratingAvg: u.sellerProfile.ratingAvg,
          ratingCount: u.sellerProfile.ratingCount,
        }
      : null,
  };
}

export async function moderateListing(id: string, data: { status?: string }, adminId?: string) {
  const toJson: Record<string, string> = {
    PUBLISHED: 'published',
    SUSPENDED: 'suspended',
    UNDER_REVIEW: 'under_review',
    DRAFT: 'draft',
  };
  const next = toJson[data.status ?? ''];
  if (!next) throw new HttpError(400, 'validation_error', `status must be one of ${GUIDE_LISTING_STATUSES.join(', ')}`);

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, profileJson: true } });
  const profile = (user?.profileJson ?? {}) as Record<string, unknown>;
  const gl = profile.guideListing as Record<string, unknown> | undefined;
  if (!user || !gl) throw new HttpError(404, 'not_found', 'Listing not found');

  const prevStatus = gl.status;
  const guideListing: Record<string, unknown> = { ...gl, status: next };
  if (next === 'published' && !guideListing.publishedAt) guideListing.publishedAt = new Date().toISOString();

  const updated = await prisma.user.update({
    where: { id },
    data: { profileJson: { ...profile, guideListing } as Prisma.InputJsonValue },
    select: { id: true },
  });
  if (adminId) {
    await prisma.auditLog.create({
      data: { adminId, action: `listing.${next}`, entity: `listings/${id} (${user.name})`, ip: '127.0.0.1' },
    });
  }

  // Notify the guide on a decision — only on an actual status change, so
  // re-saving the same status doesn't re-send. Best-effort (never fails the update).
  if (next !== prevStatus) {
    const dashboardUrl = `${config.APP_WEB_URL.replace(/\/+$/, '')}/manage-listing`;
    if (next === 'published') {
      sendProfileApprovedEmail({ to: user.email, name: user.name, dashboardUrl }).catch((err) =>
        logger.error({ err, userId: id }, 'Approval email dispatch failed'),
      );
      // Push the guide: their listing was approved.
      void sendPushToUsers(id, {
        title: 'Listing approved 🎉',
        body: 'Your guide listing is now live. Guests can find and book you.',
        data: { type: 'listing', status: 'published' },
      });
    } else if (next === 'suspended') {
      sendProfileDeclinedEmail({ to: user.email, name: user.name, dashboardUrl }).catch((err) =>
        logger.error({ err, userId: id }, 'Decline email dispatch failed'),
      );
    }
  }

  return updated;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function listBookings(opts: { status?: string; q?: string; page?: number; limit?: number }) {
  const { status, q, page = 1, limit = 20 } = opts;
  const where: Record<string, unknown> = {};
  if (status && status !== 'ALL') where.status = status;
  if (q) {
    where.OR = [
      { buyer: { name: { contains: q } } },
      { seller: { name: { contains: q } } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        listing: { select: { title: true, serviceType: true, school: { select: { name: true } } } },
        payment: { select: { status: true, amountCents: true, amountRefundedCents: true, cardBrand: true, cardLast4: true } },
        review: { select: { rating: true, text: true, hidden: true, createdAt: true } },
      },
      orderBy: { requestedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function forceCancelBooking(id: string, reason: string, adminId: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new HttpError(404, 'not_found', 'Booking not found');
  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id }, data: { status: 'CANCELLED' } });
    await tx.bookingEvent.create({ data: { bookingId: id, fromState: booking.status as never, toState: 'CANCELLED', actor: adminId, reason } });
    await tx.auditLog.create({ data: { adminId, action: 'booking.force_cancel', entity: `bookings/${id}`, ip: '127.0.0.1' } });
  });
  return { ok: true };
}


export async function refundBooking(id: string, amountCents: number | undefined, reason: string, adminId: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new HttpError(404, 'not_found', 'Booking not found');
  const refundAmount = amountCents ?? booking.grossCents;

  // Issue the money back through Stripe (partial or full). Skipped for bookings with
  // no captured PaymentIntent (legacy / pre-payments) so the ledger still reconciles.
  let stripeRefundId: string | null = null;
  if (isStripeEnabled() && booking.stripePaymentIntentId) {
    try {
      const refund = await stripe().refunds.create({
        payment_intent: booking.stripePaymentIntentId,
        amount: refundAmount,
      });
      stripeRefundId = refund.id;
    } catch (err) {
      logger.error({ err, bookingId: id }, 'Stripe refund failed');
      throw new HttpError(502, 'refund_failed', 'Stripe refund failed — please try again');
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.refund.create({ data: { bookingId: id, amountCents: refundAmount, stripeRefundId, reason, createdBy: adminId } });
    // Compensating ledger entry
    if (booking.commissionPctSnapshot !== null) {
      const commissionCents = Math.round((refundAmount * booking.commissionPctSnapshot) / 100);
      await tx.ledgerEntry.create({
        data: {
          bookingId: id,
          type: 'REFUND',
          grossCents: -refundAmount,
          commissionPct: booking.commissionPctSnapshot,
          commissionCents: -commissionCents,
          sellerNetCents: -(refundAmount - commissionCents),
        },
      });
    }
    await tx.auditLog.create({ data: { adminId, action: 'refund.issue', entity: `bookings/${id} → $${(refundAmount / 100).toFixed(2)}`, ip: '127.0.0.1' } });
  });
  // Refresh the stored Payment so the invoice view reflects the refund.
  if (booking.stripePaymentIntentId) await syncPaymentRecord(id, booking.stripePaymentIntentId);
  return { ok: true };
}

export async function listRefunds(opts: { q?: string; page?: number; limit?: number }) {
  const { page = 1, limit = 50 } = opts;
  const [data, total] = await Promise.all([
    prisma.refund.findMany({
      include: {
        booking: {
          select: {
            id: true,
            grossCents: true,
            buyer: { select: { name: true } },
            seller: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.refund.count(),
  ]);
  return { data, total, page, limit };
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function listReviews(opts: { hidden?: boolean; q?: string; page?: number; limit?: number }) {
  const { hidden, q, page = 1, limit = 20 } = opts;
  const where: Record<string, unknown> = {};
  if (hidden !== undefined) where.hidden = hidden;
  if (q) {
    where.OR = [
      { buyer: { name: { contains: q } } },
      { seller: { name: { contains: q } } },
      { text: { contains: q } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        booking: {
          select: {
            id: true,
            bookingNo: true,
            serviceType: true,
            schoolName: true,
            listing: { select: { school: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function moderateReview(id: string, data: { hidden: boolean }, adminId?: string) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new HttpError(404, 'not_found', 'Review not found');
  const updated = await prisma.review.update({ where: { id }, data: { hidden: data.hidden } });
  if (adminId) await prisma.auditLog.create({ data: { adminId, action: `review.${data.hidden ? 'hide' : 'unhide'}`, entity: `reviews/${id}`, ip: '127.0.0.1' } });
  return updated;
}

// ─── Notifications (recent activity feed for the topbar) ──────────────────────

export interface AdminNotification {
  id: string;
  type: 'signup' | 'booking' | 'payment' | 'review' | 'listing' | 'contact';
  title: string;
  detail: string;
  href: string; // where clicking navigates in the admin
  createdAt: string;
}

/** Merge the latest signups, bookings, payments, reviews and listings-in-review into one feed. */
export async function listNotifications(limit = 15): Promise<{ data: AdminNotification[] }> {
  const each = 8;
  const [users, bookings, payments, reviews, inReview, contacts] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ['BUYER', 'SELLER'] } },
      orderBy: { createdAt: 'desc' },
      take: each,
      select: { id: true, name: true, role: true, createdAt: true },
    }),
    prisma.booking.findMany({
      where: { status: { not: 'PENDING_PAYMENT' } },
      orderBy: { requestedAt: 'desc' },
      take: each,
      select: { id: true, bookingNo: true, requestedAt: true, buyer: { select: { name: true } }, seller: { select: { name: true } } },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: each,
      select: { bookingId: true, status: true, amountCents: true, createdAt: true },
    }),
    prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: each,
      select: { id: true, rating: true, createdAt: true, buyer: { select: { name: true } }, seller: { select: { name: true } }, booking: { select: { id: true } } },
    }),
    // Guide listings currently awaiting review (a new submission or an edit on the website).
    prisma.user.findMany({
      where: { profileJson: { path: '$.guideListing.status', equals: 'under_review' } },
      take: each,
      select: { id: true, name: true, profileJson: true },
    }),
    // Messages submitted from the website "Contact us" form.
    prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: each,
      select: { id: true, name: true, topic: true, createdAt: true },
    }),
  ]);

  const usd = (c: number) => `$${((c ?? 0) / 100).toFixed(2)}`;
  const items: AdminNotification[] = [
    ...users.map((u) => ({
      id: `user:${u.id}`,
      type: 'signup' as const,
      title: `New ${u.role === 'SELLER' ? 'guide' : 'guest'} signed up`,
      detail: u.name || u.id,
      href: '/users',
      createdAt: u.createdAt.toISOString(),
    })),
    ...bookings.map((b) => ({
      id: `booking:${b.id}`,
      type: 'booking' as const,
      title: `New booking B-${b.bookingNo}`,
      detail: `${b.buyer.name} → ${b.seller.name}`,
      href: `/bookings/${b.id}`,
      createdAt: b.requestedAt.toISOString(),
    })),
    ...payments.map((p) => ({
      id: `payment:${p.bookingId}`,
      type: 'payment' as const,
      title: `Payment ${p.status.replace(/_/g, ' ')}`,
      detail: usd(p.amountCents),
      href: `/transactions/${p.bookingId}`,
      createdAt: p.createdAt.toISOString(),
    })),
    ...reviews.map((r) => ({
      id: `review:${r.id}`,
      type: 'review' as const,
      title: `New review · ${r.rating}★`,
      detail: `${r.buyer.name} → ${r.seller.name}`,
      href: r.booking ? `/bookings/${r.booking.id}` : '/reviews',
      createdAt: r.createdAt.toISOString(),
    })),
    ...inReview.map((u) => {
      const gl = (u.profileJson as Record<string, unknown> | null)?.['guideListing'] as Record<string, unknown> | undefined;
      const submittedAt = typeof gl?.['submittedAt'] === 'string' ? (gl['submittedAt'] as string) : new Date(0).toISOString();
      return {
        id: `listing:${u.id}:${submittedAt}`,
        type: 'listing' as const,
        title: 'Listing under review',
        detail: u.name || u.id,
        href: `/listings/${u.id}`,
        createdAt: submittedAt,
      };
    }),
    ...contacts.map((c) => ({
      id: `contact:${c.id}`,
      type: 'contact' as const,
      title: 'New contact message',
      detail: `${c.name || 'Someone'} · ${c.topic}`,
      href: `/contact/${c.id}`,
      createdAt: c.createdAt.toISOString(),
    })),
  ];
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return { data: items.slice(0, limit) };
}

// ─── Transactions / Ledger ────────────────────────────────────────────────────

// Transactions are sourced from Payment records so each shows the moment the card is
// authorized (not only after capture). Commission/net are derived from the booking's
// snapshot. Refunded payments surface as REFUND rows.
export async function listTransactions(opts: { type?: string; page?: number; limit?: number }) {
  const { page = 1, limit = 20 } = opts;
  // Only surface payments that actually reached (at least) an authorized hold — hide
  // abandoned carts that never got a card (requires_payment_method / _confirmation / _action).
  const where = { status: { notIn: ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing'] } };
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            serviceType: true,
            scheduledDate: true,
            grossCents: true,
            commissionPctSnapshot: true,
            commissionCents: true,
            sellerNetCents: true,
            buyer: { select: { name: true, email: true } },
            seller: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  const data = payments.map((p) => {
    const gross = p.amountCents;
    const pct = p.booking?.commissionPctSnapshot ?? 0;
    const commission = p.booking?.commissionCents ?? Math.round((gross * pct) / 100);
    const net = p.booking?.sellerNetCents ?? gross - commission;
    return {
      id: p.id,
      type: p.status === 'refunded' ? 'REFUND' : 'CAPTURE',
      status: p.status,
      grossCents: gross,
      commissionCents: commission,
      sellerNetCents: net,
      createdAt: p.createdAt,
      booking: p.booking
        ? {
            id: p.booking.id,
            serviceType: p.booking.serviceType,
            scheduledDate: p.booking.scheduledDate,
            buyer: p.booking.buyer,
            seller: p.booking.seller,
            payment: { cardBrand: p.cardBrand, cardLast4: p.cardLast4, status: p.status, billingName: p.billingName },
          }
        : null,
    };
  });
  return { data, total, page, limit };
}

/**
 * Full invoice for one booking: booking snapshot, guest/guide, the stored Stripe
 * Payment (card, receipt, raw payload), the ledger entries and refunds.
 */
export async function getInvoice(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      payment: true,
      ledger: { orderBy: { createdAt: 'asc' } },
      refunds: { orderBy: { createdAt: 'desc' }, include: { createdByUser: { select: { name: true } } } },
      events: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!booking) throw new HttpError(404, 'not_found', 'Invoice not found');
  return booking;
}

export async function getGuideBalances() {
  const sellers = await prisma.user.findMany({
    where: { role: 'SELLER', sellerProfile: { applicationStatus: 'APPROVED' } },
    select: {
      id: true,
      name: true,
      sellerProfile: { select: { school: true, ratingAvg: true } },
    },
  });

  const balances = await Promise.all(
    sellers.map(async (seller) => {
      const [earned, paid] = await Promise.all([
        prisma.ledgerEntry.aggregate({ where: { booking: { sellerId: seller.id }, type: 'CAPTURE' }, _sum: { sellerNetCents: true } }),
        prisma.payout.aggregate({ where: { sellerId: seller.id }, _sum: { amountCents: true } }),
      ]);
      const completedNetCents = earned._sum.sellerNetCents ?? 0;
      const paidOutCents = paid._sum.amountCents ?? 0;
      return {
        sellerId: seller.id,
        name: seller.name,
        school: seller.sellerProfile?.school?.name ?? '',
        completedNetCents,
        paidOutCents,
        balanceCents: Math.max(0, completedNetCents - paidOutCents),
      };
    }),
  );
  return balances.filter((b) => b.completedNetCents > 0);
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

export async function listPayouts(opts: { sellerId?: string; page?: number; limit?: number }) {
  const { sellerId, page = 1, limit = 20 } = opts;
  const where: Record<string, unknown> = {};
  if (sellerId) where.sellerId = sellerId;
  const [data, total] = await Promise.all([
    prisma.payout.findMany({ where, include: { seller: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.payout.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function recordPayout(sellerId: string, data: { amountCents: number; method: string; reference?: string; note?: string }, adminId: string) {
  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller) throw new HttpError(404, 'not_found', 'Seller not found');
  const payout = await prisma.payout.create({ data: { sellerId, amountCents: data.amountCents, method: data.method, reference: data.reference, note: data.note, createdByAdmin: adminId } });
  await prisma.auditLog.create({ data: { adminId, action: 'payout.record', entity: `payouts/${payout.id} → ${seller.name} $${(data.amountCents / 100).toFixed(2)}`, ip: '127.0.0.1' } });
  return payout;
}

// ─── Commission ───────────────────────────────────────────────────────────────

// Bookings whose commission is NOT yet locked — no CAPTURE has happened, so a rate
// change still re-applies to them. Confirmed/completed (captured) bookings are locked.
const REPRICEABLE_STATUSES = ['PENDING', 'PENDING_PAYMENT'] as const;

export async function getCommission() {
  const [settings, pendingCount] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 'singleton' } }),
    prisma.booking.count({ where: { status: { in: [...REPRICEABLE_STATUSES] } } }),
  ]);
  return { commissionPct: settings?.commissionPct ?? 25, pendingCount };
}

export async function setCommission(commissionPct: number, adminId: string) {
  const old = await prisma.settings.findUnique({ where: { id: 'singleton' } });

  // Update the global rate AND re-apply it to every not-yet-captured booking so the
  // new rate takes effect immediately (captured bookings keep their locked snapshot).
  const [updated, reapplied] = await prisma.$transaction([
    prisma.settings.update({ where: { id: 'singleton' }, data: { commissionPct } }),
    prisma.booking.updateMany({
      where: { status: { in: [...REPRICEABLE_STATUSES] } },
      data: { commissionPctSnapshot: commissionPct },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      adminId,
      action: 'commission.update',
      entity: `settings/commission → ${commissionPct}% (${reapplied.count} bookings re-priced)`,
      beforeJson: { commissionPct: old?.commissionPct },
      afterJson: { commissionPct, reapplied: reapplied.count },
      ip: '127.0.0.1',
    },
  });
  return { commissionPct: updated.commissionPct, affected: reapplied.count };
}

/** Commission-rate change history, reconstructed from the immutable audit log. */
export async function getCommissionHistory() {
  const logs = await prisma.auditLog.findMany({
    where: { action: 'commission.update' },
    include: { admin: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return logs.map((l) => {
    const before = (l.beforeJson ?? {}) as { commissionPct?: number };
    const after = (l.afterJson ?? {}) as { commissionPct?: number; reapplied?: number };
    return {
      id: l.id,
      oldPct: before.commissionPct ?? null,
      newPct: after.commissionPct ?? null,
      reapplied: after.reapplied ?? null,
      actor: l.admin?.name ?? 'Admin',
      changedAt: l.createdAt,
    };
  });
}

export async function getSettings() {
  return prisma.settings.findUnique({ where: { id: 'singleton' } });
}

export async function updateSettings(data: { refundWindowsJson?: unknown; requestExpiryHours?: number; maskingEnabled?: boolean }, adminId: string) {
  const updated = await prisma.settings.update({ where: { id: 'singleton' }, data: {
    ...(data.requestExpiryHours !== undefined && { requestExpiryHours: data.requestExpiryHours }),
    ...(data.maskingEnabled !== undefined && { maskingEnabled: data.maskingEnabled }),
    ...(data.refundWindowsJson !== undefined && { refundWindowsJson: data.refundWindowsJson as Prisma.InputJsonValue }),
  } });
  await prisma.auditLog.create({ data: { adminId, action: 'settings.update', entity: 'settings', afterJson: data as Prisma.InputJsonValue, ip: '127.0.0.1' } });
  return updated;
}

// ─── Price bounds ─────────────────────────────────────────────────────────────

export async function getPriceBounds() {
  return prisma.servicePriceBound.findMany();
}

export async function setPriceBounds(data: { serviceType: string; minCents: number; maxCents: number; suggested1hCents: number; suggested2hCents: number }) {
  const { serviceType, ...rest } = data;
  return prisma.servicePriceBound.update({ where: { serviceType: serviceType as never }, data: rest });
}

// ─── Schools ──────────────────────────────────────────────────────────────────

export async function listSchools(opts: { q?: string; enabled?: boolean; page?: number; limit?: number }) {
  const { q, enabled, page = 1, limit = 50 } = opts;
  const where: Record<string, unknown> = {};
  if (enabled !== undefined) where.enabled = enabled;
  if (q) where.name = { contains: q };
  const [data, total] = await Promise.all([
    prisma.school.findMany({
      where,
      include: {
        _count: { select: { sellerProfiles: true, listings: true } },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.school.count({ where }),
  ]);
  return { data, total, page, limit };
}

/** Editable university fields (all optional except where the route enforces name+slug). */
export interface SchoolInput {
  name?: string;
  slug?: string;
  image?: string | null;
  location?: string | null;
  state?: string | null;
  tags?: string[];
  toursFromCents?: number | null;
  seoContent?: string | null;
  lat?: number | null;
  lng?: number | null;
  enabled?: boolean;
}

/** Whitelist only known columns from a (possibly noisy) client payload. */
function pickSchoolFields(data: SchoolInput): SchoolInput {
  const out: SchoolInput = {};
  if (data.name !== undefined) out.name = data.name;
  if (data.slug !== undefined) out.slug = data.slug;
  if (data.image !== undefined) out.image = data.image;
  if (data.location !== undefined) out.location = data.location;
  if (data.state !== undefined) out.state = data.state;
  if (data.tags !== undefined) out.tags = data.tags;
  if (data.toursFromCents !== undefined) out.toursFromCents = data.toursFromCents;
  if (data.seoContent !== undefined) out.seoContent = data.seoContent;
  if (data.lat !== undefined) out.lat = data.lat;
  if (data.lng !== undefined) out.lng = data.lng;
  if (data.enabled !== undefined) out.enabled = data.enabled;
  return out;
}

/** "Stanford University" → "stanford-university". */
function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** A slug guaranteed unique in the schools table (appends -2, -3, … on collision). */
async function ensureUniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || 'university';
  let slug = root;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.school.findUnique({ where: { slug } })) slug = `${root}-${n++}`;
  return slug;
}

export async function createSchool(data: SchoolInput & { name: string }) {
  const fields = pickSchoolFields(data);
  // Slug is derived from the name (no longer a user-facing field), kept unique.
  const slug = data.slug ? await ensureUniqueSlug(data.slug) : await ensureUniqueSlug(data.name);
  return prisma.school.create({ data: { ...fields, name: data.name, slug } });
}

export async function updateSchool(id: string, data: SchoolInput, adminId?: string) {
  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) throw new HttpError(404, 'not_found', 'School not found');
  const fields = pickSchoolFields(data);
  // If the slug is changing, make sure it stays unique.
  if (fields.slug && fields.slug !== school.slug) {
    const clash = await prisma.school.findUnique({ where: { slug: fields.slug } });
    if (clash) throw new HttpError(409, 'slug_in_use', 'A school with that slug already exists');
  }
  const updated = await prisma.school.update({ where: { id }, data: fields });
  if (adminId) await prisma.auditLog.create({ data: { adminId, action: 'school.update', entity: `schools/${id} (${school.name})`, afterJson: fields as never, ip: '127.0.0.1' } });
  return updated;
}

// ─── CMS ──────────────────────────────────────────────────────────────────────

export async function listCmsBlocks(opts: { type?: string; published?: boolean }) {
  const where: Record<string, unknown> = {};
  if (opts.type && opts.type !== 'ALL') where.type = opts.type;
  if (opts.published !== undefined) where.published = opts.published;
  return prisma.cmsBlock.findMany({ where, orderBy: { key: 'asc' } });
}

export async function getCmsBlock(id: string) {
  const block = await prisma.cmsBlock.findUnique({ where: { id } });
  if (!block) throw new HttpError(404, 'not_found', 'CMS block not found');
  return block;
}

export async function createCmsBlock(data: { key: string; type: string; contentJson: unknown; published?: boolean }, adminId?: string) {
  const block = await prisma.cmsBlock.create({ data: { key: data.key, type: data.type, contentJson: data.contentJson as never, published: data.published ?? false } });
  if (adminId) await prisma.auditLog.create({ data: { adminId, action: 'cms.create', entity: `cms/${block.id} (${block.key})`, ip: '127.0.0.1' } });
  return block;
}

export async function updateCmsBlock(id: string, data: { contentJson?: unknown; published?: boolean; type?: string }, adminId?: string) {
  const block = await prisma.cmsBlock.findUnique({ where: { id } });
  if (!block) throw new HttpError(404, 'not_found', 'CMS block not found');
  const updated = await prisma.cmsBlock.update({ where: { id }, data: data as never });
  if (adminId) await prisma.auditLog.create({ data: { adminId, action: 'cms.update', entity: `cms/${id} (${block.key})`, ip: '127.0.0.1' } });
  return updated;
}

export async function deleteCmsBlock(id: string, adminId?: string) {
  const block = await prisma.cmsBlock.findUnique({ where: { id } });
  if (!block) throw new HttpError(404, 'not_found', 'CMS block not found');
  await prisma.cmsBlock.delete({ where: { id } });
  if (adminId) await prisma.auditLog.create({ data: { adminId, action: 'cms.delete', entity: `cms/${id} (${block.key})`, ip: '127.0.0.1' } });
  return { ok: true };
}

// ─── App config ───────────────────────────────────────────────────────────────

export async function getAppConfig() {
  return prisma.appConfig.findFirst();
}

export async function setAppConfig(data: { minSupportedVersion?: string; forceUpdateMessage?: string | null; maintenanceBanner?: string | null; featureFlagsJson?: unknown; emailNotificationsEnabled?: boolean; pushNotificationsEnabled?: boolean }, adminId?: string) {
  const existing = await prisma.appConfig.findFirst();
  const patch = {
    ...(data.minSupportedVersion !== undefined && { minSupportedVersion: data.minSupportedVersion }),
    ...(data.forceUpdateMessage !== undefined && { forceUpdateMessage: data.forceUpdateMessage }),
    ...(data.maintenanceBanner !== undefined && { maintenanceBanner: data.maintenanceBanner }),
    ...(data.featureFlagsJson !== undefined && { featureFlagsJson: data.featureFlagsJson as Prisma.InputJsonValue }),
    ...(data.emailNotificationsEnabled !== undefined && { emailNotificationsEnabled: data.emailNotificationsEnabled }),
    ...(data.pushNotificationsEnabled !== undefined && { pushNotificationsEnabled: data.pushNotificationsEnabled }),
  };
  let updated;
  if (existing) {
    updated = await prisma.appConfig.update({ where: { id: existing.id }, data: patch });
  } else {
    updated = await prisma.appConfig.create({ data: { minSupportedVersion: '1.0.0', featureFlagsJson: {}, ...patch } });
  }
  if (adminId) await prisma.auditLog.create({ data: { adminId, action: 'appconfig.update', entity: 'app_config', afterJson: data as Prisma.InputJsonValue, ip: '127.0.0.1' } });
  return updated;
}

// ─── Notification templates ───────────────────────────────────────────────────

export async function listTemplates() {
  // Make sure the editable email templates exist so admins can see + customize them.
  await ensureEmailTemplates();
  const rows = await prisma.notificationTemplate.findMany({ orderBy: { key: 'asc' } });
  // Attach realistic sample values so the portal can render a live preview.
  return rows.map((t) => ({ ...t, sampleVars: t.channel === 'EMAIL' ? emailTemplateSample(t.key) : null }));
}

export async function updateTemplate(id: string, data: { subject?: string; body?: string }, adminId?: string) {
  const tmpl = await prisma.notificationTemplate.findUnique({ where: { id } });
  if (!tmpl) throw new HttpError(404, 'not_found', 'Template not found');
  const updated = await prisma.notificationTemplate.update({ where: { id }, data });
  if (adminId) await prisma.auditLog.create({ data: { adminId, action: 'template.update', entity: `templates/${id} (${tmpl.key})`, ip: '127.0.0.1' } });
  return updated;
}

// ─── Push campaigns ───────────────────────────────────────────────────────────

export async function listCampaigns() {
  return prisma.pushCampaign.findMany({ orderBy: { scheduledAt: 'desc' } });
}

export async function createCampaign(data: { segment: string; title: string; body: string; scheduledAt?: string }) {
  return prisma.pushCampaign.create({ data: { segment: data.segment as never, title: data.title, body: data.body, scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null, status: 'DRAFT' } });
}

export async function sendCampaign(id: string, adminId?: string) {
  const campaign = await prisma.pushCampaign.findUnique({ where: { id } });
  if (!campaign) throw new HttpError(404, 'not_found', 'Campaign not found');
  // Actually deliver the push to the target segment (best-effort — never throws).
  const msg = { title: campaign.title, body: campaign.body, data: { type: 'campaign', campaignId: id } };
  if (campaign.segment === 'ALL') {
    await broadcastPush(msg);
  } else {
    const role = campaign.segment === 'GUIDES' ? 'SELLER' : 'BUYER';
    const users = await prisma.user.findMany({ where: { role }, select: { id: true } });
    await sendPushToUsers(users.map((u) => u.id), msg);
  }
  const updated = await prisma.pushCampaign.update({ where: { id }, data: { status: 'SENT', scheduledAt: campaign.scheduledAt ?? new Date() } });
  if (adminId) await prisma.auditLog.create({ data: { adminId, action: 'campaign.send', entity: `campaigns/${id} (${campaign.title})`, ip: '127.0.0.1' } });
  return updated;
}

/** Broadcast a push to every registered device (App Config composer). */
export async function broadcastAppPush(msg: { title: string; body: string }, adminId?: string) {
  const result = await broadcastPush({ title: msg.title, body: msg.body, data: { type: 'broadcast' } });
  if (adminId) {
    await prisma.auditLog.create({
      data: { adminId, action: 'push.broadcast', entity: `broadcast — ${result.devices} device(s)`, ip: '127.0.0.1' },
    });
  }
  return { ok: true as const, ...result };
}

// ─── Admin accounts ───────────────────────────────────────────────────────────

export async function listAdmins() {
  return prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, name: true, email: true, adminRoleName: true, status: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createAdmin(data: { name: string; email: string; password: string; adminRoleName: string }, createdByAdminId: string) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new HttpError(409, 'email_in_use', 'Email already registered');
  const passwordHash = await argon2.hash(data.password);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, role: 'ADMIN', adminRoleName: data.adminRoleName as never, passwordHash, emailVerifiedAt: new Date() },
    select: { id: true, name: true, email: true, adminRoleName: true, status: true },
  });
  await prisma.auditLog.create({ data: { adminId: createdByAdminId, action: 'admin.create', entity: `users/${user.id} (${data.email})`, ip: '127.0.0.1' } });
  return user;
}

export async function updateAdmin(id: string, data: { adminRoleName?: string; status?: string }, adminId: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== 'ADMIN') throw new HttpError(404, 'not_found', 'Admin not found');
  const updated = await prisma.user.update({ where: { id }, data: data as never, select: { id: true, name: true, email: true, adminRoleName: true, status: true } });
  await prisma.auditLog.create({ data: { adminId, action: 'admin.update', entity: `users/${id} (${user.email})`, afterJson: data as never, ip: '127.0.0.1' } });
  return updated;
}

// ─── Audit logs ───────────────────────────────────────────────────────────────

export async function listAuditLogs(opts: { q?: string; page?: number; limit?: number }) {
  const { q, page = 1, limit = 50 } = opts;
  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { action: { contains: q } },
      { entity: { contains: q } },
      { admin: { name: { contains: q } } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { admin: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { data, total, page, limit };
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function getReports(from?: string, to?: string) {
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();
  const [bookings, revenue, newUsers, topGuides] = await Promise.all([
    prisma.booking.count({ where: { requestedAt: { gte: fromDate, lte: toDate } } }),
    prisma.ledgerEntry.aggregate({ where: { type: 'CAPTURE', createdAt: { gte: fromDate, lte: toDate } }, _sum: { grossCents: true, commissionCents: true } }),
    prisma.user.count({ where: { createdAt: { gte: fromDate, lte: toDate }, role: { not: 'ADMIN' } } }),
    prisma.booking.groupBy({ by: ['sellerId'], _count: true, where: { requestedAt: { gte: fromDate, lte: toDate }, status: 'COMPLETED' }, orderBy: { _count: { sellerId: 'desc' } }, take: 5 }),
  ]);
  return { bookings, grossRevenue: revenue._sum.grossCents ?? 0, commission: revenue._sum.commissionCents ?? 0, newUsers, topGuideIds: topGuides.map((g) => g.sellerId) };
}
