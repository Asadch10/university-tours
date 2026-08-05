'use client';

/**
 * React Query hooks for the admin console. Each hook calls the live backend via
 * `adminApi` and maps the raw DTO into the UI shapes the pages already render
 * (mirrors the old `@/lib/data` mock shapes), so pages swap mock imports for
 * hooks with minimal churn. Mutations invalidate the relevant query keys.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type SchoolPayload, type PriceBoundInput } from './api';
import type {
  School,
  User,
  Application,
  Questionnaire,
  Listing,
  Booking,
  LedgerEntry,
  GuideBalance,
  Payout,
  Refund,
  Review,
  ContactMessage,
  CmsBlock,
  NotificationTemplate,
  PushCampaign,
  AppConfig,
  AdminAccount,
  AuditLog,
  ApplicationStatus,
  BookingStatus,
  ListingStatus,
} from './data';

const nowIso = () => new Date().toISOString();

// ─── Status mappers (backend enum → UI enum) ───────────────────────────────────

const appStatus = (s: string): ApplicationStatus =>
  s === 'SUBMITTED' ? 'PENDING' : (s as ApplicationStatus);
export const appStatusToApi = (s: string) => (s === 'PENDING' ? 'SUBMITTED' : s);

// Admin now uses the same booking statuses as the website/backend — no aliasing.
const bookingStatus = (s: string): BookingStatus => s as BookingStatus;

const qType = (t: string): Questionnaire['questions'][number]['type'] =>
  t === 'TEXT' ? 'SHORT_TEXT' : t === 'SINGLE_CHOICE' ? 'SINGLE_SELECT' : t === 'MULTI_CHOICE' ? 'MULTI_SELECT' : (t as 'LONG_TEXT' | 'FILE');

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardData {
  grossRevenueCents: number;
  commissionCents: number;
  bookingsTotal: number;
  activeGuides: number;
  pendingApplications: number;
  pendingPayoutsCents: number;
  revenueSeries: { month: string; gross: number; commission: number }[];
  bookingsByStatus: { status: string; count: number }[];
  topSchools: { name: string; bookings: number }[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      const d = await adminApi.dashboard();
      return {
        grossRevenueCents: d.grossRevenueCents,
        commissionCents: d.commissionCents,
        bookingsTotal: d.bookingsTotal,
        activeGuides: d.activeGuides,
        pendingApplications: d.pendingApplications,
        pendingPayoutsCents: d.pendingPayoutsCents,
        revenueSeries: d.revenueSeries ?? [],
        bookingsByStatus: (d.bookingsByStatus ?? []).map((b) => ({
          status: b.status.charAt(0) + b.status.slice(1).toLowerCase(),
          count: b.count,
        })),
        topSchools: (d.topSchools ?? []).map((s) => ({ name: s.name, bookings: s.listings })),
      };
    },
  });
}

// ─── Applications ─────────────────────────────────────────────────────────────

export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async (): Promise<Application[]> => {
      const res = await adminApi.applications();
      return res.data.map((a) => ({
        id: a.id,
        applicant: a.seller.name,
        email: a.seller.email,
        school: a.seller.sellerProfile?.school?.name ?? '—',
        major: a.seller.sellerProfile?.major ?? '—',
        gradYear: a.seller.sellerProfile?.gradYear ?? 0,
        status: appStatus(a.status),
        submittedAt: a.submittedAt,
        enrollmentDoc: 'enrollment.pdf',
        answers: a.answers.map((ans) => ({ question: ans.questionLabelSnapshot, answer: ans.value ?? '' })),
        reason: a.reason ?? undefined,
      }));
    },
  });
}

// ─── Guide applications (become-a-guide submissions in profileJson.guideListing) ──
// The real guide applications come from the website's become-a-guide flow — not the
// legacy Application table. They're surfaced through the same /admin/listings data.

export interface GuideApplication {
  id: string;
  appNo: number; // sequential display id → "ID-1", "ID-2", … by submission order
  applicant: string;
  email: string;
  school: string;
  submittedAt: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  tourTypes: string[];
  photos: string[];
  intro: string | null;
  details: Record<string, unknown>;
}

const guideAppStatus = (s: string): GuideApplication['status'] =>
  s === 'PUBLISHED' ? 'APPROVED' : s === 'SUSPENDED' ? 'REJECTED' : 'PENDING';

export function useGuideApplications() {
  return useQuery({
    queryKey: ['guide-applications'],
    queryFn: async (): Promise<GuideApplication[]> => {
      const res = await adminApi.listings();
      return res.data
        .filter((l) => l.status !== 'DRAFT') // drafts aren't submitted applications
        .map((l) => ({
          id: l.id,
          applicant: l.seller.name,
          email: l.seller.email,
          school: l.school ?? '—',
          submittedAt: l.submittedAt,
          status: guideAppStatus(l.status),
          tourTypes: l.tourTypes ?? [],
          photos: l.photos ?? [],
          intro: l.intro,
          details: l.details ?? {},
        }))
        // Stable sequential display id by submission order (oldest = ID-1).
        .sort((a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? ''))
        .map((a, i) => ({ ...a, appNo: i + 1 }));
    },
  });
}

export function useGuideApplicationActions() {
  const qc = useQueryClient();
  const inv = () => {
    qc.invalidateQueries({ queryKey: ['guide-applications'] });
    qc.invalidateQueries({ queryKey: ['listings'] });
  };
  return {
    approve: useMutation({ mutationFn: (id: string) => adminApi.listingModerate(id, 'PUBLISHED'), onSuccess: inv }),
    reject: useMutation({ mutationFn: (id: string) => adminApi.listingModerate(id, 'SUSPENDED'), onSuccess: inv }),
  };
}

export function useApplicationActions() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['applications'] });
  return {
    approve: useMutation({ mutationFn: (id: string) => adminApi.applicationApprove(id), onSuccess: inv }),
    reject: useMutation({ mutationFn: (v: { id: string; reason: string }) => adminApi.applicationReject(v.id, v.reason), onSuccess: inv }),
    requestChanges: useMutation({ mutationFn: (v: { id: string; reason: string }) => adminApi.applicationRequestChanges(v.id, v.reason), onSuccess: inv }),
  };
}

// ─── Questionnaire (singleton) ────────────────────────────────────────────────

export function useQuestionnaire() {
  return useQuery({
    queryKey: ['questionnaire'],
    queryFn: async (): Promise<Questionnaire> => {
      const q = await adminApi.questionnaire();
      return {
        id: q.id,
        updatedAt: nowIso(),
        requiredPhotos: q.requiredPhotos ?? 3,
        questions: (q.questions ?? []).map((qq) => ({
          id: qq.id,
          type: qType(qq.type),
          label: qq.label,
          required: qq.required,
          options: qq.optionsJson ?? undefined,
        })),
      };
    },
  });
}

export function useQuestionnaireActions() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['questionnaire'] });
  return {
    addQuestion: useMutation({
      mutationFn: ({ id, question }: { id: string; question: { type: string; label: string; required: boolean; options?: string[] } }) =>
        adminApi.questionnaireAddQuestion(id, question),
      onSuccess: inv,
    }),
    updateQuestion: useMutation({
      mutationFn: ({ id, qid, data }: { id: string; qid: string; data: { type?: string; label?: string; required?: boolean; options?: string[] | null } }) =>
        adminApi.questionnaireUpdateQuestion(id, qid, data),
      onSuccess: inv,
    }),
    deleteQuestion: useMutation({
      mutationFn: ({ id, qid }: { id: string; qid: string }) => adminApi.questionnaireDeleteQuestion(id, qid),
      onSuccess: inv,
    }),
    reorderQuestions: useMutation({
      mutationFn: ({ id, orderedIds }: { id: string; orderedIds: string[] }) =>
        adminApi.questionnaireReorderQuestions(id, orderedIds),
      onSuccess: inv,
    }),
    setPhotos: useMutation({
      mutationFn: (requiredPhotos: number) => adminApi.questionnaireSetPhotos(requiredPhotos),
      onSuccess: inv,
    }),
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const res = await adminApi.users();
      // Website sign-ups keep role=null until onboarding decides it, so only
      // admins are excluded. SELLER → Guide; BUYER and undecided → Guest.
      return res.data
        .filter((u) => u.role !== 'ADMIN' && !u.adminRoleName)
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: (u.role === 'SELLER' ? 'GUIDE' : 'GUEST') as User['role'],
          status: u.status as User['status'],
          school: u.guideSchool ?? u.sellerProfile?.school?.name,
          bookings: u._count?.buyerBookings ?? 0,
          joinedAt: u.createdAt,
          emailVerified: !!u.emailVerifiedAt,
        }))
        // Stable sequential display id by join order (oldest signup = U-1).
        .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))
        .map((u, i) => ({ ...u, userNo: i + 1 }));
    },
  });
}

export function useUserActions() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['users'] });
  return {
    setStatus: useMutation({ mutationFn: (v: { id: string; status: string }) => adminApi.userUpdate(v.id, v.status), onSuccess: inv }),
    resetPassword: useMutation({ mutationFn: (id: string) => adminApi.userResetPassword(id) }),
  };
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async (): Promise<Listing[]> => {
      const res = await adminApi.listings();
      return res.data
        .map((l) => ({
          id: l.id,
          guide: l.seller.name,
          guideEmail: l.seller.email,
          school: l.school ?? '—',
          tourTypes: l.tourTypes,
          photos: l.photos,
          intro: l.intro ?? undefined,
          title: l.title,
          status: l.status as ListingStatus,
          bookings: l.bookings,
          submittedAt: l.submittedAt ?? undefined,
          createdAt: l.createdAt,
          details: l.details ?? {},
        }))
        // Stable sequential display id by creation order (oldest = L-1).
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((l, i) => ({ ...l, listingNo: i + 1 }));
    },
  });
}

export function useListingDetail(id: string) {
  return useQuery({
    queryKey: ['listings', id],
    queryFn: () => adminApi.listingDetail(id),
    enabled: !!id,
  });
}

export function useUserDetail(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => adminApi.userDetail(id),
    enabled: !!id,
  });
}

export function useListingActions() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['listings'] });
  return {
    moderate: useMutation({
      mutationFn: (v: { id: string; status: ListingStatus }) => adminApi.listingModerate(v.id, v.status),
      onSuccess: inv,
    }),
  };
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async (): Promise<Booking[]> => {
      const res = await adminApi.bookings();
      return res.data.map((b) => {
        const pct = b.commissionPctSnapshot ?? 25;
        const commission = Math.round((b.grossCents * pct) / 100);
        const pay = b.payment;
        const card = pay?.cardBrand && pay.cardLast4
          ? `${pay.cardBrand.charAt(0).toUpperCase()}${pay.cardBrand.slice(1)} ···· ${pay.cardLast4}`
          : null;
        return {
          id: b.id,
          bookingNo: b.bookingNo,
          buyer: b.buyer.name,
          guide: b.seller.name,
          school: b.listing?.school?.name ?? b.schoolName ?? '—',
          title: b.listing?.title ?? b.listingTitle ?? null,
          durationMinutes: b.durationMinutes ?? null,
          guestCount: b.guestCount ?? 1,
          scheduledTime: b.scheduledTime ?? null,
          service: b.serviceType as Booking['service'],
          status: bookingStatus(b.status),
          scheduledAt: b.scheduledDate,
          grossCents: b.grossCents,
          commissionPct: pct,
          netCents: b.grossCents - commission,
          createdAt: b.requestedAt,
          paymentStatus: pay?.status ?? null,
          paymentCard: card,
          amountRefundedCents: pay?.amountRefundedCents ?? 0,
          review: b.review ?? null,
        };
      });
    },
  });
}

export function useBookingActions() {
  const qc = useQueryClient();
  const inv = () => {
    qc.invalidateQueries({ queryKey: ['bookings'] });
    qc.invalidateQueries({ queryKey: ['refunds'] });
  };
  return {
    forceCancel: useMutation({ mutationFn: (v: { id: string; reason: string }) => adminApi.bookingForceCancel(v.id, v.reason), onSuccess: inv }),
    refund: useMutation({ mutationFn: (v: { id: string; reason: string; amountCents?: number }) => adminApi.bookingRefund(v.id, v.reason, v.amountCents), onSuccess: inv }),
  };
}

// ─── Transactions / ledger ──────────────────────────────────────────────────

/** Human invoice number derived deterministically from a booking id. */
export const invoiceNo = (bookingId: string) => `INV-${bookingId.slice(-8).toUpperCase()}`;

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async (): Promise<LedgerEntry[]> => {
      const res = await adminApi.transactions();
      // Sequential invoice numbers per unique booking (oldest first) → "INV-1", "INV-2", …
      const invMap = new Map<string, string>();
      let seq = 0;
      for (const t of [...res.data].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
        const bid = t.booking?.id;
        if (bid && !invMap.has(bid)) invMap.set(bid, `INV-${++seq}`);
      }
      return res.data.map((t) => {
        const pay = t.booking?.payment;
        const card = pay?.cardBrand && pay.cardLast4
          ? `${pay.cardBrand.charAt(0).toUpperCase()}${pay.cardBrand.slice(1)} ···· ${pay.cardLast4}`
          : null;
        const bookingId = t.booking?.id ?? '—';
        return {
          id: t.id,
          bookingId,
          invoiceNo: (t.booking && invMap.get(bookingId)) || '—',
          type: t.type as LedgerEntry['type'],
          status: t.status ?? '',
          guide: t.booking?.seller?.name ?? '—',
          guest: t.booking?.buyer?.name ?? '—',
          card,
          grossCents: t.grossCents,
          commissionCents: t.commissionCents,
          netCents: t.sellerNetCents,
          createdAt: t.createdAt,
        };
      });
    },
  });
}

export function useInvoice(bookingId: string | null) {
  return useQuery({
    queryKey: ['invoice', bookingId],
    enabled: !!bookingId,
    queryFn: () => adminApi.invoice(bookingId as string),
  });
}

export function useGuideBalances() {
  return useQuery({
    queryKey: ['guide-balances'],
    queryFn: async (): Promise<(GuideBalance & { sellerId: string })[]> => {
      const res = await adminApi.guideBalances();
      return res.map((g) => ({
        sellerId: g.sellerId,
        guide: g.name,
        school: g.school,
        completedNetCents: g.completedNetCents,
        paidOutCents: g.paidOutCents,
        balanceCents: g.balanceCents,
      }));
    },
  });
}

export function usePayouts() {
  return useQuery({
    queryKey: ['payouts'],
    queryFn: async (): Promise<Payout[]> => {
      const res = await adminApi.payouts();
      return res.data.map((p) => ({
        id: p.id,
        guide: p.seller.name,
        amountCents: p.amountCents,
        method: (p.method as Payout['method']) ?? 'BANK_TRANSFER',
        reference: p.reference ?? '—',
        createdAt: p.createdAt,
      }));
    },
  });
}

export function usePayoutActions() {
  const qc = useQueryClient();
  const inv = () => {
    qc.invalidateQueries({ queryKey: ['payouts'] });
    qc.invalidateQueries({ queryKey: ['guide-balances'] });
  };
  return {
    record: useMutation({
      mutationFn: (v: { sellerId: string; amountCents: number; method: string; reference?: string; note?: string }) =>
        adminApi.payoutRecord(v.sellerId, { amountCents: v.amountCents, method: v.method, reference: v.reference, note: v.note }),
      onSuccess: inv,
    }),
  };
}

// ─── Refunds ──────────────────────────────────────────────────────────────────

export function useRefunds() {
  return useQuery({
    queryKey: ['refunds'],
    queryFn: async (): Promise<Refund[]> => {
      const res = await adminApi.refunds();
      return res.data.map((r) => {
        const original = r.booking?.grossCents ?? r.amountCents;
        return {
          id: r.id,
          bookingId: r.booking?.id ?? '—',
          buyer: r.booking?.buyer?.name ?? '—',
          guide: r.booking?.seller?.name ?? '—',
          amountCents: r.amountCents,
          originalCents: original,
          type: r.amountCents >= original ? 'FULL' : 'PARTIAL',
          reason: r.reason ?? '',
          status: 'COMPLETED',
          createdAt: r.createdAt,
        };
      });
    },
  });
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export function useReviews() {
  return useQuery({
    queryKey: ['reviews'],
    queryFn: async (): Promise<Review[]> => {
      const res = await adminApi.reviews();
      return res.data.map((r) => ({
        id: r.id,
        bookingId: r.booking?.id ?? '—',
        bookingNo: r.booking?.bookingNo ?? null,
        buyer: r.buyer.name,
        guide: r.seller.name,
        school: r.booking?.listing?.school?.name ?? r.booking?.schoolName ?? '—',
        rating: r.rating,
        text: r.text ?? '',
        hidden: r.hidden,
        createdAt: r.createdAt,
      }));
    },
  });
}

export function useReviewActions() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['reviews'] });
  return {
    setHidden: useMutation({ mutationFn: (v: { id: string; hidden: boolean }) => adminApi.reviewModerate(v.id, v.hidden), onSuccess: inv }),
  };
}

// ─── Commission ─────────────────────────────────────────────────────────────

export function useCommission() {
  return useQuery({ queryKey: ['commission'], queryFn: () => adminApi.commission() });
}

export function useCommissionHistory() {
  return useQuery({ queryKey: ['commission-history'], queryFn: () => adminApi.commissionHistory() });
}

export function useCommissionActions() {
  const qc = useQueryClient();
  return {
    set: useMutation({
      mutationFn: (pct: number) => adminApi.commissionSet(pct),
      onSuccess: () => {
        // A rate change re-prices pending bookings — refresh everything that shows commission.
        for (const key of ['commission', 'commission-history', 'bookings', 'transactions', 'dashboard', 'guide-balances']) {
          qc.invalidateQueries({ queryKey: [key] });
        }
      },
    }),
  };
}

// ─── Service pricing ──────────────────────────────────────────────────────────

export function usePriceBounds() {
  return useQuery({ queryKey: ['price-bounds'], queryFn: () => adminApi.priceBounds() });
}

export function usePricingHistory() {
  return useQuery({ queryKey: ['pricing-history'], queryFn: () => adminApi.pricingHistory() });
}

export function usePriceBoundActions() {
  const qc = useQueryClient();
  return {
    set: useMutation({
      mutationFn: (input: PriceBoundInput) => adminApi.priceBoundsSet(input),
      onSuccess: () => {
        for (const key of ['price-bounds', 'pricing-history']) {
          qc.invalidateQueries({ queryKey: [key] });
        }
      },
    }),
  };
}

// ─── Schools / universities ───────────────────────────────────────────────────

export function useSchools() {
  return useQuery({
    queryKey: ['schools'],
    queryFn: async (): Promise<School[]> => {
      const res = await adminApi.schools();
      return res.data.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        image: s.image ?? null,
        location: s.location ?? '',
        state: s.state ?? (s.location ?? '').split(',').pop()?.trim() ?? '',
        tags: s.tags ?? [],
        toursFromCents: s.toursFromCents ?? null,
        lat: s.lat,
        lng: s.lng,
        enabled: s.enabled,
        ambassadors: s._count?.sellerProfiles ?? 0,
        bookings: s._count?.listings ?? 0,
        rating: 0,
      }));
    },
  });
}

export function useSchoolActions() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['schools'] });
  return {
    create: useMutation({ mutationFn: (b: SchoolPayload & { name: string }) => adminApi.schoolCreate(b), onSuccess: inv }),
    update: useMutation({ mutationFn: (v: { id: string; data: SchoolPayload }) => adminApi.schoolUpdate(v.id, v.data), onSuccess: inv }),
    uploadImage: useMutation({ mutationFn: (file: File) => adminApi.uploadImage(file) }),
  };
}

// ─── CMS ──────────────────────────────────────────────────────────────────────

function cmsTitle(c: Record<string, unknown>, key: string): string {
  return (c.title as string) ?? (c.question as string) ?? (c.author as string) ?? key;
}
function cmsContent(c: Record<string, unknown>): string {
  return (c.body as string) ?? (c.answer as string) ?? (c.quote as string) ?? (c.subtitle as string) ?? JSON.stringify(c);
}

export function useCmsBlocks() {
  return useQuery({
    queryKey: ['cms'],
    queryFn: async (): Promise<CmsBlock[]> => {
      const res = await adminApi.cms();
      return res.map((c) => ({
        id: c.id,
        key: c.key,
        type: c.type as CmsBlock['type'],
        title: cmsTitle(c.contentJson, c.key),
        published: c.published,
        updatedAt: nowIso(),
        content: cmsContent(c.contentJson),
      }));
    },
  });
}

export function useCmsActions() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['cms'] });
  return {
    create: useMutation({
      mutationFn: (v: { key: string; type: string; title: string; content: string; published?: boolean }) =>
        adminApi.cmsCreate({ key: v.key, type: v.type, contentJson: { title: v.title, body: v.content }, published: v.published }),
      onSuccess: inv,
    }),
    update: useMutation({
      mutationFn: (v: { id: string; title: string; content: string; published?: boolean }) =>
        adminApi.cmsUpdate(v.id, { contentJson: { title: v.title, body: v.content }, ...(v.published !== undefined ? { published: v.published } : {}) }),
      onSuccess: inv,
    }),
    setPublished: useMutation({ mutationFn: (v: { id: string; published: boolean }) => adminApi.cmsUpdate(v.id, { published: v.published }), onSuccess: inv }),
    remove: useMutation({ mutationFn: (id: string) => adminApi.cmsDelete(id), onSuccess: inv }),
  };
}

// ─── Notification templates ───────────────────────────────────────────────────

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async (): Promise<NotificationTemplate[]> => {
      const res = await adminApi.templates();
      return res.map((t) => ({
        id: t.id,
        key: t.key,
        channel: t.channel as NotificationTemplate['channel'],
        subject: t.subject ?? '',
        body: t.body,
        updatedAt: nowIso(),
        sampleVars: t.sampleVars ?? {},
      }));
    },
  });
}

export function useTemplateActions() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['templates'] });
  return {
    update: useMutation({ mutationFn: (v: { id: string; subject?: string; body?: string }) => adminApi.templateUpdate(v.id, { subject: v.subject, body: v.body }), onSuccess: inv }),
  };
}

// ─── Contact-us messages ────────────────────────────────────────────────────────

export function useContactMessages() {
  return useQuery({
    queryKey: ['contact-messages'],
    queryFn: async (): Promise<ContactMessage[]> => {
      const res = await adminApi.contactMessages();
      return (
        res.data
          .map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            topic: m.topic,
            message: m.message,
            status: m.status,
            createdAt: m.createdAt,
          }))
          // Sequential "C-<n>" by submission order (oldest = C-1); keep newest first for display.
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map((m, i) => ({ ...m, contactNo: i + 1 }))
          .reverse()
      );
    },
  });
}

export function useContactActions() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['contact-messages'] });
  return {
    setStatus: useMutation({
      mutationFn: (v: { id: string; status: string }) => adminApi.contactMessageUpdate(v.id, { status: v.status }),
      onSuccess: inv,
    }),
    remove: useMutation({
      mutationFn: (id: string) => adminApi.contactMessageDelete(id),
      onSuccess: inv,
    }),
  };
}

// ─── Push campaigns ───────────────────────────────────────────────────────────

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async (): Promise<PushCampaign[]> => {
      const res = await adminApi.campaigns();
      return res.map((c) => ({
        id: c.id,
        title: c.title,
        segment: c.segment as PushCampaign['segment'],
        body: c.body,
        status: c.status as PushCampaign['status'],
        scheduledAt: c.scheduledAt ?? undefined,
        sentAt: c.status === 'SENT' ? c.scheduledAt ?? undefined : undefined,
        reach: 0,
      }));
    },
  });
}

export function useCampaignActions() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['campaigns'] });
  return {
    create: useMutation({ mutationFn: (b: { segment: string; title: string; body: string; scheduledAt?: string }) => adminApi.campaignCreate(b), onSuccess: inv }),
    send: useMutation({ mutationFn: (id: string) => adminApi.campaignSend(id), onSuccess: inv }),
  };
}

// ─── App config ───────────────────────────────────────────────────────────────

const FLAG_LABELS: Record<string, { label: string; desc: string }> = {
  video_consultations: { label: 'Video consultations', desc: 'Allow guides to offer live video sessions.' },
  instant_book: { label: 'Instant book', desc: 'Skip request/accept for trusted guides.' },
  gift_cards: { label: 'Gift cards', desc: 'Enable purchasable gift cards (Phase 2).' },
  multi_currency: { label: 'Multi-currency', desc: 'Show prices in local currency.' },
};

export function useAppConfig() {
  return useQuery({
    queryKey: ['app-config'],
    queryFn: async (): Promise<AppConfig> => {
      const c = await adminApi.appConfig();
      const flags = c.featureFlagsJson ?? {};
      return {
        minSupportedVersion: c.minSupportedVersion,
        forceUpdateMessage: c.forceUpdateMessage ?? '',
        maintenanceMode: !!c.maintenanceBanner,
        maintenanceBanner: c.maintenanceBanner ?? '',
        emailNotificationsEnabled: c.emailNotificationsEnabled ?? true,
        pushNotificationsEnabled: c.pushNotificationsEnabled ?? true,
        featureFlags: Object.entries(flags).map(([key, enabled]) => ({
          key,
          enabled: !!enabled,
          label: FLAG_LABELS[key]?.label ?? key,
          desc: FLAG_LABELS[key]?.desc ?? '',
        })),
      };
    },
  });
}

export function useAppConfigActions() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['app-config'] });
  return {
    save: useMutation({ mutationFn: (b: Record<string, unknown>) => adminApi.appConfigSet(b), onSuccess: inv }),
    broadcastPush: useMutation({ mutationFn: (b: { title?: string; body: string }) => adminApi.broadcastPush(b) }),
  };
}

// ─── Admin accounts (roles) ───────────────────────────────────────────────────

export function useAdminAccounts() {
  return useQuery({
    queryKey: ['admins'],
    queryFn: async (): Promise<AdminAccount[]> => {
      const res = await adminApi.admins();
      return res.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        status: a.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
        lastActiveAt: a.createdAt,
      }));
    },
  });
}

export function useAdminActions() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['admins'] });
  return {
    create: useMutation({ mutationFn: (b: { name: string; email: string; password: string; adminRoleName: string }) => adminApi.adminCreate(b), onSuccess: inv }),
    update: useMutation({ mutationFn: (v: { id: string; data: { adminRoleName?: string; status?: string } }) => adminApi.adminUpdate(v.id, v.data), onSuccess: inv }),
  };
}

// ─── Audit logs ─────────────────────────────────────────────────────────────

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: async (): Promise<AuditLog[]> => {
      const res = await adminApi.auditLogs();
      return res.data.map((a) => ({
        id: a.id,
        actor: a.admin.name,
        action: a.action,
        entity: a.entity,
        ip: a.ip ?? '—',
        createdAt: a.createdAt,
      }));
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    // Poll so the bell stays fresh without a manual refresh.
    refetchInterval: 30_000,
    queryFn: async () => (await adminApi.notifications()).data,
  });
}
