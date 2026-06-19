'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import type { Permission } from '@/lib/rbac';

/** Single-admin mode: always renders children. Props kept for type-compat. */
export function Can({
  fallback = null,
  children,
}: {
  perm?: Permission;
  anyOf?: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  void fallback;
  return <>{children}</>;
}

/** Single-admin mode: always renders children once session is ready. */
export function RequirePermission({
  children,
}: {
  anyOf?: Permission[];
  children: ReactNode;
}) {
  const { ready, user } = useAuth();
  if (!ready || !user) return null;
  return <>{children}</>;
}
