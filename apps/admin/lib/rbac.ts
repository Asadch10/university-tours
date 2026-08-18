/**
 * Single-admin mode — one Admin account, full access to everything.
 * The Permission type is kept for type-safety on nav/gate props but all checks return true.
 */

export type Role = 'ADMIN';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
};

// Re-exported from @ucpt/types so the console, the backend token and the seed all
// read from one list. It used to be redeclared here and drifted out of sync with
// the seed (`contact.view` existed here but was never granted).
import type { Permission } from '@ucpt/types';

export type { Permission };
export { ADMIN_PERMISSIONS } from '@ucpt/types';

export function roleHas(_role: Role, _perm: Permission): boolean {
  return true;
}

export function roleHasAny(_role: Role, _perms: Permission[]): boolean {
  return true;
}
