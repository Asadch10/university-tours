/**
 * Tour-type naming — single source of truth for the website.
 *
 * ⚠️ There are TWO different things here and they must not be conflated:
 *
 *  1. STORED VALUES (`TOUR_TYPE_VALUES`) — the exact strings persisted inside
 *     `profileJson.guideListing.tourTypes` for every existing listing. They are also the
 *     wire values the admin console filters by, and `mapServices()` in lib/guides.ts maps
 *     them back to `ServiceType` enums. **Changing them silently drops services from every
 *     listing already in the database** and breaks the admin tour-type filter, so they are
 *     frozen. A rename would need a backfill migration.
 *
 *  2. DISPLAY LABELS (`TOUR_TYPE_LABEL` / `SERVICE_LABEL`) — what a human reads. Safe to
 *     change any time; that is what the client-facing rename below does.
 */

import type { ServiceType } from '@/lib/availability';

/** Persisted listing values. DO NOT EDIT — see the note above. */
export const TOUR_TYPE_VALUES = ['Campus tour', 'Video chat', 'Consultancy'] as const;
export type TourTypeValue = (typeof TOUR_TYPE_VALUES)[number];

/** Stored value → display label. */
export const TOUR_TYPE_LABEL: Record<TourTypeValue, string> = {
  'Campus tour': 'In-person campus tour',
  'Video chat': 'Virtual video chat',
  Consultancy: 'Professional consultation',
};

/** Service enum → display label. */
export const SERVICE_LABEL: Record<ServiceType, string> = {
  CAMPUS_TOUR: 'In-person campus tour',
  VIDEO_CONSULTATION: 'Virtual video chat',
  CONSULTATION: 'Professional consultation',
};

/** Checkbox / select options: stable `value`, renamed `label`. */
export const TOUR_TYPE_OPTIONS: { value: TourTypeValue; label: string }[] = TOUR_TYPE_VALUES.map(
  (value) => ({ value, label: TOUR_TYPE_LABEL[value] }),
);

/** Display label for a stored value, falling back to the raw string. */
export function tourTypeLabel(value: string): string {
  // Widened on purpose: stored data may contain a value this build does not know about.
  return (TOUR_TYPE_LABEL as Record<string, string | undefined>)[value] ?? value;
}
