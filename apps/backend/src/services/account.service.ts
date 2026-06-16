import { prisma, Prisma } from '@ucpt/db';
import { HttpError } from '../lib/http.js';

// ─── User profile ─────────────────────────────────────────────────────────────

export async function getMyProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true, status: true,
      emailVerifiedAt: true, createdAt: true,
      sellerProfile: { include: { school: true } },
      _count: { select: { buyerBookings: true } },
    },
  });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  return user;
}

export async function updateMyProfile(userId: string, data: { name?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, role: true },
  });
}

// ─── Seller profile / earnings / payouts ──────────────────────────────────────

export async function getPublicSellerProfile(sellerId: string) {
  const [profile, listings] = await Promise.all([
    prisma.sellerProfile.findUnique({
      where: { userId: sellerId },
      include: {
        user: { select: { id: true, name: true } },
        school: true,
      },
    }),
    prisma.listing.findMany({
      where: { sellerId, status: 'ACTIVE' },
      include: { options: true, school: true },
    }),
  ]);
  if (!profile || profile.applicationStatus !== 'APPROVED') {
    throw new HttpError(404, 'not_found', 'Guide not found');
  }
  return { ...profile, listings };
}

export async function getSellerReviews(sellerId: string, page = 1, limit = 20) {
  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where: { sellerId, hidden: false },
      include: { buyer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where: { sellerId, hidden: false } }),
  ]);
  return { data, total, page, limit };
}

export async function getMyListings(sellerId: string) {
  return prisma.listing.findMany({
    where: { sellerId },
    include: { options: true, school: true, _count: { select: { bookings: true } } },
    orderBy: { id: 'desc' },
  });
}

export async function getMyEarnings(sellerId: string) {
  const [earned, paid] = await Promise.all([
    prisma.ledgerEntry.aggregate({ where: { booking: { sellerId }, type: 'CAPTURE' }, _sum: { sellerNetCents: true, grossCents: true, commissionCents: true } }),
    prisma.payout.aggregate({ where: { sellerId }, _sum: { amountCents: true } }),
  ]);
  return {
    grossCents: earned._sum.grossCents ?? 0,
    commissionCents: earned._sum.commissionCents ?? 0,
    netCents: earned._sum.sellerNetCents ?? 0,
    paidOutCents: paid._sum.amountCents ?? 0,
    balanceCents: Math.max(0, (earned._sum.sellerNetCents ?? 0) - (paid._sum.amountCents ?? 0)),
  };
}

export async function getMyPayouts(sellerId: string, page = 1, limit = 20) {
  const [data, total] = await Promise.all([
    prisma.payout.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.payout.count({ where: { sellerId } }),
  ]);
  return { data, total, page, limit };
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function getActiveQuestionnaire() {
  const q = await prisma.questionnaire.findFirst({
    where: { status: 'ACTIVE' },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (!q) throw new HttpError(404, 'not_found', 'No active questionnaire found');
  return q;
}

export async function submitApplication(sellerId: string, answers: { questionId: string; answer: string }[]) {
  const profile = await prisma.sellerProfile.findUnique({ where: { userId: sellerId } });
  if (!profile) throw new HttpError(400, 'no_profile', 'Seller profile not found');

  const existing = await prisma.application.findFirst({
    where: { sellerId, status: { in: ['SUBMITTED', 'APPROVED'] } },
  });
  if (existing) throw new HttpError(409, 'already_applied', 'Application already submitted or approved');

  const questionnaire = await prisma.questionnaire.findFirst({
    where: { status: 'ACTIVE' },
    include: { questions: true },
  });
  if (!questionnaire) throw new HttpError(400, 'no_questionnaire', 'No active questionnaire');

  const questionMap = new Map(questionnaire.questions.map((q) => [q.id, q]));
  const answerRecords = answers.map((a) => {
    const question = questionMap.get(a.questionId);
    return {
      questionLabelSnapshot: question?.label ?? a.questionId,
      optionsSnapshot: question?.optionsJson !== undefined ? question.optionsJson : Prisma.DbNull,
      value: a.answer,
    };
  });

  return prisma.application.create({
    data: {
      sellerId,
      questionnaireVersionId: questionnaire.id,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      answers: { create: answerRecords as never[] },
    },
    include: { questionnaire: true, answers: true },
  });
}

export async function getMyApplication(sellerId: string) {
  const app = await prisma.application.findFirst({
    where: { sellerId },
    include: { questionnaire: { include: { questions: { orderBy: { order: 'asc' } } } }, answers: true },
    orderBy: { submittedAt: 'desc' },
  });
  if (!app) throw new HttpError(404, 'not_found', 'No application found');
  return app;
}

export async function resubmitApplication(sellerId: string, answers: { questionId: string; answer: string }[]) {
  const app = await prisma.application.findFirst({
    where: { sellerId, status: 'CHANGES_REQUESTED' },
    include: { questionnaire: { include: { questions: true } } },
    orderBy: { submittedAt: 'desc' },
  });
  if (!app) throw new HttpError(404, 'not_found', 'No application pending changes');

  const questionMap = new Map(app.questionnaire.questions.map((q) => [q.id, q]));
  const answerRecords = answers.map((a) => ({
    questionLabelSnapshot: questionMap.get(a.questionId)?.label ?? a.questionId,
    optionsSnapshot: questionMap.get(a.questionId)?.optionsJson ?? Prisma.DbNull,
    value: a.answer,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.applicationAnswer.deleteMany({ where: { applicationId: app.id } });
    await tx.application.update({
      where: { id: app.id },
      data: { status: 'SUBMITTED', submittedAt: new Date(), answers: { create: answerRecords as never[] } },
    });
  });
  return { ok: true };
}
