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
