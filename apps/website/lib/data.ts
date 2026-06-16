// Mock content for the marketing/discovery surfaces. In production these are served by
// the backend CMS + search API via @ucpt/sdk. Shapes mirror the documented domain model.

export type ServiceType = 'CAMPUS_TOUR' | 'VIDEO_CONSULTATION';

export interface University {
  slug: string;
  name: string;
  location: string;
  state: string;
  accent: string; // brand tint for cards
  ambassadors: number;
  toursFrom: number; // cents
  rating: number;
  reviews: number;
  tags: string[];
  blurb: string;
}

export interface Ambassador {
  id: string;
  name: string;
  university: string;
  universitySlug: string;
  major: string;
  gradYear: number;
  rating: number;
  reviews: number;
  toursGiven: number;
  priceFrom: number; // cents
  services: ServiceType[];
  languages: string[];
  verified: boolean;
  responseTime: string;
  bio: string;
  interests: string[];
  avatar?: string; // profile photo URL (placeholder for now; wire to real uploads later)
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  rating: number;
}

export const universities: University[] = [
  { slug: 'stanford', name: 'Stanford University', location: 'Stanford, CA', state: 'California', accent: '#7a1a32', ambassadors: 48, toursFrom: 6500, rating: 4.9, reviews: 312, tags: ['Engineering', 'Business', 'Pre-Med'], blurb: 'Walk Palm Drive and the Main Quad with students living it every day.' },
  { slug: 'harvard', name: 'Harvard University', location: 'Cambridge, MA', state: 'Massachusetts', accent: '#6b1521', ambassadors: 53, toursFrom: 7000, rating: 4.9, reviews: 401, tags: ['Law', 'Liberal Arts', 'Research'], blurb: 'From Harvard Yard to the river houses with insider perspective.' },
  { slug: 'ucla', name: 'UCLA', location: 'Los Angeles, CA', state: 'California', accent: '#7a1a32', ambassadors: 61, toursFrom: 5000, rating: 4.8, reviews: 287, tags: ['Film', 'Athletics', 'Sciences'], blurb: 'Royce Hall, Bruin Walk, and the real LA student experience.' },
  { slug: 'nyu', name: 'New York University', location: 'New York, NY', state: 'New York', accent: '#6b1521', ambassadors: 44, toursFrom: 6000, rating: 4.7, reviews: 219, tags: ['Arts', 'Finance', 'Tech'], blurb: 'A campus woven into the city — explore it like a local.' },
  { slug: 'umich', name: 'University of Michigan', location: 'Ann Arbor, MI', state: 'Michigan', accent: '#7a1a32', ambassadors: 39, toursFrom: 4500, rating: 4.8, reviews: 176, tags: ['Engineering', 'Public Health', 'Sports'], blurb: 'The Diag, the Big House, and a classic college town.' },
  { slug: 'utexas', name: 'UT Austin', location: 'Austin, TX', state: 'Texas', accent: '#6b1521', ambassadors: 36, toursFrom: 4000, rating: 4.8, reviews: 154, tags: ['CS', 'Business', 'Music'], blurb: 'Hook ’em — the Tower, the Drag, and Austin energy.' },
];

export const ambassadors: Ambassador[] = [
  { id: 'a1', name: 'Maya Robinson', university: 'Stanford University', universitySlug: 'stanford', major: 'Computer Science', gradYear: 2026, rating: 5.0, reviews: 64, toursGiven: 81, priceFrom: 6500, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English', 'Spanish'], verified: true, responseTime: 'within 2 hours', bio: 'CS junior who runs the largest student tour club on campus. I love showing families the parts of Stanford the official tours skip.', interests: ['AI research', 'A cappella', 'Rock climbing'], avatar: 'https://i.pravatar.cc/300?img=47' },
  { id: 'a2', name: 'Daniel Okafor', university: 'Harvard University', universitySlug: 'harvard', major: 'Economics', gradYear: 2025, rating: 4.9, reviews: 52, toursGiven: 70, priceFrom: 7000, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English', 'French'], verified: true, responseTime: 'within 1 hour', bio: 'Senior economist and house tour guide. Ask me anything about admissions, financial aid, and the house system.', interests: ['Debate', 'Investing', 'Photography'], avatar: 'https://i.pravatar.cc/300?img=12' },
  { id: 'a3', name: 'Sofia Martinez', university: 'UCLA', universitySlug: 'ucla', major: 'Film & Television', gradYear: 2026, rating: 4.9, reviews: 47, toursGiven: 58, priceFrom: 5000, services: ['CAMPUS_TOUR'], languages: ['English', 'Spanish'], verified: true, responseTime: 'within 3 hours', bio: 'Film student and lifelong Angeleno. I make every tour feel like a behind-the-scenes set visit.', interests: ['Screenwriting', 'Surfing', 'Coffee'], avatar: 'https://i.pravatar.cc/300?img=45' },
  { id: 'a4', name: 'Aiden Chen', university: 'New York University', universitySlug: 'nyu', major: 'Finance', gradYear: 2025, rating: 4.8, reviews: 39, toursGiven: 44, priceFrom: 6000, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English', 'Mandarin'], verified: true, responseTime: 'within 2 hours', bio: 'Stern finance senior. I show families how to navigate a campus that is the entire city.', interests: ['Markets', 'Street food', 'Jazz'], avatar: 'https://i.pravatar.cc/300?img=33' },
  { id: 'a5', name: 'Priya Nair', university: 'University of Michigan', universitySlug: 'umich', major: 'Biomedical Engineering', gradYear: 2026, rating: 5.0, reviews: 41, toursGiven: 49, priceFrom: 4500, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English', 'Hindi'], verified: true, responseTime: 'within 1 hour', bio: 'BME junior and orientation leader. I help pre-med and engineering families picture life in Ann Arbor.', interests: ['Research', 'Hockey', 'Baking'], avatar: 'https://i.pravatar.cc/300?img=44' },
  { id: 'a6', name: 'Jordan Blake', university: 'UT Austin', universitySlug: 'utexas', major: 'Computer Science', gradYear: 2025, rating: 4.9, reviews: 36, toursGiven: 42, priceFrom: 4000, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English'], verified: true, responseTime: 'within 4 hours', bio: 'CS senior and longhorn through and through. Real talk on dorms, dining, and the Austin scene.', interests: ['Startups', 'Live music', 'BBQ'], avatar: 'https://i.pravatar.cc/300?img=15' },
];

export const testimonials: Testimonial[] = [
  { id: 't1', quote: 'Our daughter finally pictured herself on campus. The student guide answered the questions the official tour never could — worth every penny.', name: 'Karen D.', role: 'Parent of a high-school senior', rating: 5 },
  { id: 't2', quote: 'I booked a video consultation before flying out. By the time we visited in person, we already knew where we wanted to live and study.', name: 'Marcus T.', role: 'Transfer applicant', rating: 5 },
  { id: 't3', quote: 'Transparent pricing, a verified student, and a genuinely warm tour. This is how campus visits should work.', name: 'The Alvarez Family', role: 'Visited 3 campuses', rating: 5 },
  { id: 't4', quote: 'As an international family, the language match made everything easier. Our guide felt like a friend showing us around.', name: 'Wei L.', role: 'International parent', rating: 5 },
];

export const services = [
  {
    type: 'CAMPUS_TOUR' as const,
    title: 'Private Campus Tour',
    blurb: 'A 1:1 walking tour led by a current student, tailored to your interests and timeline.',
    points: ['Dorms, dining & study spots', 'Honest admissions insight', 'Flexible scheduling'],
  },
  {
    type: 'VIDEO_CONSULTATION' as const,
    title: 'Video Consultation',
    blurb: 'A live video call from anywhere — perfect before you commit to a flight or between visits.',
    points: ['Screen-shared campus map', 'Q&A on majors & life', 'Recorded notes to keep'],
  },
];

export const stats = [
  { value: 50, suffix: '+', label: 'Partner universities' },
  { value: 1200, suffix: '+', label: 'Verified student guides' },
  { value: 18000, suffix: '+', label: 'Tours & consultations' },
  { value: 4.9, suffix: '/5', label: 'Average guide rating', decimals: 1 },
];

export const faqs = [
  { q: 'How are student guides verified?', a: 'Every ambassador submits proof of current enrollment, which our team reviews before approval. Verified guides display a badge, and identity documents are never shared publicly.' },
  { q: 'When am I charged for a booking?', a: 'You are only charged when a guide accepts your request. We place a temporary authorization at checkout and capture it on acceptance — if the guide declines or the request expires, nothing is charged.' },
  { q: 'What is your cancellation policy?', a: 'Full refund if you cancel at least 24 hours before the start time. Within 24 hours bookings are non-refundable, and if a guide cancels you always receive a full refund.' },
  { q: 'Can I message a guide before booking?', a: 'Yes. You can chat 1:1 with a guide from the moment you send a request. Contact details stay masked until a booking is accepted for everyone’s safety.' },
  { q: 'Do you offer virtual tours?', a: 'Absolutely. Choose a video consultation to explore a campus live from anywhere, with a screen-shared map and a recording you can keep.' },
  { q: 'Is this affiliated with the universities?', a: 'No. We are an independent marketplace connecting families with current students. Tours reflect authentic student perspectives, not official university messaging.' },
];

export const howItWorks = [
  { step: '01', title: 'Discover a campus', body: 'Search 50+ universities and browse verified student guides by major, language, price, and rating.' },
  { step: '02', title: 'Book in minutes', body: 'Pick a private tour or video consultation, choose a time, and request your guide. You’re only charged on acceptance.' },
  { step: '03', title: 'Experience it for real', body: 'Meet on campus or over video for an honest, personalized look — then review your guide and plan your next visit.' },
];

export function findUniversity(slug: string) {
  return universities.find((u) => u.slug === slug);
}
export function findAmbassador(id: string) {
  return ambassadors.find((a) => a.id === id);
}
export function ambassadorsForUniversity(slug: string) {
  return ambassadors.filter((a) => a.universitySlug === slug);
}
