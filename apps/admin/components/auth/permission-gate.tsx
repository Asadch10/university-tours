'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import type { Permission } from '@/lib/rbac';
import { ForbiddenState } from '@/components/ui/states';

/**
 * Conditionally render children if the current role holds `perm` (or any of `anyOf`).
 * Use this to hide action buttons that the role cannot perform — the second enforcement
 * layer (the action handler itself) should still re-check.
 */
export function Can({
  perm,
  anyOf,
  fallback = null,
  children,
}: {
  perm?: Permission;
  anyOf?: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can, canAny } = useAuth();
  const allowed = perm ? can(perm) : anyOf ? canAny(anyOf) : true;
  return <>{allowed ? children : fallback}</>;
}

/**
 * Page-level guard. Renders a Forbidden state if the role lacks the required permission(s).
 * Every console page wraps its content in this so permissions are enforced at the page level,
 * not just in navigation.
 */
export function RequirePermission({
  anyOf,
  children,
}: {
  anyOf: Permission[];
  children: ReactNode;
}) {
  const { canAny, ready, user } = useAuth();
  if (!ready || !user) return null;
  if (!canAny(anyOf)) return <ForbiddenState />;
  return <>{children}</>;
}
