import { prisma, Prisma } from '@ucpt/db';
import { HttpError } from '../lib/http.js';
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
    prisma.$queryRaw<{ month: string; gross: number; commission: number }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
        SUM(gross_cents)::integer AS gross,
        SUM(commission_cents)::integer AS commission
      FROM ledger_entries
      WHERE type = 'CAPTURE'
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
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
    revenueSeries: Array.isArray(revenueSeries) ? revenueSeries : [],
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
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
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

export async function getOrCreateQuestionnaire() {
  const existing = await prisma.questionnaire.findFirst({
    include: { questions: { orderBy: { order: 'asc' } } },
    orderBy: { version: 'asc' },
  });
  if (existing) return existing;
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
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, status: true, emailVerifiedAt: true, createdAt: true, adminRoleName: true, sellerProfile: { select: { school: true, applicationStatus: true, ratingAvg: true, ratingCount: true } }, _count: { select: { buyerBookings: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function updateUser(id: string, data: { status?: string }, adminId?: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  const updated = await prisma.user.update({ where: { id }, data: { status: data.status as never } });
  if (adminId) await prisma.auditLog.create({ data: { adminId, action: `user.${data.status?.toLowerCase()}`, entity: `users/${id} (${user.name})`, ip: '127.0.0.1' } });
  return updated;
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function listListings(opts: { q?: string; status?: string; schoolId?: string; service?: string; page?: number; limit?: number }) {
  const { q, status, schoolId, service, page = 1, limit = 20 } = opts;
  const where: Record<string, unknown> = {};
  if (status && status !== 'ALL') where.status = status;
  if (schoolId) where.schoolId = schoolId;
  if (service && service !== 'ALL') where.serviceType = service;
  if (q) where.title = { contains: q, mode: 'insensitive' };
  const [data, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { school: true, options: true, seller: { select: { id: true, name: true } }, _count: { select: { bookings: true } } },
      orderBy: { status: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function moderateListing(id: string, data: { status?: string }, adminId?: string) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw new HttpError(404, 'not_found', 'Listing not found');
  const updated = await prisma.listing.update({ where: { id }, data: { status: data.status as never } });
  if (adminId) await prisma.auditLog.create({ data: { adminId, action: `listing.${data.status?.toLowerCase()}`, entity: `listings/${id}`, ip: '127.0.0.1' } });
  return updated;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function listBookings(opts: { status?: string; q?: string; page?: number; limit?: number }) {
  const { status, q, page = 1, limit = 20 } = opts;
  const where: Record<string, unknown> = {};
  if (status && status !== 'ALL') where.status = status;
  if (q) {
    where.OR = [
      { buyer: { name: { contains: q, mode: 'insensitive' } } },
      { seller: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        listing: { select: { title: true, serviceType: true, school: { select: { name: true } } } },
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

  await prisma.$transaction(async (tx) => {
    await tx.refund.create({ data: { bookingId: id, amountCents: refundAmount, reason, createdBy: adminId } });
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
      { buyer: { name: { contains: q, mode: 'insensitive' } } },
      { seller: { name: { contains: q, mode: 'insensitive' } } },
      { text: { contains: q, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        booking: { select: { id: true, serviceType: true } },
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

// ─── Transactions / Ledger ────────────────────────────────────────────────────

export async function listTransactions(opts: { type?: string; page?: number; limit?: number }) {
  const { type, page = 1, limit = 20 } = opts;
  const where: Record<string, unknown> = {};
  if (type && type !== 'ALL') where.type = type;
  const [data, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where,
      include: { booking: { select: { id: true, buyer: { select: { name: true } }, seller: { select: { name: true } }, serviceType: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ledgerEntry.count({ where }),
  ]);
  return { data, total, page, limit };
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

export async function getCommission() {
  const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  return { commissionPct: settings?.commissionPct ?? 25 };
}

export async function setCommission(commissionPct: number, adminId: string) {
  const old = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  const updated = await prisma.settings.update({ where: { id: 'singleton' }, data: { commissionPct } });
  await prisma.auditLog.create({ data: { adminId, action: 'commission.update', entity: `settings/commission → ${commissionPct}%`, beforeJson: { commissionPct: old?.commissionPct }, afterJson: { commissionPct }, ip: '127.0.0.1' } });
  return updated;
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
  if (q) where.name = { contains: q, mode: 'insensitive' };
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

export async function createSchool(data: { name: string; slug: string; location?: string; enabled?: boolean }) {
  const existing = await prisma.school.findUnique({ where: { slug: data.slug } });
  if (existing) throw new HttpError(409, 'slug_in_use', 'A school with that slug already exists');
  return prisma.school.create({ data });
}

export async function updateSchool(id: string, data: { name?: string; location?: string; enabled?: boolean }, adminId?: string) {
  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) throw new HttpError(404, 'not_found', 'School not found');
  const updated = await prisma.school.update({ where: { id }, data });
  if (adminId) await prisma.auditLog.create({ data: { adminId, action: 'school.update', entity: `schools/${id} (${school.name})`, afterJson: data as never, ip: '127.0.0.1' } });
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

export async function setAppConfig(data: { minSupportedVersion?: string; forceUpdateMessage?: string | null; maintenanceBanner?: string | null; featureFlagsJson?: unknown }, adminId?: string) {
  const existing = await prisma.appConfig.findFirst();
  const patch = {
    ...(data.minSupportedVersion !== undefined && { minSupportedVersion: data.minSupportedVersion }),
    ...(data.forceUpdateMessage !== undefined && { forceUpdateMessage: data.forceUpdateMessage }),
    ...(data.maintenanceBanner !== undefined && { maintenanceBanner: data.maintenanceBanner }),
    ...(data.featureFlagsJson !== undefined && { featureFlagsJson: data.featureFlagsJson as Prisma.InputJsonValue }),
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
  return prisma.notificationTemplate.findMany({ orderBy: { key: 'asc' } });
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
  const updated = await prisma.pushCampaign.update({ where: { id }, data: { status: 'SENT', scheduledAt: campaign.scheduledAt ?? new Date() } });
  if (adminId) await prisma.auditLog.create({ data: { adminId, action: 'campaign.send', entity: `campaigns/${id} (${campaign.title})`, ip: '127.0.0.1' } });
  return updated;
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
      { action: { contains: q, mode: 'insensitive' } },
      { entity: { contains: q, mode: 'insensitive' } },
      { admin: { name: { contains: q, mode: 'insensitive' } } },
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
