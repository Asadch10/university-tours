// Mock tour-guide data for the search grid and guide detail pages.
// In production these come from the backend; shapes mirror the domain model.
// Wire to the real API later — the UI only depends on the exported types.

import { universities } from '@/lib/data';
import { parseAvailability, type Availability } from '@/lib/availability';

export type GuideService = 'CAMPUS_TOUR' | 'VIDEO_CONSULTATION' | 'CONSULTATION';

export const GENDERS = ['Male', 'Female', 'Non-binary'];
export const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate student'];
export const ADMISSIONS = ['Admitted as a freshman', 'Transfer student'];
export const FOCUSES = ['STEM', 'Business', 'Humanities', 'Arts', 'Social Sciences', 'Pre-Med', 'Pre-Law'];

export type Guide = {
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
};

const HEADLINES = [
  'Biology Student @ Columbia University',
  'CS Junior sharing real research culture & startup life',
  'Economics Senior & House tour guide',
  'Film & TV student giving behind-the-scenes campus tours',
  'Dual-Degree Student in the Huntsman Program',
  'MIMG Major, Global Health Minor, Pre-Med Student & Dancer :)',
  'Stern Finance Senior navigating an urban campus',
  'Pre-Med & Orientation Leader who loves Ann Arbor',
  'Data Science junior exploring cafés & Bay Area energy',
  'Journalism student showing the real neighborhood life',
  'Mechanical Engineering & robotics team captain',
  'Architecture student with a love for campus design',
  'Political Science major & varsity athlete',
  'Neuroscience student and peer mentor',
  'Business + Music double major, campus tour veteran',
  'Public Health senior passionate about community',
  'English Lit student & campus poetry club lead',
  'Aerospace Engineering junior and maker',
  'Psychology major & student government rep',
  'Marine Science student who knows every hidden spot',
];

const NAMES = [
  'Rachel B', 'Ujala C', 'Eric L', 'Sara H', 'Maya R', 'Daniel O', 'Sofia M', 'Aiden C',
  'Priya N', 'Jordan B', 'Olivia B', 'Hannah C', 'Liam K', 'Noah P', 'Emma W', 'Ava T',
  'Lucas D', 'Mia G', 'Ethan R', 'Isabella F', 'Mason H', 'Charlotte S', 'Logan M', 'Amelia V',
  'James L', 'Harper N', 'Benjamin O', 'Evelyn Q', 'Henry Z', 'Abigail Y',
];

const PHOTOS = [
  47, 45, 12, 33, 44, 15, 5, 32, 9, 13, 25, 51, 60, 14, 16, 20, 3, 7, 11, 24,
  31, 36, 40, 48, 52, 56, 59, 62, 65, 68,
];

export const guides: Guide[] = NAMES.map((name, i) => {
  const uni = universities[i % universities.length]!;
  const ratingChoices = [5.0, 4.9, 4.8, 5.0, 4.7];
  return {
    id: `g${i + 1}`,
    headline: HEADLINES[i % HEADLINES.length]!,
    name,
    university: uni.name,
    rating: ratingChoices[i % ratingChoices.length]!,
    reviews: 4 + ((i * 7) % 40),
    photo: `https://i.pravatar.cc/600?img=${PHOTOS[i % PHOTOS.length]}`,
    price: 4000 + ((i % 7) * 500),
    services:
      i % 3 === 0
        ? ['CAMPUS_TOUR']
        : i % 3 === 1
          ? ['CAMPUS_TOUR', 'VIDEO_CONSULTATION']
          : ['VIDEO_CONSULTATION'],
    gender: GENDERS[i % GENDERS.length]!,
    year: YEARS[i % YEARS.length]!,
    admission: ADMISSIONS[i % ADMISSIONS.length]!,
    focus: FOCUSES[i % FOCUSES.length]!,
  };
});

/* ─── Extended profile for the detail page ───────────────────────────── */

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

export interface GuideProfile extends Guide {
  universitySlug: string;
  universityLocation: string;
  universityImage: string;
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
  /** Per-tour-type dates + times the guide offers. Empty = open scheduling. */
  availability: Availability;
}

const HOMETOWNS = [
  'Enterprise, AL', 'Austin, TX', 'Denver, CO', 'Portland, OR', 'Nashville, TN',
  'Columbus, OH', 'Sacramento, CA', 'Raleigh, NC', 'Boise, ID', 'Tampa, FL',
];
const EXTRACURRICULAR_OPTIONS = [
  'Greek life', 'Student government', 'Club/Organization', 'Community service',
  'Job/Internship', 'Religious/Cultural group', 'ROTC', 'Art/Music/Performance',
  'NCAA varsity sport', 'Study abroad', 'Recreational sport', 'Other',
];
const HOUSING_OPTIONS = [
  'Dorm', 'Off-campus house or apartment', 'Fraternity or sorority house', 'Home (Commuter)', 'Other',
];
const CLUBS_POOL = [
  'Tri Delta Sorority - Philanthropy Chair',
  'Club Tennis Member',
  'College of Business Executive Society',
  'Peer Instructor for the Career Center',
  'Pre-Law Honor Society',
  'Robotics Team Captain',
  'Student Ambassador Program',
  'Debate Club',
  'Volunteer Corps',
  'Campus Radio Host',
];
const REVIEWERS = [
  'Kristine R', 'Bethany R', 'Marcus T', 'Dana P', 'Olivia H', 'The Patel Family',
  'James & Dana', 'Sophia L', 'The Nguyen Family', 'Aaron M',
];

function firstName(name: string) {
  return name.split(' ')[0]!;
}

function buildProfile(g: Guide, i: number, uni: (typeof universities)[number]): GuideProfile {
  const fn = firstName(g.name);
  const gallery = [
    g.photo,
    uni.image,
    `https://i.pravatar.cc/800?img=${PHOTOS[(i + 4) % PHOTOS.length]}`,
    universities[(i + 3) % universities.length]!.image,
    universities[(i + 6) % universities.length]!.image,
    `https://i.pravatar.cc/800?img=${PHOTOS[(i + 9) % PHOTOS.length]}`,
    universities[(i + 9) % universities.length]!.image,
  ];

  const extracurriculars: Checklist[] = EXTRACURRICULAR_OPTIONS.map((label, k) => ({
    label,
    active: (i + k) % 3 !== 0,
  }));
  const housing: Checklist[] = HOUSING_OPTIONS.map((label, k) => ({
    label,
    active: k === (i % HOUSING_OPTIONS.length),
  }));
  const clubs = [0, 1, 2, 3, 4].map((k) => CLUBS_POOL[(i + k) % CLUBS_POOL.length]!);

  return {
    ...g,
    universitySlug: uni.slug,
    universityLocation: uni.location,
    universityImage: uni.image,
    gallery,
    age: 19 + (i % 4),
    hometown: HOMETOWNS[i % HOMETOWNS.length]!,
    intro: `Hi y’all! I’m ${fn}, a ${g.year.toLowerCase()} at ${g.university} studying ${g.focus}. Around campus I stay busy with clubs, friends, and finding the best study spots. On your tour, I’m excited to share not just the facts, but my inside scoop — the best spots on campus, hidden gems, and what ${g.university} is really like as a student. I want you to experience the same feeling that made me fall in love with this place!`,
    majors: [g.focus, i % 2 === 0 ? 'Minor in Communications' : 'Minor in Psychology'],
    extracurriculars,
    clubs,
    housing,
    collegeExperience: [
      `Coming into college, my biggest worries were balancing everything and making friends — it’s a big change. But I honestly adjusted way faster than I expected. What helped most was realizing everyone else, no matter their year, was just as eager (and nervous) to meet people.`,
      `Since then, my experience has been amazing. Between the campus energy, the beautiful grounds, the community, and always discovering new favorite study spots, I’ve gotten to enjoy every side of student life at ${g.university}.`,
      `College has also helped me grow personally. I used to be a lot more introverted, but now I feel confident speaking up, making connections, and really getting involved. It’s helped me step out of my comfort zone and made campus feel like home.`,
    ],
    tip: `Don’t be afraid to just walk around campus — seriously. I didn’t do it much at first, but now I find new spots all the time that I wish I’d discovered sooner. ${g.university} is full of hidden gems, whether it’s a quiet study area or a cool view.`,
    favoriteClass: [
      `My favorite class so far has been the introductory course in my major. While many colleges have an intro class, this one stood out because it was fun, engaging, and really welcoming — definitely not intimidating.`,
      `What I really appreciated was how the class set me up for success beyond just academics — focusing on building connections, creating strong profiles, and polishing resumes. It was reassuring to get that guidance early.`,
    ],
    careerGoals: [
      `After college, I hope to build a career that combines my passions with the skills I’ve developed in ${g.focus}. My time here has given me the mentorship and confidence to chase that goal.`,
      `My experience has shown me that success isn’t determined by any one thing — it’s about taking advantage of the opportunities and mentorship available, and ${g.university} provides plenty of both.`,
    ],
    reviewList: [
      {
        name: REVIEWERS[i % REVIEWERS.length]!,
        date: 'June 2026',
        rating: 5,
        text: `${fn} was absolutely the perfect tour guide! From the moment we met, ${fn} made the experience engaging, informative, and genuinely fun. This was far more than your typical walk-around-campus tour. ${fn} answered all of our questions with honesty and insight, giving us a much better understanding of what it’s like to be a student here.`,
      },
      {
        name: REVIEWERS[(i + 3) % REVIEWERS.length]!,
        date: 'May 2026',
        rating: 5,
        text: `${fn} gave an amazing tour of ${g.university}. A great representative of the university — my daughter was very happy as a prospective student. ${fn} shared many unique highlights of the campus and we couldn’t have had a better tour guide.`,
      },
    ],
    hostedBy: `I joined University Campus Private Tours to show prospective students and parents the real, honest truth about ${g.university}. I hate white lies and I hate sugarcoating, especially when it comes to life-changing decisions like college. I’m always honest, down-to-earth, while always being open to meet new people.`,
    // Sample guides have no fixed availability — the booking widget stays open.
    availability: {},
  };
}

export function findGuide(id: string): Guide | undefined {
  return guides.find((g) => g.id === id);
}

export function getGuideProfile(id: string): GuideProfile | undefined {
  const idx = guides.findIndex((g) => g.id === id);
  if (idx === -1) return undefined;
  const g = guides[idx]!;
  const uni = universities[idx % universities.length]!;
  return buildProfile(g, idx, uni);
}

/* ─── Community guides (real, admin-approved website listings) ──────────────
   These come from the backend (`/search/community-guides`) and are mapped into
   the same Guide / GuideProfile shapes the UI already renders, so approved
   guides appear alongside the sample guides with no special-casing. */

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

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [];
/** Photos are object URLs during the guide's session; only real (http) URLs survive. */
const httpPhoto = (v: unknown): v is string => typeof v === 'string' && /^https?:\/\//.test(v);
const splitList = (v: unknown): string[] =>
  str(v)
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

function mapServices(tourTypes: unknown): GuideService[] {
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
  const real = photos.find(httpPhoto);
  // Deterministic avatar fallback (photos uploaded in-browser don't persist yet).
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
  const uni = universities.find((u) => u.name === base.university);
  const realPhotos = (Array.isArray(gl.photos) ? gl.photos : []).filter(httpPhoto);
  const gallery = [base.photo, ...realPhotos, uni?.image].filter(
    (p): p is string => typeof p === 'string' && !!p,
  );
  const fn = firstName(base.name);
  const majors = [...splitList(gl.majors), ...splitList(gl.minors).map((m) => `Minor in ${m}`)];
  const selected = new Set(strArr(gl.extracurriculars));
  const selectedHousing = new Set(strArr(gl.housing));

  return {
    ...base,
    universitySlug: uni?.slug ?? '',
    universityLocation: uni?.location ?? '',
    universityImage: uni?.image ?? base.photo,
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
      `I joined University Campus Private Tours to share an honest, student's-eye view of ${base.university || 'my campus'}.`,
    availability: parseAvailability(gl.availability),
  };
}
