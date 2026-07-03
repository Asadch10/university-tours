import * as argon2 from 'argon2';
import { prisma, Prisma } from '@ucpt/db';
import { HttpError } from '../lib/http.js';

// ─── User profile ─────────────────────────────────────────────────────────────

export async function getMyProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true, status: true,
      emailVerifiedAt: true, createdAt: true, profileJson: true,
      sellerProfile: { include: { school: true } },
      _count: { select: { buyerBookings: true } },
    },
  });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  return user;
}

export async function updateMyProfile(
  userId: string,
  data: { name?: string; profileJson?: Prisma.InputJsonValue },
) {
  const patch: Prisma.UserUpdateInput = {};
  if (typeof data.name === 'string' && data.name.trim()) patch.name = data.name.trim();
  if (data.profileJson !== undefined) patch.profileJson = data.profileJson;
  return prisma.user.update({
    where: { id: userId },
    data: patch,
    select: { id: true, name: true, email: true, role: true, profileJson: true },
  });
}

/**
 * Record first-run onboarding: merge the chosen intent into profileJson and flag it complete.
 * Merges (rather than replaces) so any existing profile fields are preserved.
 */
export async function completeOnboarding(userId: string, data: { intent?: string; schools?: string[] }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { profileJson: true, role: true } });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  const prev = (user.profileJson ?? {}) as Record<string, unknown>;
  const merged: Record<string, unknown> = {
    ...prev,
    intent: data.intent ?? null,
    onboardingComplete: true,
  };
  if (Array.isArray(data.schools)) {
    merged.schools = data.schools.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim());
  }
  const patch: Prisma.UserUpdateInput = { profileJson: merged as Prisma.InputJsonValue };
  // The onboarding choice decides the account role: guides host tours → SELLER, otherwise BUYER.
  // Never change an ADMIN.
  if (user.role !== 'ADMIN') {
    patch.role = (data.intent === 'guide' ? 'SELLER' : 'BUYER') as never;
  }
  return prisma.user.update({
    where: { id: userId },
    data: patch,
    select: { id: true, role: true, profileJson: true },
  });
}

/**
 * Save the guide application/listing (JSON). The multi-step form saves after each
 * step: intermediate steps send `status: 'draft'` so a half-finished application is
 * preserved and can be resumed later; the final "Publish" step submits it for review
 * and promotes the user to a guide (SELLER).
 *
 * Each save merges onto any existing draft, so fields accumulate across steps rather
 * than being overwritten by a later step that only carries its own fields.
 */
export async function saveGuideListing(userId: string, listing: Record<string, unknown>) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { profileJson: true, role: true } });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  const prev = (user.profileJson ?? {}) as Record<string, unknown>;
  const prevListing = (prev.guideListing ?? {}) as Record<string, unknown>;
  const isDraft = listing.status === 'draft';

  const guideListing: Record<string, unknown> = {
    ...prevListing, // keep fields saved by earlier steps
    ...listing,
  };
  if (isDraft) {
    guideListing.status = 'draft';
  } else {
    guideListing.status = 'under_review';
    guideListing.submittedAt = new Date().toISOString();
  }

  const patch: Prisma.UserUpdateInput = {
    profileJson: { ...prev, guideListing } as Prisma.InputJsonValue,
  };
  // Only submitting a completed listing makes the user a guide — a draft leaves the role untouched.
  if (!isDraft && user.role !== 'ADMIN') patch.role = 'SELLER' as never;
  return prisma.user.update({
    where: { id: userId },
    data: patch,
    select: { id: true, role: true, profileJson: true },
  });
}

/**
 * Delete the guide listing: strip it out of profileJson and, unless the user is an
 * admin, revert the role back to BUYER (they are no longer a guide).
 */
export async function deleteGuideListing(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { profileJson: true, role: true } });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  const { guideListing: _removed, ...rest } = (user.profileJson ?? {}) as Record<string, unknown>;
  const patch: Prisma.UserUpdateInput = { profileJson: rest as Prisma.InputJsonValue };
  if (user.role === 'SELLER') patch.role = 'BUYER' as never;
  return prisma.user.update({
    where: { id: userId },
    data: patch,
    select: { id: true, role: true, profileJson: true },
  });
}

/** Contact settings: email (on the user), phone + promo opt-in (in profileJson). */
export async function updateContact(
  userId: string,
  data: { email?: string; phone?: string; promo?: boolean },
) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { profileJson: true, email: true } });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');

  const merged = { ...((user.profileJson ?? {}) as Record<string, unknown>) };
  if (data.phone !== undefined) merged.phone = data.phone;
  if (data.promo !== undefined) merged.promo = data.promo;

  const patch: Prisma.UserUpdateInput = { profileJson: merged as Prisma.InputJsonValue };
  if (typeof data.email === 'string' && data.email.trim()) {
    const email = data.email.toLowerCase().trim();
    if (email !== user.email) {
      const clash = await prisma.user.findUnique({ where: { email } });
      if (clash) throw new HttpError(409, 'email_in_use', 'That email is already in use');
      patch.email = email;
    }
  }
  return prisma.user.update({
    where: { id: userId },
    data: patch,
    select: { id: true, email: true, profileJson: true },
  });
}

/** Change the account password. */
export async function changePassword(userId: string, newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    throw new HttpError(400, 'validation_error', 'Password must be at least 8 characters');
  }
  const passwordHash = await argon2.hash(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { ok: true as const };
}

/** Permanently delete the account and everything the user owns (FK-safe order). */
export async function deleteAccount(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  if (user.role === 'ADMIN') throw new HttpError(403, 'forbidden', 'Admin accounts cannot be self-deleted');

  const mine = { OR: [{ buyerId: userId }, { sellerId: userId }] };

  await prisma.$transaction([
    prisma.ledgerEntry.deleteMany({ where: { booking: mine } }),
    prisma.refund.deleteMany({ where: { booking: mine } }),
    prisma.bookingEvent.deleteMany({ where: { booking: mine } }),
    prisma.review.deleteMany({ where: mine }),
    prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { conversation: mine }] } }),
    prisma.conversation.deleteMany({ where: mine }),
    prisma.payout.deleteMany({ where: { sellerId: userId } }),
    prisma.booking.deleteMany({ where: mine }),
    prisma.applicationAnswer.deleteMany({ where: { application: { sellerId: userId } } }),
    prisma.application.deleteMany({ where: { sellerId: userId } }),
    prisma.listingOption.deleteMany({ where: { listing: { sellerId: userId } } }),
    prisma.listing.deleteMany({ where: { sellerId: userId } }),
    prisma.document.deleteMany({ where: { ownerId: userId } }),
    prisma.device.deleteMany({ where: { userId } }),
    prisma.sellerProfile.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  return { ok: true as const };
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
