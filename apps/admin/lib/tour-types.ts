/**
 * Tour-type naming — single source of truth for the admin console.
 * Mirrors apps/website/lib/tour-types.ts.
 *
 * ⚠️ STORED VALUES vs DISPLAY LABELS.
 *
 * `'Campus tour' | 'Video chat' | 'Consultancy'` are the exact strings persisted in every
 * listing's `profileJson.guideListing.tourTypes`, and the values this console sends as the
 * `service` filter (matched by `admin.service.ts` with `tourTypes.includes(service)`).
 * They are frozen — renaming them would break the filter and silently drop services from
 * listings already in the database.
 *
 * Only the labels below change.
 */

/** Persisted listing values. DO NOT EDIT. */
export const TOUR_TYPE_VALUES = ['Campus tour', 'Video chat', 'Consultancy'] as const;
export type TourTypeValue = (typeof TOUR_TYPE_VALUES)[number];

/** Stored value → full display label. */
export const TOUR_TYPE_LABEL: Record<TourTypeValue, string> = {
  'Campus tour': 'In-person campus tour',
  'Video chat': 'Virtual video chat',
  Consultancy: 'Professional consultation',
};

/** Compact label for table chips, where the full name would wrap. */
export const TOUR_TYPE_SHORT: Record<TourTypeValue, string> = {
  'Campus tour': 'In-person',
  'Video chat': 'Virtual',
  Consultancy: 'Consultation',
};

/** Booking service enum → full display label. */
export const SERVICE_LABEL: Record<'CAMPUS_TOUR' | 'VIDEO_CONSULTATION' | 'CONSULTATION', string> = {
  CAMPUS_TOUR: 'In-person campus tour',
  VIDEO_CONSULTATION: 'Virtual video chat',
  CONSULTATION: 'Professional consultation',
};

export function tourTypeLabel(value: string): string {
  // Widened on purpose: stored data may contain a value this build does not know about.
  return (TOUR_TYPE_LABEL as Record<string, string | undefined>)[value] ?? value;
}
