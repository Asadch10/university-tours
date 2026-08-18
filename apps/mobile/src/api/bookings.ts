// Mobile bookings client — mirrors the website's bookingsApi (apps/website/lib/client-api.ts)
// so My Tours behaves the same on mobile. Built on the shared SDK `request`, which attaches
// the SecureStore access token automatically.
import { api } from './client';

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
  bookingNo: number;
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
  payment: { status: string } | null;
  videoLink: string | null;
  review: { rating: number; text: string | null } | null;
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

/** The three ways to look at a booking list — mirrors the website's My Tours. */
export type BookingPerspective = 'guest' | 'guide' | 'counselor';

export const bookingsApi = {
  // as: 'guest' (tours I booked) | 'guide' (tours I host)
  /**
   * Bookings from one perspective. `guest` = what I booked (buyer side);
   * `guide` / `counselor` = sessions I host (seller side), each narrowed to that
   * marketplace so the two never bleed into one another.
   */
  list: (as: BookingPerspective) => api.request<Paged<BookingDto>>('GET', `/bookings?as=${as}`),
  // Book a community guide (requires sign-in). Creates the booking as PENDING_PAYMENT
  // and, when payments are enabled, returns a Stripe client secret to authorize the card.
  createGuide: (input: CreateGuideBookingInput) =>
    api.request<CreateGuideBookingResult>('POST', '/bookings/guide', input),
  // Called after the card is authorized in the payment sheet — flips PENDING_PAYMENT → PENDING.
  confirmPayment: (id: string) =>
    api.request<{ ok: true; status: BookingStatus }>('POST', `/bookings/${id}/confirm-payment`),
  accept: (id: string, videoLink?: string) =>
    api.request<{ ok: true }>('POST', `/bookings/${id}/accept`, videoLink ? { videoLink } : undefined),
  decline: (id: string, reason?: string) =>
    api.request<{ ok: true }>('POST', `/bookings/${id}/decline`, { reason }),
  complete: (id: string) => api.request<{ ok: true }>('POST', `/bookings/${id}/complete`),
  review: (id: string, rating: number, text?: string) =>
    api.request<{ id: string }>('POST', `/bookings/${id}/review`, { rating, text }),
};

// ─── Display helpers ──────────────────────────────────────────────────────────

/** Cents → "$40.00". */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Human-friendly booking reference, e.g. "B-1". */
export function bookingRef(n: number): string {
  return `B-${n}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDuration(mins: number | null): string | null {
  if (!mins) return null;
  return mins % 60 === 0 ? `${mins / 60} hour${mins > 60 ? 's' : ''}` : `${mins} minutes`;
}

/** True once the guest has paid (card authorized/held or captured). */
export function guestPaid(status?: string | null): boolean {
  return status === 'requires_capture' || status === 'succeeded' || status === 'partially_refunded';
}
