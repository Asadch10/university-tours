// Shared domain literals and DTO shapes used across API, web, and mobile.
// Kept dependency-free so any client can import them.

export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';
export type AdminRoleName = 'SUPER_ADMIN' | 'MANAGER' | 'SUPPORT';
export type ServiceType = 'CAMPUS_TOUR' | 'VIDEO_CONSULTATION';
export type BookingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'COMPLETED';
export type ApplicationStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED';
export type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'DISABLED';

// --- API envelope conventions (Part I §6) ---
export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}

export interface Paginated<T> {
  data: T[];
  nextCursor?: string | null;
  total?: number;
}

// --- Auth ---
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}

// --- App config / remote control (consumed by mobile on launch) ---
export interface AppConfigDto {
  minSupportedVersion: string;
  forceUpdateMessage: string | null;
  maintenanceBanner: string | null;
  featureFlags: Record<string, boolean>;
}

// --- Money helpers ---
/** All monetary values are integer cents (USD in v1). */
export type Cents = number;

export interface EarningsSummary {
  grossCents: Cents;
  commissionCents: Cents;
  netCents: Cents;
  balanceCents: Cents;
}

// --- Admin access model (single-admin mode) ------------------------------------
/**
 * The product ships ONE kind of admin: a single account with full access to the
 * whole console. There are deliberately no Manager/Support tiers.
 *
 * The permission vocabulary below is kept because the console's nav and route
 * guards are typed against it, and because it documents what each area of the
 * console does — but every admin holds every permission. Nothing filters on it.
 *
 * This is the ONLY place the list is defined. It used to be duplicated between
 * the seed and the admin app, which silently drifted (the seed was missing
 * `contact.view`, so live tokens carried 20 of 21 permissions).
 */
export const ADMIN_PERMISSIONS = [
  'dashboard.view',
  'reports.view',
  'applications.decide',
  'questionnaires.manage',
  'commission.set',
  'transactions.view',
  'payouts.record',
  'refunds.issue',
  'users.manage',
  'listings.moderate',
  'bookings.view',
  'bookings.forcecancel',
  'reviews.moderate',
  'universities.manage',
  'cms.edit',
  'contact.view',
  'appconfig.manage',
  'campaigns.send',
  'templates.edit',
  'admins.manage',
  'audit.view',
] as const;

export type Permission = (typeof ADMIN_PERMISSIONS)[number];

/** The one admin role that exists. Stored on `User.adminRoleName`. */
export const ADMIN_ROLE_NAME = 'SUPER_ADMIN' as const;
export type AdminRoleNameValue = typeof ADMIN_ROLE_NAME;
