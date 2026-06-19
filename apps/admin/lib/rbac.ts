/**
 * Single-admin mode — one Admin account, full access to everything.
 * The Permission type is kept for type-safety on nav/gate props but all checks return true.
 */

export type Role = 'ADMIN';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
};

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

export function roleHas(_role: Role, _perm: Permission): boolean {
  return true;
}

export function roleHasAny(_role: Role, _perms: Permission[]): boolean {
  return true;
}
