'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Ctx = { crumb: string | null; setCrumb: (c: string | null) => void };

const BreadcrumbCtx = createContext<Ctx>({ crumb: null, setCrumb: () => {} });

/** Holds the current detail-page crumb (e.g. "App-1") so the topbar can show it. */
export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [crumb, setCrumb] = useState<string | null>(null);
  return <BreadcrumbCtx.Provider value={{ crumb, setCrumb }}>{children}</BreadcrumbCtx.Provider>;
}

export function useBreadcrumb() {
  return useContext(BreadcrumbCtx);
}

/** Set the trailing breadcrumb for the current page; clears automatically on unmount. */
export function usePageBreadcrumb(label: string | null) {
  const { setCrumb } = useBreadcrumb();
  useEffect(() => {
    setCrumb(label);
    return () => setCrumb(null);
  }, [label, setCrumb]);
}
