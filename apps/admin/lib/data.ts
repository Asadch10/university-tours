/**
 * UI type definitions for the admin console.
 *
 * Shapes mirror the PostgreSQL entity catalog (Part IV §3) and the API contract (Part I §7).
 * All data is fetched live from the backend via the hooks in `queries.ts`; the raw DTOs
 * (see `api.ts`) are mapped into these shapes before rendering. All money is integer cents;
 * all timestamps are ISO-8601 UTC.
 */

export type ServiceType = 'CAMPUS_TOUR' | 'VIDEO_CONSULTATION' | 'CONSULTATION';
// Mirrors the backend/website statuses (same labels guests & guides see in My tours).
export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';
export type UserRole = 'GUIDE' | 'GUEST';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
export type ListingStatus = 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'SUSPENDED';

// ─────────────────────────────────────────────────────────── Universities
export interface School {
  id: string;
  name: string;
  slug: string;
  location: string;
  state: string;
  image?: string | null;
  tags?: string[];
  toursFromCents?: number | null;
  lat?: number | null;
  lng?: number | null;
  enabled: boolean;
  ambassadors: number;
  bookings: number;
  rating: number;
}

// ─────────────────────────────────────────────────────────── Users
export interface User {
  id: string;
  userNo: number; // sequential display id → "U-1", "U-2", … by join order
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  school?: string;
  bookings: number;
  joinedAt: string;
  avatar?: string;
  emailVerified: boolean;
}

// ─────────────────────────────────────────────────────────── Applications
export interface ApplicationAnswer {
  question: string;
  answer: string;
}
export interface Application {
  id: string;
  applicant: string;
  email: string;
  /** Which flow this application came from. Drives the badge and the kind filter. */
  kind: 'GUIDE' | 'COUNSELOR';
  school: string;
  major: string;
  gradYear: number;
  status: ApplicationStatus;
  submittedAt: string;
  avatar?: string;
  enrollmentDoc: string;
  answers: ApplicationAnswer[];
  reason?: string;
}

// ─────────────────────────────────────────────────────────── Questionnaire
export type QuestionType = 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_SELECT' | 'MULTI_SELECT' | 'FILE';
export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[];
}
export interface Questionnaire {
  id: string;
  updatedAt: string;
  questions: Question[];
  requiredPhotos: number; // how many profile photos a guide must upload
}

// ─────────────────────────────────────────────────────────── Listings
// Mirrors the website's guide listing (`profileJson.guideListing`); one per guide,
// so `id` is the owner's user id.
export interface Listing {
  id: string;
  listingNo: number; // sequential display id → "L-1", "L-2", … by creation order
  guide: string;
  guideEmail: string;
  guideAvatar?: string;
  school: string;
  tourTypes: string[];
  photos: string[];
  intro?: string;
  title: string;
  status: ListingStatus;
  bookings: number;
  submittedAt?: string;
  createdAt: string;
  /** Full form answers as saved by the website's become-a-guide flow. */
  details: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────── Bookings
export interface Booking {
  id: string;
  bookingNo: number; // human-friendly sequential reference, shown as "B-{n}"
  buyer: string; // guest name (kept as `buyer` internally; shown as "Guest")
  guide: string;
  school: string;
  title: string | null;
  durationMinutes: number | null;
  guestCount: number;
  scheduledTime: string | null;
  service: ServiceType;
  status: BookingStatus;
  scheduledAt: string;
  grossCents: number;
  commissionPct: number;
  netCents: number;
  createdAt: string;
  paymentStatus: string | null; // Stripe payment status (null = no payment record)
  paymentCard: string | null; // e.g. "Visa ···· 4242"
  amountRefundedCents: number;
  review: { rating: number; text: string | null; hidden: boolean; createdAt: string } | null;
}

// ─────────────────────────────────────────────────────────── Transactions / Ledger
export interface LedgerEntry {
  id: string;
  bookingId: string;
  invoiceNo: string;
  type: 'CAPTURE' | 'REFUND' | 'PAYOUT';
  status: string; // payment status: requires_capture | succeeded | refunded | ...
  guide: string;
  guest: string;
  card: string | null; // e.g. "Visa ···· 4242"
  grossCents: number;
  commissionCents: number;
  netCents: number;
  createdAt: string;
}

export interface GuideBalance {
  guide: string;
  avatar?: string;
  school: string;
  completedNetCents: number;
  paidOutCents: number;
  balanceCents: number;
}

export interface Payout {
  id: string;
  guide: string;
  amountCents: number;
  method: 'BANK_TRANSFER' | 'PAYPAL' | 'CHECK';
  reference: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────── Refunds
export interface Refund {
  id: string;
  bookingId: string;
  buyer: string;
  guide: string;
  amountCents: number;
  originalCents: number;
  type: 'FULL' | 'PARTIAL';
  reason: string;
  status: 'COMPLETED' | 'PROCESSING';
  createdAt: string;
}

// ─────────────────────────────────────────────────────────── Reviews
export interface Review {
  id: string;
  bookingId: string;
  bookingNo: number | null; // human-friendly booking reference (shown as "B-{n}")
  buyer: string; // guest name
  guide: string; // guide name
  school: string;
  rating: number;
  text: string;
  hidden: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────────────── Contact us
export interface ContactMessage {
  id: string;
  contactNo: number; // sequential display id → "C-1", "C-2", … by submission order
  name: string;
  email: string;
  topic: string;
  message: string;
  status: string; // new | read
  createdAt: string;
}

// ─────────────────────────────────────────────────────────── CMS
export interface CmsBlock {
  id: string;
  key: string;
  type: 'HOMEPAGE_SECTION' | 'FAQ' | 'PAGE' | 'TESTIMONIAL';
  title: string;
  published: boolean;
  updatedAt: string;
  content: string;
}

// ─────────────────────────────────────────────────────────── Notification templates
export interface NotificationTemplate {
  id: string;
  key: string;
  channel: 'EMAIL' | 'PUSH';
  subject: string;
  body: string;
  updatedAt: string;
  sampleVars: Record<string, string>; // realistic values for the live preview
}

// ─────────────────────────────────────────────────────────── Push campaigns
export interface PushCampaign {
  id: string;
  title: string;
  segment: 'ALL' | 'BUYERS' | 'GUIDES';
  body: string;
  status: 'SENT' | 'SCHEDULED' | 'DRAFT';
  scheduledAt?: string;
  sentAt?: string;
  reach: number;
}

// ─────────────────────────────────────────────────────────── App config
export interface AppConfig {
  minSupportedVersion: string;
  forceUpdateMessage: string;
  maintenanceMode: boolean;
  maintenanceBanner: string;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  featureFlags: { key: string; label: string; enabled: boolean; desc: string }[];
}

// ─────────────────────────────────────────────────────────── Admins & audit
export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INVITED' | 'DISABLED';
  lastActiveAt: string;
  avatar?: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  ip: string;
  createdAt: string;
}
