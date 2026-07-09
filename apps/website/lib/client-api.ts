'use client';

/**
 * Website client-side API — talks to the backend (`@ucpt/backend`) over REST from
 * the browser. Access/refresh JWTs and the current user are persisted in
 * localStorage so the session survives reloads; a 401 transparently refreshes
 * once and retries. (Server components use the SDK client in `lib/api.ts`.)
 */

import type { CommunityGuideDto } from './guides';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

const ACCESS_KEY = 'ucpt_access';
const REFRESH_KEY = 'ucpt_refresh';
const USER_KEY = 'ucpt_user';

export type Role = 'BUYER' | 'SELLER';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role | null; // null until onboarding decides it
  emailVerified?: boolean;
  hasListing?: boolean; // true once the user has published a guide listing
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

interface ApiErrorShape {
  error?: string;
  code?: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Turn any thrown error into a friendly, user-facing message. */
export function friendlyError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return 'Your session has expired. Please log in again.';
    if (e.status === 403) return "You don't have permission to do that.";
    if (e.status === 404) return 'We couldn’t find what you were looking for.';
    if (e.status === 429) return 'Too many attempts. Please wait a moment and try again.';
    if (e.status >= 500) return 'Something went wrong on our end. Please try again shortly.';
    // 400 / 409 etc. — the backend messages are already user-friendly.
    return e.message || 'That didn’t work. Please try again.';
  }
  // Network failure (fetch rejects) or JSON parse error.
  if (e instanceof TypeError) return 'Can’t reach the server. Please check your connection.';
  return 'Something went wrong. Please try again.';
}

// ─── Token / session store ────────────────────────────────────────────────────

export const tokenStore = {
  get access() {
    return typeof window === 'undefined' ? null : localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return typeof window === 'undefined' ? null : localStorage.getItem(REFRESH_KEY);
  },
  get user(): SessionUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  },
  setSession(res: AuthResponse) {
    localStorage.setItem(ACCESS_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  },
  setUser(user: SessionUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
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
    throw new ApiError(res.status, err?.code ?? 'error', err?.error ?? res.statusText);
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
        localStorage.setItem(ACCESS_KEY, data.accessToken);
        localStorage.setItem(REFRESH_KEY, data.refreshToken);
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

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
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

/** Multipart image upload (field `file`). Returns an absolute URL to the stored image. */
async function uploadImage(path: string, file: File): Promise<string> {
  const doUpload = async () => {
    const headers: Record<string, string> = {};
    if (tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_URL}/api/v1${path}`, { method: 'POST', headers, body: form });
    const text = await res.text();
    const json = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      const err = json as ApiErrorShape | undefined;
      throw new ApiError(res.status, err?.code ?? 'error', err?.error ?? res.statusText);
    }
    return json as { url: string };
  };

  let out: { url: string };
  try {
    out = await doUpload();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && tokenStore.refresh && (await tryRefresh())) {
      out = await doUpload();
    } else {
      throw e;
    }
  }
  // Stored URLs are backend-relative (/uploads/…); make them absolute so the
  // website (a different origin) can render them.
  return out.url.startsWith('http') ? out.url : `${API_URL}${out.url}`;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  // Role is omitted — the backend defaults new website accounts to BUYER.
  register: (email: string, password: string, name?: string) =>
    rawRequest<AuthResponse>('POST', '/auth/register', { email, password, name }, false),
  login: (email: string, password: string) =>
    rawRequest<AuthResponse>('POST', '/auth/login', { email, password }, false),
  logout: (): Promise<unknown> =>
    tokenStore.refresh
      ? rawRequest('POST', '/auth/logout', { refreshToken: tokenStore.refresh }, false).catch(() => undefined)
      : Promise.resolve(undefined),
  // Confirm an email-verification token (public — the user may be signed out).
  verifyEmail: (token: string) =>
    rawRequest<{ ok: true; email: string; name: string; emailVerified: true }>(
      'POST',
      '/auth/verify-email',
      { token },
      false,
    ),
  // Re-send the verification email for the currently signed-in user.
  resendVerification: () =>
    request<{ ok: true; alreadyVerified: boolean }>('POST', '/auth/resend-verification'),
  // Request a password-reset email (always resolves ok, even for unknown emails).
  forgotPassword: (email: string) =>
    rawRequest<{ ok: true; message: string }>('POST', '/auth/forgot-password', { email }, false),
  // Set a new password using the token from the reset email.
  resetPassword: (token: string, password: string) =>
    rawRequest<{ ok: true }>('POST', '/auth/reset-password', { token, password }, false),
};

// ─── Public guides (admin-approved website listings) ──────────────────────────

export const guidesApi = {
  // Approved website guides shown on Browse guides. Public — no auth needed.
  community: () =>
    rawRequest<{ data: CommunityGuideDto[] }>('GET', '/search/community-guides', undefined, false),
};

// ─── Account / profile ────────────────────────────────────────────────────────

export interface MyProfileDto {
  id: string;
  name: string;
  email: string;
  role: Role | null;
  profileJson: Record<string, unknown> | null;
}

export const accountApi = {
  getMe: () => request<MyProfileDto>('GET', '/users/me'),
  updateMe: (body: { name?: string; profileJson?: Record<string, unknown> }) =>
    request<MyProfileDto>('PATCH', '/users/me', body),
  completeOnboarding: (intent: string, schools?: string[]) =>
    request<{ id: string; role: Role; profileJson: Record<string, unknown> | null }>('POST', '/users/me/onboarding', { intent, schools }),
  updateContact: (body: { email?: string; phone?: string; promo?: boolean }) =>
    request<{ id: string; email: string; profileJson: Record<string, unknown> | null }>('POST', '/users/me/contact', body),
  changePassword: (newPassword: string) =>
    request<{ ok: true }>('POST', '/users/me/password', { newPassword }),
  deleteAccount: () => request<{ ok: true }>('DELETE', '/users/me'),
  // Upload a profile photo; returns an absolute URL to store in the listing.
  uploadPhoto: (file: File) => uploadImage('/users/me/uploads', file),
  saveGuideListing: (listing: Record<string, unknown>) =>
    request<{ id: string; role: Role; profileJson: Record<string, unknown> | null }>('POST', '/users/me/guide-listing', listing),
  deleteGuideListing: () =>
    request<{ id: string; role: Role; profileJson: Record<string, unknown> | null }>('DELETE', '/users/me/guide-listing'),
};

// ─── Bookings (My tours) ──────────────────────────────────────────────────────

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'COMPLETED';

export type BookingServiceType = 'CAMPUS_TOUR' | 'VIDEO_CONSULTATION' | 'CONSULTATION';

export interface BookingDto {
  id: string;
  status: BookingStatus;
  serviceType: BookingServiceType;
  scheduledDate: string;
  scheduledTime: string | null;
  guestCount: number;
  grossCents: number;
  durationMinutes: number | null;
  listingTitle: string | null;
  schoolName: string | null;
  listing: { title: string; serviceType: string; school: { name: string } | null } | null;
  buyer: { id: string; name: string } | null;
  seller: { id: string; name: string } | null;
  // Stripe payment status (null = no payment record). `requires_capture` = guest paid,
  // funds held; `succeeded` = captured.
  payment: { status: string } | null;
}

interface Paged<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateGuideBookingInput {
  sellerId: string;
  serviceType: BookingServiceType;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string;
  guestCount?: number;
  durationMinutes?: number;
  priceCents: number;
  listingTitle?: string;
  schoolName?: string;
  noteForGuide?: string;
}

// createGuide returns the booking plus the Stripe fields needed to collect payment.
// clientSecret/publishableKey are null when payments are disabled (booking is live immediately).
export interface CreateGuideBookingResult extends BookingDto {
  clientSecret: string | null;
  publishableKey: string | null;
}

export const bookingsApi = {
  // as: 'guest' (tours I booked) | 'guide' (tours I host)
  list: (as: 'guest' | 'guide') => request<Paged<BookingDto>>('GET', `/bookings?as=${as}`),
  // Book a website "become a guide" listing (requires sign-in). Creates the booking
  // as PENDING_PAYMENT and returns a Stripe client secret to authorize the card.
  createGuide: (input: CreateGuideBookingInput) =>
    request<CreateGuideBookingResult>('POST', '/bookings/guide', input),
  // Called after the Payment Element authorizes — flips the booking to PENDING.
  confirmPayment: (id: string) =>
    request<{ ok: true; status: BookingStatus }>('POST', `/bookings/${id}/confirm-payment`),
  // Guide-only status actions (backend enforces seller ownership + role).
  accept: (id: string) => request<{ ok: true }>('POST', `/bookings/${id}/accept`),
  decline: (id: string, reason?: string) => request<{ ok: true }>('POST', `/bookings/${id}/decline`, { reason }),
  complete: (id: string) => request<{ ok: true }>('POST', `/bookings/${id}/complete`),
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface ReviewDto {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  buyer: { id: string; name: string } | null;
}

export const reviewsApi = {
  // Reviews received by a user (as a guide). Public endpoint.
  forUser: (userId: string) => request<Paged<ReviewDto>>('GET', `/sellers/${userId}/reviews`),
};
