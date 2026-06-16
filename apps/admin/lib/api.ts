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

/** Authenticated request with one transparent refresh-and-retry on 401. */
export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  try {
    return await rawRequest<T>(method, path, body);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && tokenStore.refresh) {
      const ok = await tryRefresh();
      if (ok) return rawRequest<T>(method, path, body);
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

  questionnaires: () => request<QuestionnaireDto[]>('GET', '/admin/questionnaires'),
  questionnaireCreate: (questions: unknown[]) => request('POST', '/admin/questionnaires', { questions }),
  questionnairePublish: (id: string) => request('POST', `/admin/questionnaires/${id}/publish`),

  users: (p: { q?: string; role?: string; status?: string; page?: number } = {}) =>
    request<Paged<UserDto>>('GET', `/admin/users${qs({ ...p, limit: 100 })}`),
  userUpdate: (id: string, status: string) => request('PATCH', `/admin/users/${id}`, { status }),

  listings: (p: { q?: string; status?: string; service?: string; page?: number } = {}) =>
    request<Paged<ListingDto>>('GET', `/admin/listings${qs({ ...p, limit: 100 })}`),
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

  commission: () => request<{ commissionPct: number }>('GET', '/admin/commission'),
  commissionSet: (commissionPct: number) => request('PUT', '/admin/commission', { commissionPct }),

  settings: () => request<SettingsDto>('GET', '/admin/settings'),
  settingsSet: (b: Record<string, unknown>) => request('PUT', '/admin/settings', b),

  transactions: (p: { type?: string; page?: number } = {}) =>
    request<Paged<LedgerDto>>('GET', `/admin/transactions${qs({ ...p, limit: 100 })}`),
  guideBalances: () => request<GuideBalanceDto[]>('GET', '/admin/guide-balances'),
  payouts: (p: { sellerId?: string; page?: number } = {}) =>
    request<Paged<PayoutDto>>('GET', `/admin/payouts${qs({ ...p, limit: 100 })}`),
  payoutRecord: (sellerId: string, b: { amountCents: number; method: string; reference?: string; note?: string }) =>
    request('POST', `/admin/sellers/${sellerId}/payouts`, b),

  schools: (p: { q?: string; page?: number } = {}) =>
    request<Paged<SchoolDto>>('GET', `/admin/schools${qs({ ...p, limit: 100 })}`),
  schoolCreate: (b: { name: string; slug: string; location?: string; seoContent?: string; enabled?: boolean }) =>
    request('POST', '/admin/schools', b),
  schoolUpdate: (id: string, b: Record<string, unknown>) => request('PATCH', `/admin/schools/${id}`, b),

  cms: (p: { type?: string } = {}) => request<CmsDto[]>('GET', `/admin/cms${qs(p)}`),
  cmsCreate: (b: { key: string; type: string; contentJson: unknown; published?: boolean }) =>
    request('POST', '/admin/cms', b),
  cmsUpdate: (id: string, b: Record<string, unknown>) => request('PATCH', `/admin/cms/${id}`, b),
  cmsDelete: (id: string) => request('DELETE', `/admin/cms/${id}`),

  appConfig: () => request<AppConfigDtoRaw>('GET', '/admin/app-config'),
  appConfigSet: (b: Record<string, unknown>) => request('PUT', '/admin/app-config', b),

  templates: () => request<TemplateDto[]>('GET', '/admin/templates'),
  templateUpdate: (id: string, b: { subject?: string; body?: string }) => request('PATCH', `/admin/templates/${id}`, b),

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
};

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
  _count?: { applications: number };
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  adminRoleName: string | null;
  sellerProfile?: { school?: { name: string } | null; ratingAvg?: number; ratingCount?: number } | null;
  _count?: { buyerBookings: number };
}

export interface ListingDto {
  id: string;
  title: string;
  serviceType: string;
  status: string;
  sellerId: string;
  seller?: { id: string; name: string } | null;
  createdAt?: string;
  school: { name: string };
  options: { priceCents: number }[];
  _count?: { bookings: number };
}

export interface BookingDto {
  id: string;
  status: string;
  serviceType: string;
  scheduledDate: string;
  requestedAt: string;
  grossCents: number;
  commissionPctSnapshot: number | null;
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  listing?: { title: string; serviceType: string; school?: { name: string } | null } | null;
  schoolId?: string | null;
}

export interface ReviewDto {
  id: string;
  rating: number;
  text: string | null;
  hidden: boolean;
  createdAt: string;
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  booking?: { id: string; serviceType: string } | null;
}

export interface LedgerDto {
  id: string;
  type: string;
  grossCents: number;
  commissionCents: number;
  sellerNetCents: number;
  createdAt: string;
  booking?: { id: string; serviceType: string; buyer?: { name: string }; seller?: { name: string } } | null;
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
  location: string | null;
  seoContent: string | null;
  enabled: boolean;
  _count?: { sellerProfiles: number; listings: number };
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

export interface AppConfigDtoRaw {
  id: string;
  featureFlagsJson: Record<string, boolean>;
  minSupportedVersion: string;
  forceUpdateMessage: string | null;
  maintenanceBanner: string | null;
}

export interface TemplateDto {
  id: string;
  key: string;
  channel: string;
  subject: string | null;
  body: string;
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
