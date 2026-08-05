/**
 * Tour-type naming — single source of truth for the mobile app.
 * Mirrors apps/website/lib/tour-types.ts and apps/admin/lib/tour-types.ts.
 *
 * ⚠️ STORED VALUES vs DISPLAY LABELS — do not conflate them.
 *
 * `'Campus tour' | 'Video chat' | 'Consultancy'` are the exact strings persisted in a
 * guide's `profileJson.guideListing.tourTypes`, and what `mapServices()` in api/guides.ts
 * parses back into `GuideService` enums. Renaming them would silently drop services from
 * every listing already in the database, so they are frozen — a rename would need a
 * backfill migration across all three clients at once.
 *
 * Only the labels below change.
 */

export type ServiceType = 'CAMPUS_TOUR' | 'VIDEO_CONSULTATION' | 'CONSULTATION';

/** Persisted listing values. DO NOT EDIT — see the note above. */
export const TOUR_TYPE_VALUES = ['Campus tour', 'Video chat', 'Consultancy'] as const;

/** Full display label — booking flow, tour detail, headings. */
export const SERVICE_LABEL: Record<ServiceType, string> = {
  CAMPUS_TOUR: 'In-person campus tour',
  VIDEO_CONSULTATION: 'Virtual video chat',
  CONSULTATION: 'Professional consultation',
};

/** Compact label for chips and cards, where the full name would wrap. */
export const SERVICE_LABEL_SHORT: Record<ServiceType, string> = {
  CAMPUS_TOUR: 'In-person',
  VIDEO_CONSULTATION: 'Virtual',
  CONSULTATION: 'Consultation',
};

/** Short description shown under each option in the booking flow. */
export const SERVICE_DESC: Record<ServiceType, string> = {
  CAMPUS_TOUR: 'Explore campus on a personalized in-person tour.',
  VIDEO_CONSULTATION: 'Connect live with a current student from anywhere.',
  CONSULTATION: 'A focused 1-on-1 advising session.',
};
