import * as argon2 from 'argon2';
import { prisma, Prisma, type ApplicantKind } from '@ucpt/db';
import { HttpError } from '../lib/http.js';
import { logger } from '../lib/logger.js';
import { sendProfileUnderReviewEmail, sendListingReviewAdminEmail } from './mailer.service.js';
import { config } from '../config.js';

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
  // The onboarding choice decides the account role. Guides and counselors both sell on
  // the marketplace → SELLER; guests book → BUYER. Never change an ADMIN.
  // ('book'/'other' are the pre-counselor intent values, still stored on older accounts.)
  if (user.role !== 'ADMIN') {
    const sells = data.intent === 'guide' || data.intent === 'counselor';
    patch.role = (sells ? 'SELLER' : 'BUYER') as never;
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
  return saveApplicantListing(userId, listing, 'guideListing');
}

/**
 * Save/submit a counselor listing. Identical mechanics to the guide flow, writing to
 * `profileJson.counselorListing` — so a user can hold a guide listing and a counselor
 * listing side by side without either one clobbering the other.
 */
export async function saveCounselorListing(userId: string, listing: Record<string, unknown>) {
  return saveApplicantListing(userId, listing, 'counselorListing');
}

async function saveApplicantListing(
  userId: string,
  listing: Record<string, unknown>,
  listingKey: 'guideListing' | 'counselorListing',
) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { profileJson: true, role: true, name: true, email: true } });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  const prev = (user.profileJson ?? {}) as Record<string, unknown>;
  const prevListing = (prev[listingKey] ?? {}) as Record<string, unknown>;
  const isDraft = listing.status === 'draft';

  // Merge onto the existing draft, but never let a blank value from a later step
  // overwrite a non-empty value saved earlier. (The multi-step form re-sends the
  // whole details object on publish; if an uncontrolled field wasn't repopulated
  // on resume it can come back empty — this guard keeps the previously-saved value.)
  const isEmpty = (v: unknown) =>
    v === '' || v === null || v === undefined || (Array.isArray(v) && v.length === 0);
  const isNonEmpty = (v: unknown) => !isEmpty(v);

  const nextListing: Record<string, unknown> = { ...prevListing };
  for (const [key, value] of Object.entries(listing)) {
    if (isEmpty(value) && isNonEmpty(prevListing[key])) continue; // keep the saved value
    nextListing[key] = value;
  }
  if (isDraft) {
    nextListing.status = 'draft';
  } else {
    nextListing.status = 'under_review';
    nextListing.submittedAt = new Date().toISOString();
  }

  const patch: Prisma.UserUpdateInput = {
    profileJson: { ...prev, [listingKey]: nextListing } as Prisma.InputJsonValue,
  };
  // Only submitting a completed listing makes the user a seller — a draft leaves the role untouched.
  if (!isDraft && user.role !== 'ADMIN') patch.role = 'SELLER' as never;
  const updated = await prisma.user.update({
    where: { id: userId },
    data: patch,
    select: { id: true, role: true, profileJson: true },
  });

  // Put the matching profile into review so the admin queue and the website's status
  // banner agree. Counselors have no onboarding step that pre-creates their profile,
  // so it is upserted here on first submission.
  if (!isDraft) {
    if (listingKey === 'counselorListing') {
      await prisma.counselorProfile.upsert({
        where: { userId },
        update: { applicationStatus: 'SUBMITTED' },
        create: { userId, applicationStatus: 'SUBMITTED' },
      });
    } else {
      await prisma.sellerProfile.upsert({
        where: { userId },
        update: { applicationStatus: 'SUBMITTED' },
        create: { userId, applicationStatus: 'SUBMITTED' },
      });
    }
  }

  // Notify the applicant that their profile is under review — but only on the
  // transition into review (not on every draft save, and not if it was already
  // under review). Best-effort: a mail failure must not fail the save.
  const enteringReview = !isDraft && prevListing.status !== 'under_review';
  if (enteringReview) {
    const kind = listingKey === 'counselorListing' ? 'COUNSELOR' : 'GUIDE';
    sendProfileUnderReviewEmail({ to: user.email, name: user.name, kind }).catch((err) => {
      logger.error({ err, userId }, 'Under-review email dispatch failed');
    });

    // Notify the admin team so they know to re-check the listing and set its status.
    // An edit to an already-live listing is flagged separately from a first submission.
    const isEdit = prevListing.status === 'published' || prevListing.status === 'suspended';
    notifyAdminsListingInReview({ userId, guideName: user.name, guideEmail: user.email, isEdit, kind }).catch((err) => {
      logger.error({ err, userId }, 'Admin listing-review email dispatch failed');
    });
  }

  return updated;
}

/** Email every admin that a listing entered review, linking straight to it in the admin. */
async function notifyAdminsListingInReview(opts: {
  userId: string;
  guideName: string;
  guideEmail: string;
  isEdit: boolean;
  kind: 'GUIDE' | 'COUNSELOR';
}): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { email: true },
  });
  const to = admins.map((a) => a.email).filter(Boolean).join(', ');
  if (!to) return;

  const base = config.APP_ADMIN_URL.replace(/\/+$/, '');
  await sendListingReviewAdminEmail({
    to,
    guideName: opts.guideName,
    guideEmail: opts.guideEmail,
    // ?kind= so the admin link opens the right profile — a user may hold both.
    reviewUrl: `${base}/listings/${opts.userId}?kind=${opts.kind}`,
    isEdit: opts.isEdit,
    kind: opts.kind,
  });
}

/**
 * Delete the guide listing: strip it out of profileJson and, unless the user is an
 * admin, revert the role back to BUYER (they are no longer a guide).
 */
export async function deleteGuideListing(userId: string) {
  return deleteApplicantListing(userId, 'guideListing');
}

/** Counselor counterpart of deleteGuideListing. */
export async function deleteCounselorListing(userId: string) {
  return deleteApplicantListing(userId, 'counselorListing');
}

async function deleteApplicantListing(userId: string, listingKey: 'guideListing' | 'counselorListing') {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { profileJson: true, role: true } });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  const { [listingKey]: _removed, ...rest } = (user.profileJson ?? {}) as Record<string, unknown>;
  const patch: Prisma.UserUpdateInput = { profileJson: rest as Prisma.InputJsonValue };
  // Only drop back to BUYER if they no longer have the *other* listing either —
  // deleting a counselor listing must not strip a working guide of their role.
  const otherKey = listingKey === 'guideListing' ? 'counselorListing' : 'guideListing';
  const stillHasOther = !!(rest as Record<string, unknown>)[otherKey];
  if (user.role === 'SELLER' && !stillHasOther) patch.role = 'BUYER' as never;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: patch,
    select: { id: true, role: true, profileJson: true },
  });

  if (listingKey === 'counselorListing') {
    await prisma.counselorProfile
      .update({ where: { userId }, data: { applicationStatus: 'NOT_SUBMITTED', approvedAt: null } })
      .catch(() => {}); // no profile row yet — nothing to reset
  }
  return updated;
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
//
// Guides and counselors share this entire flow; `kind` is what separates them. It
// defaults to GUIDE everywhere so existing callers — including the shipped mobile
// app, which has no idea counselors exist — keep behaving exactly as before.

/** Ensure the profile row the given application kind writes its status to exists. */
async function ensureApplicantProfile(userId: string, kind: ApplicantKind) {
  if (kind === 'COUNSELOR') {
    // Counselors have no onboarding step that pre-creates a profile the way guides
    // do, so create it on first application rather than rejecting the submission.
    return prisma.counselorProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }
  const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!profile) throw new HttpError(400, 'no_profile', 'Seller profile not found');
  return profile;
}

export async function getActiveQuestionnaire(kind: ApplicantKind = 'GUIDE') {
  const q = await prisma.questionnaire.findFirst({
    where: { status: 'ACTIVE', kind },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (!q) throw new HttpError(404, 'not_found', 'No active questionnaire found');
  return q;
}

export async function submitApplication(
  sellerId: string,
  answers: { questionId: string; answer: string }[],
  kind: ApplicantKind = 'GUIDE',
) {
  await ensureApplicantProfile(sellerId, kind);

  // Scoped to `kind`: an approved guide must still be able to apply as a counselor.
  const existing = await prisma.application.findFirst({
    where: { sellerId, kind, status: { in: ['SUBMITTED', 'APPROVED'] } },
  });
  if (existing) throw new HttpError(409, 'already_applied', 'Application already submitted or approved');

  const questionnaire = await prisma.questionnaire.findFirst({
    where: { status: 'ACTIVE', kind },
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

  const created = await prisma.application.create({
    data: {
      sellerId,
      kind,
      questionnaireVersionId: questionnaire.id,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      answers: { create: answerRecords as never[] },
    },
    include: { questionnaire: true, answers: true },
  });

  // Mirror the application state onto the profile so the website can show status
  // without loading the application itself — same as the guide flow does.
  if (kind === 'COUNSELOR') {
    await prisma.counselorProfile.update({
      where: { userId: sellerId },
      data: { applicationStatus: 'SUBMITTED' },
    });
  } else {
    await prisma.sellerProfile.update({
      where: { userId: sellerId },
      data: { applicationStatus: 'SUBMITTED' },
    });
  }
  return created;
}

export async function getMyApplication(sellerId: string, kind: ApplicantKind = 'GUIDE') {
  const app = await prisma.application.findFirst({
    where: { sellerId, kind },
    include: { questionnaire: { include: { questions: { orderBy: { order: 'asc' } } } }, answers: true },
    orderBy: { submittedAt: 'desc' },
  });
  if (!app) throw new HttpError(404, 'not_found', 'No application found');
  return app;
}

export async function resubmitApplication(
  sellerId: string,
  answers: { questionId: string; answer: string }[],
  kind: ApplicantKind = 'GUIDE',
) {
  const app = await prisma.application.findFirst({
    where: { sellerId, kind, status: 'CHANGES_REQUESTED' },
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
    // Move the profile out of CHANGES_REQUESTED too, or the website would keep
    // showing the "changes requested" banner after a successful resubmit.
    if (kind === 'COUNSELOR') {
      await tx.counselorProfile.update({ where: { userId: sellerId }, data: { applicationStatus: 'SUBMITTED' } });
    } else {
      await tx.sellerProfile.update({ where: { userId: sellerId }, data: { applicationStatus: 'SUBMITTED' } });
    }
  });
  return { ok: true };
}
