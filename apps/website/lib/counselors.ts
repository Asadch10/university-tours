import type { CommunityGuideDto, GuideService } from './guides';
import { parseAvailability, labelToService, type Availability } from './availability';

/**
 * Shape the Browse College Counselors UI renders.
 *
 * The API returns the same row shape as guides (`CommunityGuideDto`), because both
 * come from a published listing inside `profileJson`. The difference is what lives
 * inside `listing`: a counselor's answers are keyed by the questionnaire's stable
 * fieldKeys (headline, organization, specialties, …), set in the seeded counselor
 * questionnaire.
 */
export interface Counselor {
  id: string;
  name: string;
  photo: string;
  headline: string;
  organization: string;
  credentials: string;
  yearsExperience: string;
  specialties: string[];
  bio: string;
  website: string;
  rating: number | null;
  reviews: number;
  /** Services offered + when — same shape a guide uses, so booking is identical. */
  services: GuideService[];
  availability: Availability;
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [];

/** Answers are stored under fieldKey when the question defines one. */
function answersOf(listing: Record<string, unknown>): Record<string, unknown> {
  const a = listing.answers;
  return a && typeof a === 'object' ? (a as Record<string, unknown>) : {};
}

export function counselorFromDto(dto: CommunityGuideDto): Counselor {
  const listing = dto.listing ?? {};
  const a = answersOf(listing);
  const photo = str(listing.photo);

  return {
    id: dto.id,
    name: dto.name,
    // Deterministic avatar fallback, same approach the guide directory uses.
    photo: /^https?:\/\//.test(photo) ? photo : `https://i.pravatar.cc/600?u=${encodeURIComponent(dto.id)}`,
    headline: str(a.headline) || 'College counselor',
    organization: str(a.organization),
    credentials: str(a.credentials),
    yearsExperience: str(a.yearsExperience),
    specialties: strArr(a.specialties),
    bio: str(a.bio),
    website: str(a.website),
    rating: dto.rating,
    reviews: dto.reviews,
    services: (Array.isArray(listing.tourTypes) ? listing.tourTypes : [])
      .filter((t): t is string => typeof t === 'string')
      .map(labelToService)
      .filter((sv): sv is GuideService => sv !== null),
    availability: parseAvailability(listing.availability),
  };
}
