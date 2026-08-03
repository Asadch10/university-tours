'use client';

/**
 * Live API client for the admin console.
 *
 * Thin fetch wrapper over the backend `/api/v1` surface with access/refresh token
 * management (persisted to localStorage). On a 401 it transparently rotates the
 * refresh token once and retries. Every admin page reads through the hooks in
 * `queries.ts`, which call the typed helpers exposed here.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const ACCESS_KEY = 'ucpt.admin.access';
const REFRESH_KEY = 'ucpt.admin.refresh';
const USER_KEY = 'ucpt.admin.user.v2'; // kept in sync with STORAGE_KEY in lib/auth.tsx

export interface ApiErrorShape {
  error: string;
  code: string;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Token storage ──────────────────────────────────────────────────────────

export const tokenStore = {
  get access() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ─── Core request ─────────────────────────────────────────────────────────────

async function rawRequest<T>(method: string, path: string, body?: unknown, withAuth = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth && tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const err = json as ApiErrorShape | undefined;
    throw new ApiError(res.status, err?.code ?? 'error', err?.error ?? res.statusText, err?.details);
  }
  return json as T;
}

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!tokenStore.refresh) return false;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const data = await rawRequest<{ accessToken: string; refreshToken: string }>(
          'POST',
          '/auth/refresh',
          { refreshToken: tokenStore.refresh },
          false,
        );
        tokenStore.set(data.accessToken, data.refreshToken);
        return true;
      } catch {
        tokenStore.clear();
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

/** Session is unrecoverable (no/expired tokens) — wipe it and send the user to sign in again. */
function forceLogout() {
  if (typeof window === 'undefined') return;
  tokenStore.clear();
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    /* storage unavailable */
  }
  // basePath ('/admin') isn't applied to raw window.location — prefix it manually.
  const loginPath = '/admin/login';
  if (!window.location.pathname.startsWith(loginPath)) window.location.assign(loginPath);
}

/** Authenticated request with one transparent refresh-and-retry on 401. */
export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  try {
    return await rawRequest<T>(method, path, body);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      if (tokenStore.refresh) {
        const ok = await tryRefresh();
        if (ok) return rawRequest<T>(method, path, body);
      }
      forceLogout();
    }
    throw e;
  }
}

// ─── File upload (multipart) ──────────────────────────────────────────────────

async function rawUpload<T>(path: string, file: File): Promise<T> {
  const fd = new FormData();
  fd.append('file', file);
  const headers: Record<string, string> = {};
  if (tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;
  // NOTE: do not set Content-Type — the browser sets the multipart boundary.
  const res = await fetch(`${API_URL}/api/v1${path}`, { method: 'POST', headers, body: fd });
  const text = await res.text();
  const json = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const err = json as ApiErrorShape | undefined;
    throw new ApiError(res.status, err?.code ?? 'error', err?.error ?? res.statusText, err?.details);
  }
  return json as T;
}

/** Upload a single image; returns its public URL. Transparent refresh-and-retry on 401. */
export async function uploadFile(path: string, file: File): Promise<{ url: string; filename: string }> {
  try {
    return await rawUpload(path, file);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      if (tokenStore.refresh) {
        const ok = await tryRefresh();
        if (ok) return rawUpload(path, file);
      }
      forceLogout();
    }
    throw e;
  }
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== 'ALL') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// ─── Shared list response shape ───────────────────────────────────────────────

export interface Paged<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    adminRoleName: string | null;
    permissions: string[];
    emailVerified: boolean;
  };
}

export const authApi = {
  login: (email: string, password: string) =>
    rawRequest<LoginResponse>('POST', '/auth/login', { email, password }, false),
  me: () => request<LoginResponse['user'] & { status: string; createdAt: string }>('GET', '/auth/me'),
  logout: () => request<{ ok: true }>('POST', '/auth/logout', { refreshToken: tokenStore.refresh }),
};

// ─── Admin endpoints (raw backend JSON; mapping happens in queries.ts) ─────────

export const adminApi = {
  dashboard: () => request<DashboardDto>('GET', '/admin/dashboard'),

  applications: (p: { status?: string; q?: string; page?: number } = {}) =>
    request<Paged<ApplicationDto>>('GET', `/admin/applications${qs({ ...p, limit: 100 })}`),
  applicationApprove: (id: string) => request('POST', `/admin/applications/${id}/approve`),
  applicationReject: (id: string, reason: string) => request('POST', `/admin/applications/${id}/reject`, { reason }),
  applicationRequestChanges: (id: string, reason: string) =>
    request('POST', `/admin/applications/${id}/request-changes`, { reason }),

  questionnaire: () => request<QuestionnaireDto>('GET', '/admin/questionnaires'),
  questionnaireAddQuestion: (id: string, q: { type: string; label: string; required: boolean; options?: string[] }) =>
    request<QuestionnaireDto['questions'][number]>('POST', `/admin/questionnaires/${id}/questions`, q),
  questionnaireUpdateQuestion: (id: string, qid: string, q: { type?: string; label?: string; required?: boolean; options?: string[] | null }) =>
    request<QuestionnaireDto['questions'][number]>('PUT', `/admin/questionnaires/${id}/questions/${qid}`, q),
  questionnaireDeleteQuestion: (id: string, qid: string) =>
    request<{ ok: true }>('DELETE', `/admin/questionnaires/${id}/questions/${qid}`),
  questionnaireReorderQuestions: (id: string, orderedIds: string[]) =>
    request<{ ok: true }>('PUT', `/admin/questionnaires/${id}/questions/reorder`, { orderedIds }),
  questionnaireSetPhotos: (requiredPhotos: number) =>
    request<{ requiredPhotos: number }>('PUT', '/admin/questionnaires/photos', { requiredPhotos }),

  users: (p: { q?: string; role?: string; status?: string; page?: number } = {}) =>
    request<Paged<UserDto>>('GET', `/admin/users${qs({ ...p, limit: 100 })}`),
  userDetail: (id: string) => request<UserDetailDto>('GET', `/admin/users/${id}`),
  userUpdate: (id: string, status: string) => request('PATCH', `/admin/users/${id}`, { status }),
  userResetPassword: (id: string) =>
    request<{ ok: true; email: string; sent: boolean }>('POST', `/admin/users/${id}/reset-password`),

  listings: (p: { q?: string; status?: string; service?: string; page?: number } = {}) =>
    request<Paged<ListingDto>>('GET', `/admin/listings${qs({ ...p, limit: 100 })}`),
  listingDetail: (id: string) => request<ListingDetailDto>('GET', `/admin/listings/${id}`),
  listingModerate: (id: string, status: string) => request('PATCH', `/admin/listings/${id}`, { status }),

  bookings: (p: { status?: string; q?: string; page?: number } = {}) =>
    request<Paged<BookingDto>>('GET', `/admin/bookings${qs({ ...p, limit: 100 })}`),
  bookingForceCancel: (id: string, reason: string) => request('POST', `/admin/bookings/${id}/force-cancel`, { reason }),
  bookingRefund: (id: string, reason: string, amountCents?: number) =>
    request('POST', `/admin/bookings/${id}/refund`, { reason, amountCents }),

  refunds: (p: { q?: string; page?: number } = {}) =>
    request<Paged<RefundDto>>('GET', `/admin/refunds${qs({ ...p, limit: 100 })}`),

  reviews: (p: { q?: string; hidden?: boolean; page?: number } = {}) =>
    request<Paged<ReviewDto>>('GET', `/admin/reviews${qs({ ...p, limit: 100 })}`),
  reviewModerate: (id: string, hidden: boolean) => request('PATCH', `/admin/reviews/${id}`, { hidden }),

  commission: () => request<{ commissionPct: number; pendingCount: number }>('GET', '/admin/commission'),
  commissionSet: (commissionPct: number) =>
    request<{ commissionPct: number; affected: number }>('PUT', '/admin/commission', { commissionPct }),
  commissionHistory: () => request<CommissionChangeDto[]>('GET', '/admin/commission/history'),

  settings: () => request<SettingsDto>('GET', '/admin/settings'),
  settingsSet: (b: Record<string, unknown>) => request('PUT', '/admin/settings', b),

  transactions: (p: { type?: string; page?: number } = {}) =>
    request<Paged<LedgerDto>>('GET', `/admin/transactions${qs({ ...p, limit: 100 })}`),
  invoice: (bookingId: string) => request<InvoiceDto>('GET', `/admin/transactions/${bookingId}`),
  guideBalances: () => request<GuideBalanceDto[]>('GET', '/admin/guide-balances'),
  payouts: (p: { sellerId?: string; page?: number } = {}) =>
    request<Paged<PayoutDto>>('GET', `/admin/payouts${qs({ ...p, limit: 100 })}`),
  payoutRecord: (sellerId: string, b: { amountCents: number; method: string; reference?: string; note?: string }) =>
    request('POST', `/admin/sellers/${sellerId}/payouts`, b),

  schools: (p: { q?: string; page?: number } = {}) =>
    request<Paged<SchoolDto>>('GET', `/admin/schools${qs({ ...p, limit: 100 })}`),
  schoolCreate: (b: SchoolPayload & { name: string }) =>
    request<SchoolDto>('POST', '/admin/schools', b),
  schoolUpdate: (id: string, b: SchoolPayload) => request<SchoolDto>('PATCH', `/admin/schools/${id}`, b),
  uploadImage: (file: File) => uploadFile('/admin/uploads', file),

  cms: (p: { type?: string } = {}) => request<CmsDto[]>('GET', `/admin/cms${qs(p)}`),
  cmsCreate: (b: { key: string; type: string; contentJson: unknown; published?: boolean }) =>
    request('POST', '/admin/cms', b),
  cmsUpdate: (id: string, b: Record<string, unknown>) => request('PATCH', `/admin/cms/${id}`, b),
  cmsDelete: (id: string) => request('DELETE', `/admin/cms/${id}`),

  appConfig: () => request<AppConfigDtoRaw>('GET', '/admin/app-config'),
  appConfigSet: (b: Record<string, unknown>) => request('PUT', '/admin/app-config', b),
  broadcastPush: (b: { title?: string; body: string }) =>
    request<{ ok: true; devices: number }>('POST', '/admin/app-config/broadcast-push', b),

  templates: () => request<TemplateDto[]>('GET', '/admin/templates'),
  templateUpdate: (id: string, b: { subject?: string; body?: string }) => request('PATCH', `/admin/templates/${id}`, b),

  contactMessages: (p: { q?: string; status?: string; page?: number } = {}) =>
    request<Paged<ContactMessageDto>>('GET', `/admin/contact-messages${qs({ ...p, limit: 200 })}`),
  contactMessage: (id: string) => request<ContactMessageDto>('GET', `/admin/contact-messages/${id}`),
  contactMessageUpdate: (id: string, b: { status?: string }) =>
    request<ContactMessageDto>('PATCH', `/admin/contact-messages/${id}`, b),
  contactMessageDelete: (id: string) => request<{ ok: true }>('DELETE', `/admin/contact-messages/${id}`),

  campaigns: () => request<CampaignDto[]>('GET', '/admin/campaigns'),
  campaignCreate: (b: { segment: string; title: string; body: string; scheduledAt?: string }) =>
    request('POST', '/admin/campaigns', b),
  campaignSend: (id: string) => request('POST', `/admin/campaigns/${id}/send`),

  admins: () => request<AdminDto[]>('GET', '/admin/admins'),
  adminCreate: (b: { name: string; email: string; password: string; adminRoleName: string }) =>
    request('POST', '/admin/admins', b),
  adminUpdate: (id: string, b: { adminRoleName?: string; status?: string }) => request('PATCH', `/admin/admins/${id}`, b),

  auditLogs: (p: { q?: string; page?: number } = {}) =>
    request<Paged<AuditDto>>('GET', `/admin/audit-logs${qs({ ...p, limit: 100 })}`),
  notifications: () => request<{ data: NotificationDto[] }>('GET', '/admin/notifications'),
};

export interface NotificationDto {
  id: string;
  type: 'signup' | 'booking' | 'payment' | 'review' | 'listing' | 'contact';
  title: string;
  detail: string;
  href: string;
  createdAt: string;
}

// ─── Raw backend DTO types ──────────────────────────────────────────────────

export interface DashboardDto {
  grossRevenueCents: number;
  commissionCents: number;
  bookingsTotal: number;
  activeGuides: number;
  pendingApplications: number;
  pendingPayoutsCents: number;
  bookingsByStatus: { status: string; count: number }[];
  topSchools: { id: string; name: string; slug: string; listings: number }[];
  revenueSeries: { month: string; gross: number; commission: number }[];
}

export interface ApplicationDto {
  id: string;
  status: string;
  reason: string | null;
  submittedAt: string;
  seller: { id: string; name: string; email: string; sellerProfile?: { school?: { name: string } | null; major?: string | null; gradYear?: number | null } | null };
  questionnaire?: { version: number } | null;
  answers: { questionLabelSnapshot: string; value: string | null }[];
}

export interface QuestionnaireDto {
  id: string;
  version: number;
  status: string;
  questions: { id: string; type: string; label: string; required: boolean; order: number; optionsJson: string[] | null }[];
  requiredPhotos?: number;
  _count?: { applications: number };
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: string | null; // null until onboarding decides guide vs guest
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  adminRoleName: string | null;
  guideSchool?: string | null; // school from the become-a-guide form (profileJson.guideListing.school)
  sellerProfile?: { school?: { name: string } | null; ratingAvg?: number; ratingCount?: number } | null;
  _count?: { buyerBookings: number };
}

export interface UserDetailBooking {
  id: string;
  bookingNo: number;
  status: string;
  serviceType: string;
  scheduledDate: string;
  grossCents: number;
  listingTitle: string | null;
  schoolName: string | null;
  side: 'guest' | 'guide';
  counterparty: string;
}

export interface UserDetailReview {
  id: string;
  rating: number;
  text: string | null;
  hidden: boolean;
  createdAt: string;
  side: 'received' | 'written';
  counterparty: string;
  bookingId: string | null;
  bookingNo: number | null;
}

export interface UserDetailDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  status: string;
  emailVerified: boolean;
  isAdmin: boolean;
  joinedAt: string;
  counts: { asGuest: number; asGuide: number };
  guideListing: { title: string; school: string | null; status: string; tourTypes: string[] } | null;
  sellerProfile: {
    school: string | null;
    major: string | null;
    gradYear: number | null;
    applicationStatus: string | null;
    ratingAvg: number | null;
    ratingCount: number | null;
  } | null;
  bookings: UserDetailBooking[];
  reviews: UserDetailReview[];
}

/** Guide listing surfaced from the owner's `profileJson.guideListing` (one per user; id = owner's user id). */
export interface ListingDto {
  id: string;
  title: string;
  school: string | null;
  tourTypes: string[];
  photos: string[];
  intro: string | null;
  status: string; // DRAFT | UNDER_REVIEW | PUBLISHED | SUSPENDED
  submittedAt: string | null;
  createdAt: string;
  seller: { id: string; name: string; email: string };
  bookings: number;
  /** Full form answers as saved by the website's become-a-guide flow. */
  details: Record<string, unknown>;
}

/** Listing detail page payload: the listing plus the owner's account and seller profile. */
export interface ListingDetailDto extends Omit<ListingDto, 'seller'> {
  publishedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string | null;
    status: string;
    emailVerified: boolean;
    joinedAt: string;
    buyerBookings: number;
  };
  sellerProfile: {
    school: string | null;
    major: string | null;
    gradYear: number | null;
    bio: string | null;
    applicationStatus: string;
    approvedAt: string | null;
    ratingAvg: number;
    ratingCount: number;
  } | null;
}

export interface BookingDto {
  id: string;
  bookingNo: number;
  status: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime?: string | null;
  guestCount?: number;
  requestedAt: string;
  grossCents: number;
  commissionPctSnapshot: number | null;
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  listing?: { title: string; serviceType: string; school?: { name: string } | null } | null;
  listingTitle?: string | null;
  schoolName?: string | null;
  durationMinutes?: number | null;
  schoolId?: string | null;
  payment?: {
    status: string;
    amountCents: number;
    amountRefundedCents: number;
    cardBrand: string | null;
    cardLast4: string | null;
  } | null;
  review?: { rating: number; text: string | null; hidden: boolean; createdAt: string } | null;
}

export interface ReviewDto {
  id: string;
  rating: number;
  text: string | null;
  hidden: boolean;
  createdAt: string;
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  booking?: {
    id: string;
    bookingNo: number;
    serviceType: string;
    schoolName: string | null;
    listing?: { school?: { name: string } | null } | null;
  } | null;
}

export interface LedgerDto {
  id: string;
  type: string;
  status?: string; // payment status: requires_capture | succeeded | refunded | ...
  grossCents: number;
  commissionCents: number;
  sellerNetCents: number;
  createdAt: string;
  booking?: {
    id: string;
    serviceType: string;
    scheduledDate?: string;
    buyer?: { name: string; email?: string };
    seller?: { name: string };
    payment?: { cardBrand: string | null; cardLast4: string | null; status: string; billingName: string | null } | null;
  } | null;
}

// Full invoice for one booking (payment payload + ledger + refunds).
export interface PaymentDto {
  id: string;
  stripePaymentIntentId: string;
  stripeChargeId: string | null;
  amountCents: number;
  amountRefundedCents: number;
  currency: string;
  status: string;
  cardBrand: string | null;
  cardLast4: string | null;
  cardExpMonth: number | null;
  cardExpYear: number | null;
  billingName: string | null;
  billingEmail: string | null;
  receiptUrl: string | null;
  rawJson: unknown;
  authorizedAt: string | null;
  capturedAt: string | null;
  createdAt: string;
}

export interface InvoiceDto {
  id: string;
  status: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string | null;
  guestCount: number;
  durationMinutes: number | null;
  listingTitle: string | null;
  schoolName: string | null;
  grossCents: number;
  commissionPctSnapshot: number | null;
  commissionCents: number | null;
  sellerNetCents: number | null;
  stripePaymentIntentId: string | null;
  requestedAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  buyer: { id: string; name: string; email: string };
  seller: { id: string; name: string; email: string };
  payment: PaymentDto | null;
  ledger: { id: string; type: string; grossCents: number; commissionPct: number; commissionCents: number; sellerNetCents: number; createdAt: string }[];
  refunds: { id: string; amountCents: number; reason: string | null; stripeRefundId: string | null; createdAt: string; createdByUser?: { name: string } | null }[];
  events: { id: string; fromState: string | null; toState: string; actor: string; reason: string | null; createdAt: string }[];
}

export interface RefundDto {
  id: string;
  amountCents: number;
  reason: string | null;
  createdAt: string;
  booking?: { id: string; grossCents: number; buyer?: { name: string }; seller?: { name: string } } | null;
}

export interface GuideBalanceDto {
  sellerId: string;
  name: string;
  school: string;
  completedNetCents: number;
  paidOutCents: number;
  balanceCents: number;
}

export interface PayoutDto {
  id: string;
  amountCents: number;
  method: string;
  reference: string | null;
  note: string | null;
  createdAt: string;
  seller: { id: string; name: string };
}

export interface SchoolDto {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  location: string | null;
  state: string | null;
  tags: string[];
  toursFromCents: number | null;
  seoContent?: string | null;
  lat: number | null;
  lng: number | null;
  enabled: boolean;
  _count?: { sellerProfiles: number; listings: number };
}

/** Editable university fields sent to create/update. */
export interface SchoolPayload {
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

export interface CmsDto {
  id: string;
  key: string;
  type: string;
  contentJson: Record<string, unknown>;
  published: boolean;
}

export interface SettingsDto {
  id: string;
  commissionPct: number;
  refundWindowsJson: Record<string, unknown>;
  requestExpiryHours: number;
  maskingEnabled: boolean;
}

export interface CommissionChangeDto {
  id: string;
  oldPct: number | null;
  newPct: number | null;
  reapplied: number | null;
  actor: string;
  changedAt: string;
}

export interface AppConfigDtoRaw {
  id: string;
  featureFlagsJson: Record<string, boolean>;
  minSupportedVersion: string;
  forceUpdateMessage: string | null;
  maintenanceBanner: string | null;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
}

export interface TemplateDto {
  id: string;
  key: string;
  channel: string;
  subject: string | null;
  body: string;
  sampleVars?: Record<string, string> | null; // realistic values for the live preview
}

export interface ContactMessageDto {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: string; // new | read
  createdAt: string;
}

export interface CampaignDto {
  id: string;
  segment: string;
  title: string;
  body: string;
  scheduledAt: string | null;
  status: string;
}

export interface AdminDto {
  id: string;
  name: string;
  email: string;
  adminRoleName: string | null;
  status: string;
  createdAt: string;
}

export interface AuditDto {
  id: string;
  action: string;
  entity: string;
  ip: string | null;
  createdAt: string;
  admin: { id: string; name: string; email: string };
}
