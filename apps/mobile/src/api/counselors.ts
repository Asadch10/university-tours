/**
 * College counselors — the second marketplace, alongside student guides.
 *
 * The backend exposes counselors as the exact counterpart of community guides
 * (`/search/counselors` mirrors `/search/community-guides`), and a booking made
 * against one is tagged kind=COUNSELOR. Kept in its own module rather than folded
 * into guides.ts so the two marketplaces can diverge without entangling each other.
 *
 * Standalone by design — no @ucpt/* imports (see src/api/client.ts).
 */
import { api, API_BASE_URL } from './client';

/** API origin (trailing slash stripped) used to absolutize relative "/uploads/…" paths. */
const API_BASE = API_BASE_URL.replace(/\/$/, '');

export interface CounselorReviewDto {
  name: string;
  rating: number;
  text: string | null;
  date: string; // ISO createdAt
}

/**
 * A published counselor. `listing` is the free-form application payload the
 * website's counselor form saved (answers keyed by the questionnaire's fieldKey),
 * so it is deliberately untyped — read it through the helpers below rather than
 * indexing it ad hoc at call sites.
 */
export interface CounselorDto {
  id: string;
  name: string;
  rating: number | null;
  reviews: number;
  listing: Record<string, unknown>;
  reviewList?: CounselorReviewDto[];
}

/** Absolutize a "/uploads/…" path the API returns relative. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_BASE}${path}`;
}

const str = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? v.trim() : null;

/** Headline / tagline shown under the counselor's name. */
export function counselorHeadline(c: CounselorDto): string {
  const a = (c.listing?.answers ?? {}) as Record<string, unknown>;
  return str(a.headline) ?? str(c.listing?.headline) ?? 'College counselor';
}

/** Firm or practice name, when the counselor gave one. */
export function counselorOrganization(c: CounselorDto): string | null {
  const a = (c.listing?.answers ?? {}) as Record<string, unknown>;
  return str(a.organization) ?? str(c.listing?.organization);
}

/** Specialties, always an array (the form stores them as one). */
export function counselorSpecialties(c: CounselorDto): string[] {
  const a = (c.listing?.answers ?? {}) as Record<string, unknown>;
  const raw = Array.isArray(a.specialties) ? a.specialties : c.listing?.specialties;
  return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string') : [];
}

/** First uploaded photo, absolutized — used as the avatar on cards. */
export function counselorPhoto(c: CounselorDto): string | null {
  const photos = c.listing?.photos;
  return Array.isArray(photos) && typeof photos[0] === 'string' ? mediaUrl(photos[0]) : null;
}

export const counselorsApi = {
  /** Approved, published counselors. Public — no auth needed. */
  list: () => api.request<{ data: CounselorDto[] }>('GET', '/search/counselors'),
  detail: (id: string) => api.request<CounselorDto>('GET', `/search/counselors/${id}`),
};

/**
 * The counselor application/listing owned by the signed-in user.
 *
 * `save` accepts the same free-form payload the website form posts and supports
 * drafts (`status: 'draft'`), so a partially completed application survives.
 * Publishing it promotes the account to SELLER, exactly as the guide flow does.
 */
export const myCounselorListingApi = {
  save: (listing: Record<string, unknown>) =>
    api.request<{ id: string; profileJson: Record<string, unknown> | null }>(
      'POST',
      '/users/me/counselor-listing',
      listing,
    ),
  remove: () =>
    api.request<{ ok: true }>('DELETE', '/users/me/counselor-listing'),
};

/** Guide equivalent of the above, so both marketplaces are reachable from mobile. */
export const myGuideListingApi = {
  save: (listing: Record<string, unknown>) =>
    api.request<{ id: string; profileJson: Record<string, unknown> | null }>(
      'POST',
      '/users/me/guide-listing',
      listing,
    ),
  remove: () => api.request<{ ok: true }>('DELETE', '/users/me/guide-listing'),
};
