// Guide availability — set during "become a guide", stored in the listing JSON,
// and read by the guest booking widget so guests can only pick dates/times the
// guide actually offers.
//
// Model: availability is PER TOUR TYPE. Each tour type the guide offers has its
// own set of dates and a single set of times shared across all of those dates.

export type ServiceType = 'CAMPUS_TOUR' | 'VIDEO_CONSULTATION' | 'CONSULTATION';

export const SERVICE_TYPES: ServiceType[] = ['CAMPUS_TOUR', 'VIDEO_CONSULTATION', 'CONSULTATION'];

/** Tour-type label (as shown in the form) ↔ canonical service type. */
export const TOUR_TYPE_LABELS: Record<ServiceType, string> = {
  CAMPUS_TOUR: 'Campus tour',
  VIDEO_CONSULTATION: 'Video chat',
  CONSULTATION: 'Consultancy',
};

export function labelToService(label: string): ServiceType | null {
  const entry = SERVICE_TYPES.find((s) => TOUR_TYPE_LABELS[s] === label);
  return entry ?? null;
}

/** Dates + the (shared) times a guide offers for one tour type. */
export interface TypeAvailability {
  /** Local calendar dates, 'YYYY-MM-DD'. */
  dates: string[];
  /** Bookable start times (24-hour 'HH:MM'), shared across every date above. */
  times: string[];
}

/** Availability keyed by tour type. A missing key means that type isn't offered. */
export type Availability = Partial<Record<ServiceType, TypeAvailability>>;

/**
 * Bookable start times in 24-hour format, shared by the guide picker and the
 * guest booking widget so the labels always match (08:00 … 18:30).
 */
export function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h <= 18; h++) {
    const hh = String(h).padStart(2, '0');
    slots.push(`${hh}:00`, `${hh}:30`);
  }
  return slots;
}

export const TIME_SLOTS = buildTimeSlots();

/** Sort time labels by their canonical slot order (earliest first). */
export function sortTimes(times: string[]): string[] {
  return [...times].sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b));
}

/** Build a 'YYYY-MM-DD' key from calendar parts (month is 0-indexed, like Date). */
export function ymd(year: number, month0: number, day: number): string {
  return `${year}-${String(month0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Human label for a 'YYYY-MM-DD' date, e.g. "Wed, Jul 15, 2026". */
export function labelForDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const isDateStr = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Defensively normalize availability coming from the listing JSON. */
export function parseAvailability(value: unknown): Availability {
  const out: Availability = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
  const obj = value as Record<string, unknown>;
  for (const service of SERVICE_TYPES) {
    const entry = obj[service];
    if (!entry || typeof entry !== 'object') continue;
    const rawDates = (entry as { dates?: unknown }).dates;
    const rawTimes = (entry as { times?: unknown }).times;
    const dates = Array.isArray(rawDates)
      ? [...new Set(rawDates.filter(isDateStr))].sort()
      : [];
    const times = Array.isArray(rawTimes)
      ? sortTimes([...new Set(rawTimes.filter((t): t is string => typeof t === 'string' && !!t.trim()))])
      : [];
    if (dates.length && times.length) out[service] = { dates, times };
  }
  return out;
}

/** True if the guide has offered any bookable date/time for any tour type. */
export function hasAnyAvailability(a: Availability): boolean {
  return SERVICE_TYPES.some((s) => !!a[s]);
}

/** Keep only the given services that have both dates and times (sorted, deduped). */
export function cleanAvailability(a: Availability, services: ServiceType[]): Availability {
  const out: Availability = {};
  for (const s of services) {
    const e = a[s];
    if (e && e.dates.length && e.times.length) {
      out[s] = { dates: [...new Set(e.dates)].sort(), times: sortTimes([...new Set(e.times)]) };
    }
  }
  return out;
}

/** Services that still need a date and/or time before the form can be submitted. */
export function missingAvailability(a: Availability, services: ServiceType[]): ServiceType[] {
  return services.filter((s) => !a[s] || !a[s]!.dates.length || !a[s]!.times.length);
}
