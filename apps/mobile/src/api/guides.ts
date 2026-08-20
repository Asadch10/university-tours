// Mobile guides client — browses the real admin-approved website guides
// (`/search/community-guides`) and maps them into the shapes the UI renders,
// mirroring apps/website/lib/guides.ts (minus the web-only universities dataset
// and availability parsing).
import { api, API_BASE_URL } from './client';
import { SERVICE_LABEL_SHORT } from '../tour-types';

// API origin (trailing slash stripped) used to absolutize relative "/uploads/…" paths.
const API_BASE = API_BASE_URL.replace(/\/$/, '');

/** Full http URL stays; a leading-slash path is prefixed with the API origin; else null. */
export function absPhoto(v: unknown): string | null {
  if (typeof v !== 'string' || !v) return null;
  if (/^https?:\/\//.test(v)) return v;
  if (v.startsWith('/')) return `${API_BASE}${v}`;
  return null;
}

export type GuideService = 'CAMPUS_TOUR' | 'VIDEO_CONSULTATION' | 'CONSULTATION';

export interface Guide {
  id: string;
  headline: string;
  name: string;
  university: string;
  rating: number;
  reviews: number;
  photo: string;
  price: number; // cents
  services: GuideService[];
  gender: string;
  year: string;
  admission: string;
  focus: string;
}

export interface Checklist {
  label: string;
  active: boolean;
}

export interface GuideReview {
  name: string;
  date: string;
  rating: number;
  text: string;
}

/** Dates + the (shared) times a guide offers for one tour type. */
export interface TypeAvailability {
  dates: string[]; // 'YYYY-MM-DD'
  times: string[]; // 24-hour 'HH:MM', shared across every date
}
/** Availability keyed by tour type. A missing key means that type isn't offered. */
export type Availability = Partial<Record<GuideService, TypeAvailability>>;

export interface GuideProfile extends Guide {
  university: string;
  availability: Availability;
  gallery: string[];
  age: number;
  hometown: string;
  intro: string;
  majors: string[];
  extracurriculars: Checklist[];
  clubs: string[];
  housing: Checklist[];
  collegeExperience: string[];
  tip: string;
  favoriteClass: string[];
  careerGoals: string[];
  reviewList: GuideReview[];
  hostedBy: string;
}

export interface CommunityGuideReviewDto {
  name: string;
  rating: number;
  text: string | null;
  date: string; // ISO createdAt
}

export interface CommunityGuideDto {
  id: string;
  name: string;
  rating: number | null;
  reviews: number;
  listing: Record<string, unknown>;
  reviewList?: CommunityGuideReviewDto[];
}

export const EXTRACURRICULAR_OPTIONS = [
  'Greek life', 'Student government', 'Club/Organization', 'Community service',
  'Job/Internship', 'Religious/Cultural group', 'ROTC', 'Art/Music/Performance',
  'NCAA varsity sport', 'Study abroad', 'Recreational sport', 'Other',
];
export const HOUSING_OPTIONS = [
  'Dorm', 'Off-campus house or apartment', 'Fraternity or sorority house', 'Home (Commuter)', 'Other',
];

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [];
const splitList = (v: unknown): string[] =>
  str(v).split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

function firstName(name: string) {
  return name.split(' ')[0] ?? name;
}

/** Bookable start times shared by all guides for open scheduling (08:00 … 18:30). */
export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 8; h <= 18; h++) slots.push(`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`);
  return slots;
})();

const sortTimes = (times: string[]): string[] =>
  [...times].sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b));

const isDateStr = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Defensively normalize per-tour-type availability from the listing JSON. */
export function parseAvailability(value: unknown): Availability {
  const out: Availability = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
  const obj = value as Record<string, unknown>;
  (['CAMPUS_TOUR', 'VIDEO_CONSULTATION', 'CONSULTATION'] as GuideService[]).forEach((service) => {
    const entry = obj[service];
    if (!entry || typeof entry !== 'object') return;
    const rawDates = (entry as { dates?: unknown }).dates;
    const rawTimes = (entry as { times?: unknown }).times;
    const dates = Array.isArray(rawDates) ? [...new Set(rawDates.filter(isDateStr))].sort() : [];
    const times = Array.isArray(rawTimes)
      ? sortTimes([...new Set(rawTimes.filter((t): t is string => typeof t === 'string' && !!t.trim()))])
      : [];
    if (dates.length && times.length) out[service] = { dates, times };
  });
  return out;
}

/**
 * Stored listing values -> service enums. The strings below are PERSISTED data, not
 * display labels — renaming them would drop services from every existing listing.
 * See src/tour-types.ts.
 */
export function mapServices(tourTypes: unknown): GuideService[] {
  const t = strArr(tourTypes);
  const out: GuideService[] = [];
  if (t.includes('Campus tour')) out.push('CAMPUS_TOUR');
  if (t.includes('Video chat')) out.push('VIDEO_CONSULTATION');
  if (t.includes('Consultancy')) out.push('CONSULTATION');
  return out.length ? out : ['CAMPUS_TOUR'];
}

function mapAdmission(v: unknown): string {
  const a = str(v);
  if (/first/i.test(a)) return 'Admitted as a freshman';
  if (/transfer/i.test(a)) return 'Transfer student';
  return a;
}

function guidePhoto(dto: CommunityGuideDto): string {
  const photos = Array.isArray(dto.listing.photos) ? dto.listing.photos : [];
  const real = photos.map(absPhoto).find((p): p is string => !!p);
  return real ?? `https://i.pravatar.cc/600?u=${encodeURIComponent(dto.id)}`;
}

export function communityGuideToGuide(dto: CommunityGuideDto): Guide {
  const gl = dto.listing;
  return {
    id: dto.id,
    headline: str(gl.listingTitle) || `${str(gl.academicFocus) || 'Student'} guide`,
    name: dto.name || 'Student guide',
    university: str(gl.school),
    rating: dto.rating ?? 5.0,
    reviews: dto.reviews ?? 0,
    photo: guidePhoto(dto),
    price: 4000,
    services: mapServices(gl.tourTypes),
    gender: str(gl.gender),
    year: str(gl.academicYear),
    admission: mapAdmission(gl.admissionType),
    focus: str(gl.academicFocus),
  };
}

export function communityGuideToProfile(dto: CommunityGuideDto): GuideProfile {
  const gl = dto.listing;
  const base = communityGuideToGuide(dto);
  const realPhotos = (Array.isArray(gl.photos) ? gl.photos : []).map(absPhoto).filter((p): p is string => !!p);
  const gallery = [base.photo, ...realPhotos].filter(
    (p, i, arr): p is string => typeof p === 'string' && !!p && arr.indexOf(p) === i,
  );
  const fn = firstName(base.name);
  const majors = [...splitList(gl.majors), ...splitList(gl.minors).map((m) => `Minor in ${m}`)];
  const selected = new Set(strArr(gl.extracurriculars));
  const selectedHousing = new Set(strArr(gl.housing));

  return {
    ...base,
    availability: parseAvailability(gl.availability),
    gallery: gallery.length ? gallery : [base.photo],
    age: Number(str(gl.age)) || 0,
    hometown: str(gl.hometown),
    intro:
      str(gl.intro) ||
      `Hi, I'm ${fn}${base.university ? `, a student at ${base.university}` : ''}. I can't wait to show you around!`,
    majors: majors.length ? majors : base.focus ? [base.focus] : [],
    extracurriculars: EXTRACURRICULAR_OPTIONS.map((label) => ({ label, active: selected.has(label) })),
    clubs: splitList(gl.clubs),
    housing: HOUSING_OPTIONS.map((label) => ({ label, active: selectedHousing.has(label) })),
    collegeExperience: str(gl.describeExperience) ? [str(gl.describeExperience)] : [],
    tip: str(gl.tip),
    favoriteClass: str(gl.favoriteClass) ? [str(gl.favoriteClass)] : [],
    careerGoals: str(gl.careerGoals) ? [str(gl.careerGoals)] : [],
    reviewList: (dto.reviewList ?? []).map((r) => ({
      name: r.name,
      rating: r.rating,
      text: r.text ?? '',
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    })),
    hostedBy:
      str(gl.intro) ||
      `I joined Campus Private Tours to share an honest, student's-eye view of ${base.university || 'my campus'}.`,
  };
}

export const guidesApi = {
  // Approved website guides shown on Browse guides. Public — no auth needed.
  community: () => api.request<{ data: CommunityGuideDto[] }>('GET', '/search/community-guides'),
  detail: (id: string) => api.request<CommunityGuideDto>('GET', `/search/community-guides/${id}`),
};

/** Cents → "$40" (whole dollars, for "From $40"). */
export function fromPrice(cents: number): string {
  return `$${Math.round((cents ?? 0) / 100)}`;
}

/** Compact chip label (guide cards / detail). Full names live in SERVICE_LABEL. */
export function serviceLabel(s: GuideService): string {
  return SERVICE_LABEL_SHORT[s];
}
