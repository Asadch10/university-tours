/**
 * Mock data store for the admin console.
 *
 * Shapes mirror the PostgreSQL entity catalog (Part IV §3) and the API contract (Part I §7) so
 * they swap cleanly for live `@ucpt/sdk` calls later. All money is integer cents; all timestamps
 * are ISO-8601 UTC. Universities/guides intentionally match the public website's seed content.
 */

export type ServiceType = 'CAMPUS_TOUR' | 'VIDEO_CONSULTATION';
export type BookingStatus =
  | 'REQUESTED'
  | 'UPCOMING'
  | 'COMPLETED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';
export type UserRole = 'BUYER' | 'SELLER';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
export type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'DISABLED';

export const COMMISSION_PCT = 25; // single global commission, snapshotted per booking

// ─────────────────────────────────────────────────────────── Universities
export interface School {
  id: string;
  name: string;
  slug: string;
  location: string;
  state: string;
  enabled: boolean;
  ambassadors: number;
  bookings: number;
  rating: number;
}

export const schools: School[] = [
  { id: 's1', name: 'Stanford University', slug: 'stanford', location: 'Stanford, CA', state: 'California', enabled: true, ambassadors: 48, bookings: 312, rating: 4.9 },
  { id: 's2', name: 'Harvard University', slug: 'harvard', location: 'Cambridge, MA', state: 'Massachusetts', enabled: true, ambassadors: 53, bookings: 401, rating: 4.9 },
  { id: 's3', name: 'UCLA', slug: 'ucla', location: 'Los Angeles, CA', state: 'California', enabled: true, ambassadors: 61, bookings: 287, rating: 4.8 },
  { id: 's4', name: 'New York University', slug: 'nyu', location: 'New York, NY', state: 'New York', enabled: true, ambassadors: 44, bookings: 219, rating: 4.7 },
  { id: 's5', name: 'University of Michigan', slug: 'umich', location: 'Ann Arbor, MI', state: 'Michigan', enabled: true, ambassadors: 39, bookings: 176, rating: 4.8 },
  { id: 's6', name: 'UT Austin', slug: 'utexas', location: 'Austin, TX', state: 'Texas', enabled: true, ambassadors: 36, bookings: 154, rating: 4.8 },
  { id: 's7', name: 'University of Washington', slug: 'uw', location: 'Seattle, WA', state: 'Washington', enabled: false, ambassadors: 0, bookings: 0, rating: 0 },
];

// ─────────────────────────────────────────────────────────── Users
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  school?: string;
  bookings: number;
  joinedAt: string;
  avatar?: string;
  emailVerified: boolean;
}

export const users: User[] = [
  { id: 'u1', name: 'Karen Davis', email: 'karen.d@example.com', role: 'BUYER', status: 'ACTIVE', bookings: 3, joinedAt: '2026-01-12T09:00:00Z', emailVerified: true, avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: 'u2', name: 'Marcus Thompson', email: 'marcus.t@example.com', role: 'BUYER', status: 'ACTIVE', bookings: 1, joinedAt: '2026-02-03T14:20:00Z', emailVerified: true, avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: 'u3', name: 'Priya Nair', email: 'priya.nair@umich.edu', role: 'SELLER', status: 'ACTIVE', school: 'University of Michigan', bookings: 49, joinedAt: '2025-09-21T08:00:00Z', emailVerified: true, avatar: 'https://i.pravatar.cc/150?img=44' },
  { id: 'u4', name: 'Maya Robinson', email: 'maya.r@stanford.edu', role: 'SELLER', status: 'ACTIVE', school: 'Stanford University', bookings: 81, joinedAt: '2025-08-15T08:00:00Z', emailVerified: true, avatar: 'https://i.pravatar.cc/150?img=47' },
  { id: 'u5', name: 'Daniel Okafor', email: 'daniel.o@harvard.edu', role: 'SELLER', status: 'ACTIVE', school: 'Harvard University', bookings: 70, joinedAt: '2025-08-30T08:00:00Z', emailVerified: true, avatar: 'https://i.pravatar.cc/150?img=12' },
  { id: 'u6', name: 'The Alvarez Family', email: 'alvarez@example.com', role: 'BUYER', status: 'ACTIVE', bookings: 5, joinedAt: '2026-03-18T19:00:00Z', emailVerified: true, avatar: 'https://i.pravatar.cc/150?img=32' },
  { id: 'u7', name: 'Wei Lin', email: 'wei.lin@example.com', role: 'BUYER', status: 'SUSPENDED', bookings: 2, joinedAt: '2026-02-28T11:00:00Z', emailVerified: true, avatar: 'https://i.pravatar.cc/150?img=15' },
  { id: 'u8', name: 'Jordan Blake', email: 'jordan.b@utexas.edu', role: 'SELLER', status: 'ACTIVE', school: 'UT Austin', bookings: 42, joinedAt: '2025-10-02T08:00:00Z', emailVerified: true, avatar: 'https://i.pravatar.cc/150?img=33' },
  { id: 'u9', name: 'Sofia Martinez', email: 'sofia.m@ucla.edu', role: 'SELLER', status: 'ACTIVE', school: 'UCLA', bookings: 58, joinedAt: '2025-09-10T08:00:00Z', emailVerified: true, avatar: 'https://i.pravatar.cc/150?img=45' },
  { id: 'u10', name: 'Aiden Chen', email: 'aiden.c@nyu.edu', role: 'SELLER', status: 'ACTIVE', school: 'New York University', bookings: 44, joinedAt: '2025-11-05T08:00:00Z', emailVerified: false, avatar: 'https://i.pravatar.cc/150?img=51' },
  { id: 'u11', name: 'Rachel Green', email: 'rachel.g@example.com', role: 'BUYER', status: 'ACTIVE', bookings: 0, joinedAt: '2026-05-30T10:00:00Z', emailVerified: false, avatar: 'https://i.pravatar.cc/150?img=20' },
  { id: 'u12', name: 'Tom Harris', email: 'tom.h@example.com', role: 'BUYER', status: 'BANNED', bookings: 1, joinedAt: '2026-01-20T16:00:00Z', emailVerified: true, avatar: 'https://i.pravatar.cc/150?img=53' },
];

// ─────────────────────────────────────────────────────────── Applications
export interface ApplicationAnswer {
  question: string;
  answer: string;
}
export interface Application {
  id: string;
  applicant: string;
  email: string;
  school: string;
  major: string;
  gradYear: number;
  status: ApplicationStatus;
  submittedAt: string;
  avatar?: string;
  enrollmentDoc: string;
  answers: ApplicationAnswer[];
  reason?: string;
}

export const applications: Application[] = [
  {
    id: 'app1', applicant: 'Leah Kim', email: 'leah.kim@stanford.edu', school: 'Stanford University', major: 'Bioengineering', gradYear: 2027, status: 'PENDING', submittedAt: '2026-06-14T10:30:00Z', avatar: 'https://i.pravatar.cc/150?img=24', enrollmentDoc: 'enrollment-leah-kim.pdf',
    answers: [
      { question: 'Why do you want to be a campus guide?', answer: 'I love sharing the parts of Stanford the official tours skip, and helping families feel at home.' },
      { question: 'How many hours per week can you commit?', answer: '6–8 hours, flexible around classes.' },
      { question: 'Describe a memorable campus spot.', answer: "The Main Quad at golden hour — it's where I decided to enroll." },
    ],
  },
  {
    id: 'app2', applicant: 'Omar Farouk', email: 'omar.f@harvard.edu', school: 'Harvard University', major: 'Government', gradYear: 2026, status: 'PENDING', submittedAt: '2026-06-13T16:05:00Z', avatar: 'https://i.pravatar.cc/150?img=59', enrollmentDoc: 'enrollment-omar-farouk.pdf',
    answers: [
      { question: 'Why do you want to be a campus guide?', answer: 'I give the most honest take on the house system and financial aid.' },
      { question: 'How many hours per week can you commit?', answer: 'Up to 10 hours.' },
      { question: 'Describe a memorable campus spot.', answer: 'Widener Library steps at sunset.' },
    ],
  },
  {
    id: 'app3', applicant: 'Hannah Cho', email: 'hannah.c@ucla.edu', school: 'UCLA', major: 'Communications', gradYear: 2027, status: 'CHANGES_REQUESTED', submittedAt: '2026-06-10T12:00:00Z', avatar: 'https://i.pravatar.cc/150?img=16', enrollmentDoc: 'enrollment-hannah-cho.pdf', reason: 'Enrollment document is blurry — please re-upload a clearer scan.',
    answers: [
      { question: 'Why do you want to be a campus guide?', answer: "I'm an orientation leader and love welcoming new families." },
      { question: 'How many hours per week can you commit?', answer: '5 hours.' },
      { question: 'Describe a memorable campus spot.', answer: 'Janss Steps on game day.' },
    ],
  },
  {
    id: 'app4', applicant: 'Diego Ramos', email: 'diego.r@utexas.edu', school: 'UT Austin', major: 'Computer Science', gradYear: 2026, status: 'APPROVED', submittedAt: '2026-06-02T09:15:00Z', avatar: 'https://i.pravatar.cc/150?img=60', enrollmentDoc: 'enrollment-diego-ramos.pdf',
    answers: [
      { question: 'Why do you want to be a campus guide?', answer: 'Real talk on dorms, dining, and the Austin scene.' },
      { question: 'How many hours per week can you commit?', answer: '8 hours.' },
      { question: 'Describe a memorable campus spot.', answer: 'The Tower lit up burnt orange after a win.' },
    ],
  },
  {
    id: 'app5', applicant: 'Bryan Lewis', email: 'bryan.l@nyu.edu', school: 'New York University', major: 'Film', gradYear: 2028, status: 'REJECTED', submittedAt: '2026-05-28T13:40:00Z', avatar: 'https://i.pravatar.cc/150?img=68', enrollmentDoc: 'enrollment-bryan-lewis.pdf', reason: 'Could not verify current enrollment status for the stated term.',
    answers: [
      { question: 'Why do you want to be a campus guide?', answer: 'I want to show the NYC campus experience.' },
      { question: 'How many hours per week can you commit?', answer: '3 hours.' },
      { question: 'Describe a memorable campus spot.', answer: 'Washington Square Park.' },
    ],
  },
];

// ─────────────────────────────────────────────────────────── Questionnaire
export type QuestionType = 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_SELECT' | 'MULTI_SELECT' | 'FILE';
export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[];
}
export interface Questionnaire {
  id: string;
  updatedAt: string;
  questions: Question[];
}

export const questionnaires: Questionnaire[] = [
  {
    id: 'q1', updatedAt: '2026-05-20T08:00:00Z',
    questions: [
      { id: 'qq1', type: 'SHORT_TEXT', label: 'Full legal name', required: true },
      { id: 'qq2', type: 'SINGLE_SELECT', label: 'Expected graduation year', required: true, options: ['2026', '2027', '2028', '2029'] },
      { id: 'qq3', type: 'LONG_TEXT', label: 'Why do you want to be a campus guide?', required: true },
      { id: 'qq4', type: 'SINGLE_SELECT', label: 'How many hours per week can you commit?', required: true, options: ['1–3', '4–6', '7–10', '10+'] },
      { id: 'qq5', type: 'MULTI_SELECT', label: 'Languages you can guide in', required: false, options: ['English', 'Spanish', 'Mandarin', 'Hindi', 'French'] },
      { id: 'qq6', type: 'FILE', label: 'Proof of current enrollment', required: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────── Listings
export interface Listing {
  id: string;
  guide: string;
  guideAvatar?: string;
  school: string;
  service: ServiceType;
  title: string;
  priceFrom: number; // cents
  status: ListingStatus;
  bookings: number;
  createdAt: string;
}

export const listings: Listing[] = [
  { id: 'l1', guide: 'Maya Robinson', guideAvatar: 'https://i.pravatar.cc/150?img=47', school: 'Stanford University', service: 'CAMPUS_TOUR', title: 'The unofficial Stanford tour', priceFrom: 6500, status: 'ACTIVE', bookings: 81, createdAt: '2025-09-01T08:00:00Z' },
  { id: 'l2', guide: 'Daniel Okafor', guideAvatar: 'https://i.pravatar.cc/150?img=12', school: 'Harvard University', service: 'VIDEO_CONSULTATION', title: 'Harvard admissions & houses Q&A', priceFrom: 7000, status: 'ACTIVE', bookings: 70, createdAt: '2025-09-05T08:00:00Z' },
  { id: 'l3', guide: 'Sofia Martinez', guideAvatar: 'https://i.pravatar.cc/150?img=45', school: 'UCLA', service: 'CAMPUS_TOUR', title: 'A behind-the-scenes UCLA walk', priceFrom: 5000, status: 'ACTIVE', bookings: 58, createdAt: '2025-09-12T08:00:00Z' },
  { id: 'l4', guide: 'Aiden Chen', guideAvatar: 'https://i.pravatar.cc/150?img=51', school: 'New York University', service: 'CAMPUS_TOUR', title: 'NYU & Greenwich Village like a local', priceFrom: 6000, status: 'INACTIVE', bookings: 44, createdAt: '2025-11-06T08:00:00Z' },
  { id: 'l5', guide: 'Priya Nair', guideAvatar: 'https://i.pravatar.cc/150?img=44', school: 'University of Michigan', service: 'VIDEO_CONSULTATION', title: 'Pre-med & engineering at Michigan', priceFrom: 4500, status: 'ACTIVE', bookings: 49, createdAt: '2025-09-22T08:00:00Z' },
  { id: 'l6', guide: 'Jordan Blake', guideAvatar: 'https://i.pravatar.cc/150?img=33', school: 'UT Austin', service: 'CAMPUS_TOUR', title: "Hook 'em: the real UT Austin", priceFrom: 4000, status: 'DISABLED', bookings: 42, createdAt: '2025-10-03T08:00:00Z' },
];

// ─────────────────────────────────────────────────────────── Bookings
export interface Booking {
  id: string;
  buyer: string;
  guide: string;
  school: string;
  service: ServiceType;
  status: BookingStatus;
  scheduledAt: string;
  grossCents: number;
  commissionPct: number;
  netCents: number;
  createdAt: string;
}

function mkBooking(
  id: string,
  buyer: string,
  guide: string,
  school: string,
  service: ServiceType,
  status: BookingStatus,
  scheduledAt: string,
  grossCents: number,
  createdAt: string,
): Booking {
  const commissionCents = Math.round((grossCents * COMMISSION_PCT) / 100);
  return {
    id, buyer, guide, school, service, status, scheduledAt, grossCents,
    commissionPct: COMMISSION_PCT, netCents: grossCents - commissionCents, createdAt,
  };
}

export const bookings: Booking[] = [
  mkBooking('bk1042', 'Karen Davis', 'Priya Nair', 'University of Michigan', 'CAMPUS_TOUR', 'UPCOMING', '2026-06-22T15:00:00Z', 4500, '2026-06-14T11:00:00Z'),
  mkBooking('bk1041', 'Marcus Thompson', 'Daniel Okafor', 'Harvard University', 'VIDEO_CONSULTATION', 'REQUESTED', '2026-06-25T18:00:00Z', 7000, '2026-06-15T08:30:00Z'),
  mkBooking('bk1040', 'The Alvarez Family', 'Maya Robinson', 'Stanford University', 'CAMPUS_TOUR', 'COMPLETED', '2026-06-08T16:00:00Z', 6500, '2026-05-30T10:00:00Z'),
  mkBooking('bk1039', 'Wei Lin', 'Sofia Martinez', 'UCLA', 'CAMPUS_TOUR', 'COMPLETED', '2026-06-05T14:00:00Z', 5000, '2026-05-28T09:00:00Z'),
  mkBooking('bk1038', 'Karen Davis', 'Jordan Blake', 'UT Austin', 'CAMPUS_TOUR', 'DECLINED', '2026-06-18T13:00:00Z', 4000, '2026-06-11T17:00:00Z'),
  mkBooking('bk1037', 'Rachel Green', 'Aiden Chen', 'New York University', 'CAMPUS_TOUR', 'CANCELLED', '2026-06-12T12:00:00Z', 6000, '2026-06-04T19:00:00Z'),
  mkBooking('bk1036', 'Marcus Thompson', 'Maya Robinson', 'Stanford University', 'VIDEO_CONSULTATION', 'EXPIRED', '2026-06-10T20:00:00Z', 6500, '2026-06-03T20:00:00Z'),
  mkBooking('bk1035', 'The Alvarez Family', 'Daniel Okafor', 'Harvard University', 'CAMPUS_TOUR', 'UPCOMING', '2026-06-28T15:30:00Z', 7000, '2026-06-13T14:00:00Z'),
  mkBooking('bk1034', 'Karen Davis', 'Sofia Martinez', 'UCLA', 'VIDEO_CONSULTATION', 'COMPLETED', '2026-06-01T17:00:00Z', 5000, '2026-05-24T11:00:00Z'),
  mkBooking('bk1033', 'Wei Lin', 'Priya Nair', 'University of Michigan', 'CAMPUS_TOUR', 'COMPLETED', '2026-05-29T15:00:00Z', 4500, '2026-05-20T08:00:00Z'),
];

// ─────────────────────────────────────────────────────────── Transactions / Ledger
export interface LedgerEntry {
  id: string;
  bookingId: string;
  type: 'CAPTURE' | 'REFUND' | 'PAYOUT';
  guide: string;
  grossCents: number;
  commissionCents: number;
  netCents: number;
  createdAt: string;
}

export const ledger: LedgerEntry[] = bookings
  .filter((b) => b.status === 'COMPLETED' || b.status === 'UPCOMING')
  .map((b, i) => ({
    id: `tx${900 + i}`,
    bookingId: b.id,
    type: 'CAPTURE' as const,
    guide: b.guide,
    grossCents: b.grossCents,
    commissionCents: Math.round((b.grossCents * b.commissionPct) / 100),
    netCents: b.netCents,
    createdAt: b.createdAt,
  }));

export interface GuideBalance {
  guide: string;
  avatar?: string;
  school: string;
  completedNetCents: number;
  paidOutCents: number;
  balanceCents: number;
}

export const guideBalances: GuideBalance[] = [
  { guide: 'Maya Robinson', avatar: 'https://i.pravatar.cc/150?img=47', school: 'Stanford University', completedNetCents: 39_4875, paidOutCents: 30_0000, balanceCents: 9_4875 },
  { guide: 'Daniel Okafor', avatar: 'https://i.pravatar.cc/150?img=12', school: 'Harvard University', completedNetCents: 36_7500, paidOutCents: 36_7500, balanceCents: 0 },
  { guide: 'Sofia Martinez', avatar: 'https://i.pravatar.cc/150?img=45', school: 'UCLA', completedNetCents: 21_7500, paidOutCents: 15_0000, balanceCents: 6_7500 },
  { guide: 'Priya Nair', avatar: 'https://i.pravatar.cc/150?img=44', school: 'University of Michigan', completedNetCents: 16_5375, paidOutCents: 10_0000, balanceCents: 6_5375 },
  { guide: 'Jordan Blake', avatar: 'https://i.pravatar.cc/150?img=33', school: 'UT Austin', completedNetCents: 12_6000, paidOutCents: 12_6000, balanceCents: 0 },
];

export interface Payout {
  id: string;
  guide: string;
  amountCents: number;
  method: 'BANK_TRANSFER' | 'PAYPAL' | 'CHECK';
  reference: string;
  createdAt: string;
}

export const payouts: Payout[] = [
  { id: 'po501', guide: 'Maya Robinson', amountCents: 30_0000, method: 'BANK_TRANSFER', reference: 'ACH-2026-0512', createdAt: '2026-06-01T10:00:00Z' },
  { id: 'po500', guide: 'Daniel Okafor', amountCents: 36_7500, method: 'PAYPAL', reference: 'PP-9981-2231', createdAt: '2026-05-28T10:00:00Z' },
  { id: 'po499', guide: 'Sofia Martinez', amountCents: 15_0000, method: 'BANK_TRANSFER', reference: 'ACH-2026-0488', createdAt: '2026-05-20T10:00:00Z' },
  { id: 'po498', guide: 'Jordan Blake', amountCents: 12_6000, method: 'CHECK', reference: 'CHK-1043', createdAt: '2026-05-15T10:00:00Z' },
];

// ─────────────────────────────────────────────────────────── Refunds
export interface Refund {
  id: string;
  bookingId: string;
  buyer: string;
  guide: string;
  amountCents: number;
  originalCents: number;
  type: 'FULL' | 'PARTIAL';
  reason: string;
  status: 'COMPLETED' | 'PROCESSING';
  createdAt: string;
}

export const refunds: Refund[] = [
  { id: 'rf301', bookingId: 'bk1037', buyer: 'Rachel Green', guide: 'Aiden Chen', amountCents: 6000, originalCents: 6000, type: 'FULL', reason: 'Guide cancelled — full refund per policy.', status: 'COMPLETED', createdAt: '2026-06-12T13:00:00Z' },
  { id: 'rf300', bookingId: 'bk1031', buyer: 'Karen Davis', guide: 'Maya Robinson', amountCents: 3250, originalCents: 6500, type: 'PARTIAL', reason: 'Session cut short due to weather.', status: 'COMPLETED', createdAt: '2026-06-02T16:00:00Z' },
];

// ─────────────────────────────────────────────────────────── Reviews
export interface Review {
  id: string;
  bookingId: string;
  buyer: string;
  guide: string;
  school: string;
  rating: number;
  text: string;
  hidden: boolean;
  createdAt: string;
}

export const reviews: Review[] = [
  { id: 'rv701', bookingId: 'bk1040', buyer: 'The Alvarez Family', guide: 'Maya Robinson', school: 'Stanford University', rating: 5, text: 'Our daughter finally pictured herself on campus. Worth every penny.', hidden: false, createdAt: '2026-06-09T10:00:00Z' },
  { id: 'rv700', bookingId: 'bk1034', buyer: 'Karen Davis', guide: 'Sofia Martinez', school: 'UCLA', rating: 5, text: 'Transparent pricing, a verified student, and a genuinely warm tour.', hidden: false, createdAt: '2026-06-02T12:00:00Z' },
  { id: 'rv699', bookingId: 'bk1033', buyer: 'Wei Lin', guide: 'Priya Nair', school: 'University of Michigan', rating: 4, text: 'Great insight into pre-med life. Wished it ran a little longer.', hidden: false, createdAt: '2026-05-30T09:00:00Z' },
  { id: 'rv698', bookingId: 'bk1039', buyer: 'Wei Lin', guide: 'Sofia Martinez', school: 'UCLA', rating: 1, text: 'This review contains contact details and spammy links — buy followers at…', hidden: true, createdAt: '2026-06-06T18:00:00Z' },
];

// ─────────────────────────────────────────────────────────── CMS
export interface CmsBlock {
  id: string;
  key: string;
  type: 'HOMEPAGE_SECTION' | 'FAQ' | 'PAGE' | 'TESTIMONIAL';
  title: string;
  published: boolean;
  updatedAt: string;
  content: string;
}

export const cmsBlocks: CmsBlock[] = [
  { id: 'cms1', key: 'home.hero', type: 'HOMEPAGE_SECTION', title: 'Homepage hero', published: true, updatedAt: '2026-06-10T08:00:00Z', content: 'See the real campus before you decide.' },
  { id: 'cms2', key: 'faq.refunds', type: 'FAQ', title: 'When am I charged?', published: true, updatedAt: '2026-06-08T08:00:00Z', content: 'Your card is authorized at request and only charged when a guide accepts.' },
  { id: 'cms3', key: 'faq.safety', type: 'FAQ', title: 'Are guides verified?', published: true, updatedAt: '2026-06-08T08:00:00Z', content: 'Every guide is identity- and enrollment-checked before they can host.' },
  { id: 'cms4', key: 'page.trust-safety', type: 'PAGE', title: 'Trust & Safety', published: true, updatedAt: '2026-05-30T08:00:00Z', content: 'Our pillars: verification, secure payments, and masked contact details.' },
  { id: 'cms5', key: 'testimonial.karen', type: 'TESTIMONIAL', title: 'Karen D. — parent', published: false, updatedAt: '2026-06-12T08:00:00Z', content: 'The student guide answered questions the official tour never could.' },
];

// ─────────────────────────────────────────────────────────── Notification templates
export interface NotificationTemplate {
  id: string;
  key: string;
  channel: 'EMAIL' | 'PUSH';
  subject: string;
  body: string;
  updatedAt: string;
}

export const templates: NotificationTemplate[] = [
  { id: 'nt1', key: 'booking.accepted', channel: 'EMAIL', subject: 'Your tour is confirmed 🎉', body: 'Hi {{buyer}}, {{guide}} accepted your {{service}} at {{school}} on {{date}}.', updatedAt: '2026-06-01T08:00:00Z' },
  { id: 'nt2', key: 'booking.requested', channel: 'PUSH', subject: 'New tour request', body: '{{buyer}} requested a {{service}} — respond within {{window}}.', updatedAt: '2026-06-01T08:00:00Z' },
  { id: 'nt3', key: 'application.approved', channel: 'EMAIL', subject: "You're approved to host!", body: 'Congratulations {{applicant}} — your guide application was approved.', updatedAt: '2026-05-20T08:00:00Z' },
  { id: 'nt4', key: 'payout.recorded', channel: 'EMAIL', subject: 'A payout is on its way', body: 'Hi {{guide}}, a payout of {{amount}} was recorded via {{method}}.', updatedAt: '2026-05-18T08:00:00Z' },
];

// ─────────────────────────────────────────────────────────── Push campaigns
export interface PushCampaign {
  id: string;
  title: string;
  segment: 'ALL' | 'BUYERS' | 'GUIDES';
  body: string;
  status: 'SENT' | 'SCHEDULED' | 'DRAFT';
  scheduledAt?: string;
  sentAt?: string;
  reach: number;
}

export const campaigns: PushCampaign[] = [
  { id: 'pc1', title: 'Summer tour season is here', segment: 'BUYERS', body: 'Book a private campus tour before fall visits fill up.', status: 'SENT', sentAt: '2026-06-01T15:00:00Z', reach: 8421 },
  { id: 'pc2', title: 'Earnings doubled this month', segment: 'GUIDES', body: 'Demand is high — open more slots to earn more.', status: 'SCHEDULED', scheduledAt: '2026-06-20T15:00:00Z', reach: 0 },
  { id: 'pc3', title: 'New universities added', segment: 'ALL', body: 'Explore guides at 6 new campuses.', status: 'DRAFT', reach: 0 },
];

// ─────────────────────────────────────────────────────────── App config
export interface AppConfig {
  minSupportedVersion: string;
  forceUpdateMessage: string;
  maintenanceMode: boolean;
  maintenanceBanner: string;
  featureFlags: { key: string; label: string; enabled: boolean; desc: string }[];
}

export const appConfig: AppConfig = {
  minSupportedVersion: '1.4.0',
  forceUpdateMessage: 'A new version is required to keep booking secure. Please update to continue.',
  maintenanceMode: false,
  maintenanceBanner: 'Scheduled maintenance Sunday 2–4am ET. Bookings may be briefly unavailable.',
  featureFlags: [
    { key: 'video_consultations', label: 'Video consultations', enabled: true, desc: 'Allow guides to offer live video sessions.' },
    { key: 'instant_book', label: 'Instant book', enabled: false, desc: 'Skip request/accept for trusted guides.' },
    { key: 'gift_cards', label: 'Gift cards', enabled: false, desc: 'Enable purchasable gift cards (Phase 2).' },
    { key: 'multi_currency', label: 'Multi-currency', enabled: false, desc: 'Show prices in local currency.' },
  ],
};

// ─────────────────────────────────────────────────────────── Admins & audit
export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INVITED' | 'DISABLED';
  lastActiveAt: string;
  avatar?: string;
}

export const adminAccounts: AdminAccount[] = [
  { id: 'ad1', name: 'Asad Naeem', email: 'asadnaeem8@gmail.com', status: 'ACTIVE', lastActiveAt: '2026-06-15T14:30:00Z', avatar: 'https://i.pravatar.cc/150?img=68' },
];

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  ip: string;
  createdAt: string;
}

export const auditLogs: AuditLog[] = [
  { id: 'al9001', actor: 'Alex Morgan', action: 'commission.update', entity: 'settings/commission → 25%', ip: '10.0.4.12', createdAt: '2026-06-15T13:40:00Z' },
  { id: 'al9000', actor: 'Jamie Rivera', action: 'application.approve', entity: 'applications/app4 (Diego Ramos)', ip: '10.0.4.31', createdAt: '2026-06-15T11:05:00Z' },
  { id: 'al8999', actor: 'Jamie Rivera', action: 'refund.issue', entity: 'bookings/bk1037 → $60.00', ip: '10.0.4.31', createdAt: '2026-06-12T13:00:00Z' },
  { id: 'al8998', actor: 'Riley Chen', action: 'user.suspend', entity: 'users/u7 (Wei Lin)', ip: '10.0.4.50', createdAt: '2026-06-11T15:20:00Z' },
  { id: 'al8997', actor: 'Alex Morgan', action: 'payout.record', entity: 'payouts/po501 → Maya Robinson $300.00', ip: '10.0.4.12', createdAt: '2026-06-01T10:00:00Z' },
  { id: 'al8996', actor: 'Sam Patel', action: 'review.hide', entity: 'reviews/rv698 (spam)', ip: '10.0.4.33', createdAt: '2026-06-06T18:05:00Z' },
  { id: 'al8995', actor: 'Jamie Rivera', action: 'listing.disable', entity: 'listings/l6 (UT Austin)', ip: '10.0.4.31', createdAt: '2026-06-05T09:30:00Z' },
];

// ─────────────────────────────────────────────────────────── Dashboard aggregates
export const dashboardStats = {
  grossRevenueCents: 184_250_0,
  commissionCents: 46_062_0,
  bookingsTotal: 1042,
  activeGuides: 281,
  pendingApplications: applications.filter((a) => a.status === 'PENDING').length,
  pendingPayoutsCents: guideBalances.reduce((s, g) => s + g.balanceCents, 0),
  revenueSeries: [
    { month: 'Jan', gross: 98_000, commission: 24_500 },
    { month: 'Feb', gross: 112_000, commission: 28_000 },
    { month: 'Mar', gross: 134_000, commission: 33_500 },
    { month: 'Apr', gross: 151_000, commission: 37_750 },
    { month: 'May', gross: 168_000, commission: 42_000 },
    { month: 'Jun', gross: 184_250, commission: 46_062 },
  ],
  bookingsByStatus: [
    { status: 'Completed', count: 712 },
    { status: 'Upcoming', count: 184 },
    { status: 'Requested', count: 64 },
    { status: 'Declined', count: 42 },
    { status: 'Expired', count: 26 },
    { status: 'Cancelled', count: 14 },
  ],
  topSchools: schools.filter((s) => s.enabled).slice(0, 5).map((s) => ({ name: s.name, bookings: s.bookings })),
};
