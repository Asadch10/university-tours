/**
 * Role-based access control — mirrors Part II §6 of the Technical Documentation.
 *
 * Three roles; admin accounts are created only by a Super Admin. The UI hides unavailable
 * actions (navigation, pages, components) AND every action re-checks its permission — the
 * production backend re-validates server-side, so the client gate is the first of two layers.
 *
 * Permissions are key-based, so role→permission mappings can change without touching UI code.
 */

export type Role = 'SUPER_ADMIN' | 'MANAGER' | 'SUPPORT';

export const ROLES: { value: Role; label: string; blurb: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', blurb: 'Full platform control, incl. money & admins' },
  { value: 'MANAGER', label: 'Manager', blurb: 'Day-to-day operations & moderation' },
  { value: 'SUPPORT', label: 'Support', blurb: 'Read-heavy support & light moderation' },
];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Manager',
  SUPPORT: 'Support',
};

/** Every capability the console can gate on. */
export type Permission =
  | 'dashboard.view'
  | 'reports.view'
  | 'applications.decide'
  | 'questionnaires.manage'
  | 'commission.set'
  | 'transactions.view'
  | 'payouts.record'
  | 'refunds.issue'
  | 'users.manage'
  | 'listings.moderate'
  | 'bookings.view'
  | 'bookings.forcecancel'
  | 'reviews.moderate'
  | 'universities.manage'
  | 'cms.edit'
  | 'appconfig.manage'
  | 'campaigns.send'
  | 'templates.edit'
  | 'admins.manage'
  | 'audit.view';

const SUPPORT_PERMS: Permission[] = [
  'dashboard.view',
  'reports.view',
  'users.manage',
  'listings.moderate',
  'bookings.view',
  'reviews.moderate',
];

const MANAGER_PERMS: Permission[] = [
  ...SUPPORT_PERMS,
  'applications.decide',
  'questionnaires.manage',
  'transactions.view',
  'payouts.record',
  'refunds.issue',
  'bookings.forcecancel',
  'universities.manage',
  'cms.edit',
  'appconfig.manage',
  'campaigns.send',
  'templates.edit',
  'audit.view',
];

const SUPER_PERMS: Permission[] = [
  ...MANAGER_PERMS,
  'commission.set',
  'admins.manage',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPPORT: SUPPORT_PERMS,
  MANAGER: MANAGER_PERMS,
  SUPER_ADMIN: SUPER_PERMS,
};

export function roleHas(role: Role, perm: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(perm);
}

/** True if the role has ANY of the listed permissions (used for module visibility). */
export function roleHasAny(role: Role, perms: Permission[]): boolean {
  return perms.some((p) => roleHas(role, p));
}
