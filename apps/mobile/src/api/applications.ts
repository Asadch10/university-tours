/**
 * Become-a-guide / become-a-counselor client.
 *
 * Mirrors the website's `questionnaireApi` + `accountApi.saveGuideListing` /
 * `saveCounselorListing` / `uploadPhoto` (apps/website/lib/client-api.ts) so both clients
 * write the SAME shape into `profileJson.guideListing` / `profileJson.counselorListing`.
 * An application started on the website therefore resumes in the app, and vice versa.
 *
 * This app is standalone — no @ucpt/* imports — so the contract is redeclared here.
 */
import { api } from './client';
import type { Role } from './auth';
import {
  parseAvailability,
  sortTimes,
  type Availability,
  type GuideService,
} from './guides';
import { labelToService } from '../tour-types';

export { parseAvailability, type Availability };

/** Which application form: the two questionnaires are managed separately by the admin. */
export type ApplicantKind = 'GUIDE' | 'COUNSELOR';

/** Listing lifecycle, as written by the backend. */
export type ListingStatus = 'draft' | 'under_review' | 'published' | 'suspended' | 'rejected';

/* ─── Admin-managed questionnaire ─────────────────────────────────────────── */

export type QuestionType = 'TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'FILE';

export interface QuestionnaireQuestion {
  id: string;
  /** Stable field key (e.g. "hometown"); answers are stored under it when present. */
  key: string | null;
  type: QuestionType;
  label: string;
  required: boolean;
  options: string[];
}

export interface ActiveQuestionnaire {
  questions: QuestionnaireQuestion[];
  /** How many photos the guide flow demands before it will publish. */
  requiredPhotos: number;
}

export const questionnaireApi = {
  /**
   * The live questionnaire for one applicant kind. Public (no auth) — the same
   * endpoint the website reads, with `?kind=COUNSELOR` selecting the counselor form.
   */
  active: (kind: ApplicantKind = 'GUIDE') =>
    api.request<ActiveQuestionnaire>('GET', `/config/questionnaire?kind=${kind}`),
};

/* ─── Listing save / delete ───────────────────────────────────────────────── */

/** What every listing write returns: the refreshed user, whose role may have changed. */
export interface ListingSaveResult {
  id: string;
  role: Role | null;
  profileJson: Record<string, unknown> | null;
}

export const listingApi = {
  /**
   * Save the guide listing. `status: 'draft'` keeps it as a resumable draft; anything
   * else (the final publish) submits it for review and promotes the account to SELLER.
   * Each call MERGES onto the saved draft, so a step only has to send its own fields.
   */
  saveGuide: (listing: Record<string, unknown>) =>
    api.request<ListingSaveResult>('POST', '/users/me/guide-listing', listing),
  deleteGuide: () => api.request<ListingSaveResult>('DELETE', '/users/me/guide-listing'),

  /** Same mechanics, written to `profileJson.counselorListing` — the two coexist. */
  saveCounselor: (listing: Record<string, unknown>) =>
    api.request<ListingSaveResult>('POST', '/users/me/counselor-listing', listing),
  deleteCounselor: () => api.request<ListingSaveResult>('DELETE', '/users/me/counselor-listing'),
};

/* ─── Uploads ─────────────────────────────────────────────────────────────── */

/**
 * Fallback MIME type, guessed from the file name, for callers that don't supply one.
 * Only the types the backend's upload filter accepts are ever produced — an unknown
 * extension falls back to JPEG rather than to something that would be rejected.
 */
function mimeFor(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export const uploadApi = {
  /**
   * Upload one local file and return its public URL.
   *
   * The listing stores URLs, never the bytes — so a photo survives reinstalling the app
   * and is what the admin reviews and what Browse renders.
   */
  async file(uri: string, name?: string, type?: string): Promise<string> {
    const filename = name ?? uri.split('/').pop() ?? 'upload.jpg';
    const res = await api.upload<{ url: string; filename: string }>('/users/me/uploads', {
      uri,
      name: filename,
      type: type ?? mimeFor(filename),
    });
    return res.url;
  },
};

/* ─── Availability write-helpers ──────────────────────────────────────────── */
// Reading is already handled by parseAvailability in api/guides.ts; these are the
// counterparts the application forms need when WRITING availability back.

/** Build a 'YYYY-MM-DD' key from calendar parts (month is 0-indexed, like Date). */
export function ymd(year: number, month0: number, day: number): string {
  return `${year}-${String(month0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Human label for a 'YYYY-MM-DD' date, e.g. "Wed, Jul 15". */
export function labelForDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** 24-hour 'HH:MM' → a friendly '8:00 AM'. */
export function labelForTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h)) return time;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
}

/** Keep only the given services that have BOTH dates and times (sorted, deduped). */
export function cleanAvailability(a: Availability, services: GuideService[]): Availability {
  const out: Availability = {};
  for (const s of services) {
    const e = a[s];
    if (e && e.dates.length && e.times.length) {
      out[s] = { dates: [...new Set(e.dates)].sort(), times: sortTimes([...new Set(e.times)]) };
    }
  }
  return out;
}

/** Services still missing a date and/or a time — the form can't be submitted until empty. */
export function missingAvailability(a: Availability, services: GuideService[]): GuideService[] {
  return services.filter((s) => !a[s] || !a[s]!.dates.length || !a[s]!.times.length);
}

/** Stored tour-type values → the service enums availability is keyed by. */
export function servicesFor(tourTypes: string[]): GuideService[] {
  return tourTypes.map(labelToService).filter((s): s is GuideService => s !== null);
}
