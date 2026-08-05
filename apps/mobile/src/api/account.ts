// Mobile account/settings client — mirrors the website's accountApi / connectApi /
// paymentMethodsApi (apps/website/lib/client-api.ts) so Settings behaves the same.
// Built on the shared SDK `request`, which attaches the SecureStore access token.
import { api } from './client';

export type Role = 'BUYER' | 'SELLER';

export interface MyProfileDto {
  id: string;
  name: string;
  email: string;
  role: Role | null;
  profileJson: Record<string, unknown> | null;
}

export interface SellerReview {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  buyer: { id: string; name: string } | null;
}

export const accountApi = {
  getMe: () => api.request<MyProfileDto>('GET', '/users/me'),
  updateMe: (body: { name?: string; profileJson?: Record<string, unknown> }) =>
    api.request<MyProfileDto>('PATCH', '/users/me', body),
  // Reviews this user has received as a guide (public endpoint).
  reviews: (userId: string) =>
    api.request<{ data: SellerReview[]; total: number }>('GET', `/sellers/${userId}/reviews`),
  updateContact: (body: { email?: string; phone?: string; promo?: boolean }) =>
    api.request<{ id: string; email: string; profileJson: Record<string, unknown> | null }>(
      'POST',
      '/users/me/contact',
      body,
    ),
  completeOnboarding: (intent: string, schools?: string[]) =>
    api.request<{ id: string; role: Role; profileJson: Record<string, unknown> | null }>(
      'POST',
      '/users/me/onboarding',
      { intent, schools },
    ),
  changePassword: (newPassword: string) =>
    api.request<{ ok: true }>('POST', '/users/me/password', { newPassword }),
  deleteAccount: () => api.request<{ ok: true }>('DELETE', '/users/me'),
};

// ─── Stripe Connect (guide payouts) ───────────────────────────────────────────
export interface ConnectBank {
  bankName: string | null;
  last4: string;
  currency: string;
  country: string;
}

export interface ConnectStatus {
  connected: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  bank: ConnectBank | null;
}

export interface PayoutRow {
  amountCents: number;
  currency: string;
  status: string;
  arrivalDate: number; // unix seconds
  last4: string | null;
}

export interface PayoutSummary {
  currency: string;
  availableCents: number;
  pendingCents: number;
  completeCents: number;
  payouts: PayoutRow[];
}

export const connectApi = {
  status: () => api.request<ConnectStatus>('GET', '/sellers/me/connect/status'),
  onboard: (country?: string) =>
    api.request<{ url: string }>('POST', '/sellers/me/connect/onboard', country ? { country } : undefined),
  dashboard: () => api.request<{ url: string }>('POST', '/sellers/me/connect/dashboard'),
  payouts: () => api.request<PayoutSummary>('GET', '/sellers/me/connect/payouts'),
  cashOut: () => api.request<{ ok: true; amountCents: number }>('POST', '/sellers/me/connect/cashout'),
};

// ─── Saved cards (Payments) ───────────────────────────────────────────────────
export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export const paymentMethodsApi = {
  list: () => api.request<{ data: SavedCard[] }>('GET', '/users/me/payment-methods'),
  setup: () =>
    api.request<{ clientSecret: string | null; publishableKey: string | null }>(
      'POST',
      '/users/me/payment-methods/setup',
    ),
  setDefault: (id: string) => api.request<{ ok: true }>('POST', `/users/me/payment-methods/${id}/default`),
  remove: (id: string) => api.request<{ ok: true }>('DELETE', `/users/me/payment-methods/${id}`),
};

// ─── Display helpers ──────────────────────────────────────────────────────────
export function money(cents: number, currency: string): string {
  const v = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(v);
  } catch {
    return `$${v.toFixed(2)}`;
  }
}

export function payoutDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const DIAL_CODES = [
  { flag: '🇺🇸', code: '+1', label: 'US' },
  { flag: '🇬🇧', code: '+44', label: 'UK' },
  { flag: '🇨🇦', code: '+1', label: 'CA' },
  { flag: '🇦🇺', code: '+61', label: 'AU' },
  { flag: '🇮🇳', code: '+91', label: 'IN' },
  { flag: '🇵🇰', code: '+92', label: 'PK' },
];

export const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Pakistan',
  'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Ireland', 'Singapore',
  'United Arab Emirates',
];
