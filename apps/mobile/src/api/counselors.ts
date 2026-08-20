/**
 * College counselors — the second marketplace, alongside student guides.
 *
 * The API returns the SAME row shape as community guides, because both are a
 * published listing living inside `profileJson`. What differs is the contents of
 * `listing`: a counselor's answers are keyed by the counselor questionnaire's
 * stable fieldKeys (headline, organization, specialties, …), and the photo is a
 * single `listing.photo` string rather than the guide's `photos` array.
 *
 * Mirrors the website's lib/counselors.ts field-for-field so the two clients can't
 * disagree about what a counselor is. Standalone by design — no @ucpt/* imports.
 */
import { api } from './client';
import {
  absPhoto,
  mapServices,
  parseAvailability,
  type Availability,
  type CommunityGuideDto,
  type GuideService,
} from './guides';

/** Re-exported so screens can talk about counselors without importing guides. */
export type { CommunityGuideDto as CounselorDto };

export interface CounselorReview {
  name: string;
  rating: number;
  text: string | null;
  date: string;
}

/** Shape the Browse counselors UI renders. */
export interface Counselor {
  id: string;
  name: string;
  photo: string | null;
  headline: string;
  organization: string;
  credentials: string;
  yearsExperience: string;
  specialties: string[];
  bio: string;
  website: string;
  rating: number | null;
  reviews: number;
  /** Services + when, in the same shape a guide uses, so booking is identical. */
  services: GuideService[];
  availability: Availability;
  reviewList: CounselorReview[];
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [];

/** Answers are stored under each question's fieldKey when it defines one. */
function answersOf(listing: Record<string, unknown>): Record<string, unknown> {
  const a = listing.answers;
  return a && typeof a === 'object' ? (a as Record<string, unknown>) : {};
}

export function counselorFromDto(dto: CommunityGuideDto): Counselor {
  const listing = (dto.listing ?? {}) as Record<string, unknown>;
  const a = answersOf(listing);
  // Counselors save ONE photo (`listing.photo`); guides save a `photos` array.
  // Fall back to the array so a listing authored either way still renders.
  const photo = absPhoto(listing.photo) ?? absPhoto((listing.photos as unknown[] | undefined)?.[0]);

  return {
    id: dto.id,
    name: dto.name || 'College counselor',
    photo,
    headline: str(a.headline) || 'College counselor',
    organization: str(a.organization),
    credentials: str(a.credentials),
    yearsExperience: str(a.yearsExperience),
    specialties: strArr(a.specialties),
    bio: str(a.bio),
    website: str(a.website),
    rating: dto.rating,
    reviews: dto.reviews ?? 0,
    services: mapServices(listing.tourTypes),
    availability: parseAvailability(listing.availability),
    reviewList: Array.isArray(dto.reviewList) ? (dto.reviewList as CounselorReview[]) : [],
  };
}

/** "www.example.com" → "https://www.example.com" so Linking can open it. */
export function counselorWebsiteUrl(website: string): string | null {
  const w = website.trim();
  if (!w) return null;
  return /^https?:\/\//i.test(w) ? w : `https://${w}`;
}

export const counselorsApi = {
  /** Approved, published counselors. Public — no auth needed. */
  list: () => api.request<{ data: CommunityGuideDto[] }>('GET', '/search/counselors'),
  detail: (id: string) => api.request<CommunityGuideDto>('GET', `/search/counselors/${id}`),
};

/**
 * The signed-in user's own counselor application/listing.
 *
 * Accepts the same free-form payload the website form posts and supports drafts
 * (`status: 'draft'`), so a partially completed application survives. Publishing
 * promotes the account to SELLER, exactly as the guide flow does.
 */
export const myCounselorListingApi = {
  save: (listing: Record<string, unknown>) =>
    api.request<{ id: string; profileJson: Record<string, unknown> | null }>(
      'POST',
      '/users/me/counselor-listing',
      listing,
    ),
  remove: () => api.request<{ ok: true }>('DELETE', '/users/me/counselor-listing'),
};

/** Guide equivalent, so both marketplaces are reachable from mobile. */
export const myGuideListingApi = {
  save: (listing: Record<string, unknown>) =>
    api.request<{ id: string; profileJson: Record<string, unknown> | null }>(
      'POST',
      '/users/me/guide-listing',
      listing,
    ),
  remove: () => api.request<{ ok: true }>('DELETE', '/users/me/guide-listing'),
};
