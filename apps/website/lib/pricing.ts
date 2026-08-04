'use client';

/**
 * Admin-managed tour pricing, read from the public catalog endpoint
 * (`GET /api/v1/config/price-bounds`).
 *
 * The admin console sets a suggested 1-hour and 2-hour price per tour type on
 * Finance → Price & commission. This is the single source of truth the guest booking
 * widget quotes from, so a price change in the console is live on the site immediately.
 */

import { useEffect, useState } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export type PricedServiceType = 'CAMPUS_TOUR' | 'VIDEO_CONSULTATION' | 'CONSULTATION';

export interface PriceBound {
  serviceType: PricedServiceType;
  minCents: number;
  maxCents: number;
  suggested1hCents: number;
  suggested2hCents: number;
}

/**
 * Used only until the network responds (and if it fails), so the widget always shows a
 * plausible figure rather than $0. Mirrors the backend defaults in admin.service.ts.
 */
const FALLBACK: Record<PricedServiceType, { suggested1hCents: number; suggested2hCents: number }> = {
  CAMPUS_TOUR: { suggested1hCents: 8000, suggested2hCents: 16000 },
  VIDEO_CONSULTATION: { suggested1hCents: 5000, suggested2hCents: 10000 },
  CONSULTATION: { suggested1hCents: 20000, suggested2hCents: 40000 },
};

export function usePriceBounds(): {
  bounds: Record<PricedServiceType, PriceBound> | null;
  loading: boolean;
} {
  const [bounds, setBounds] = useState<Record<PricedServiceType, PriceBound> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/v1/config/price-bounds`)
      .then((res) => (res.ok ? (res.json() as Promise<PriceBound[]>) : Promise.reject(new Error(String(res.status)))))
      .then((rows) => {
        if (cancelled) return;
        const map = {} as Record<PricedServiceType, PriceBound>;
        for (const r of rows) map[r.serviceType] = r;
        setBounds(map);
      })
      .catch(() => {
        // Leave `bounds` null — priceFor() falls back so the widget still quotes a price.
        if (!cancelled) setBounds(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { bounds, loading: bounds === null };
}

/**
 * Price for a tour type at a given duration, in cents.
 *
 * `minutes` maps to the two admin-configured tiers: anything up to 60 uses the 1-hour
 * price, anything longer uses the 2-hour price. Durations beyond 2 hours scale from the
 * 2-hour rate so a longer booking is never cheaper than a shorter one.
 */
export function priceFor(
  bounds: Record<PricedServiceType, PriceBound> | null,
  serviceType: PricedServiceType,
  minutes: number,
): number {
  const b = bounds?.[serviceType];
  const oneHour = b?.suggested1hCents ?? FALLBACK[serviceType].suggested1hCents;
  const twoHour = b?.suggested2hCents ?? FALLBACK[serviceType].suggested2hCents;

  if (minutes <= 60) return oneHour;
  if (minutes <= 120) return twoHour;
  return Math.round((twoHour * minutes) / 120);
}
