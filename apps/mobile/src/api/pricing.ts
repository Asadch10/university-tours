// Admin-managed tour pricing — mirrors the website's lib/pricing.ts.
//
// The admin console sets a suggested 1-hour and 2-hour price per tour type on
// Finance → Price & commission. This is the single source of truth the booking flow
// quotes from, so a price change in the console is live in the app immediately.
//
// The backend is authoritative: `POST /bookings/guide` derives the charged amount from
// the same values and ignores whatever `priceCents` the client sends. What is quoted
// here is therefore a preview — accurate, but never the thing that sets the charge.
import { useEffect, useState } from 'react';
import { api } from './client';
import type { ServiceType } from '../tour-types';

export interface PriceBound {
  serviceType: ServiceType;
  minCents: number;
  maxCents: number;
  suggested1hCents: number;
  suggested2hCents: number;
  /** False when these are backend defaults that no admin has saved yet. */
  configured: boolean;
}

export type PriceBounds = Record<ServiceType, PriceBound>;

/**
 * Used until the network responds (and if it fails), so the booking bar always shows a
 * plausible figure rather than $0. Mirrors the backend defaults in admin.service.ts.
 */
const FALLBACK: Record<ServiceType, { h1: number; h2: number }> = {
  CAMPUS_TOUR: { h1: 8000, h2: 16000 },
  VIDEO_CONSULTATION: { h1: 5000, h2: 10000 },
  CONSULTATION: { h1: 20000, h2: 40000 },
};

export async function fetchPriceBounds(): Promise<PriceBounds | null> {
  try {
    const rows = await api.request<PriceBound[]>('GET', '/config/price-bounds');
    const map = {} as PriceBounds;
    for (const r of rows) map[r.serviceType] = r;
    return map;
  } catch {
    return null;
  }
}

/** Fetches once on mount; `null` while loading or if the request failed. */
export function usePriceBounds(): { bounds: PriceBounds | null; loading: boolean } {
  const [bounds, setBounds] = useState<PriceBounds | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPriceBounds().then((b) => {
      if (cancelled) return;
      setBounds(b);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { bounds, loading };
}

/**
 * Price for a tour type at a given duration, in cents.
 *
 * `minutes` maps to the two admin-configured tiers: up to 60 uses the 1-hour price,
 * anything longer the 2-hour price. Beyond 2 hours it scales from the 2-hour rate so a
 * longer booking is never cheaper than a shorter one. Kept in step with `priceFor()` in
 * apps/website/lib/pricing.ts and `priceForBooking()` in the backend.
 */
export function priceFor(
  bounds: PriceBounds | null,
  serviceType: ServiceType,
  minutes: number,
): number {
  const b = bounds?.[serviceType];
  const h1 = b?.suggested1hCents ?? FALLBACK[serviceType].h1;
  const h2 = b?.suggested2hCents ?? FALLBACK[serviceType].h2;

  if (minutes <= 60) return h1;
  if (minutes <= 120) return h2;
  return Math.round((h2 * minutes) / 120);
}
