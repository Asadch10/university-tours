// Mock content for the marketing/discovery surfaces. In production these are served by
// the backend CMS + search API via @ucpt/sdk. Shapes mirror the documented domain model.

export type ServiceType = 'CAMPUS_TOUR' | 'VIDEO_CONSULTATION';

export interface University {
  slug: string;
  name: string;
  location: string;
  state: string;
  accent: string; // brand tint for cards
  image: string; // campus banner/hero photo
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
  { slug: 'stanford', name: 'Stanford University', location: 'Stanford, CA', state: 'California', accent: '#7a1a32', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Stanford_University_campus_in_2016.jpg/1280px-Stanford_University_campus_in_2016.jpg', ambassadors: 48, toursFrom: 6500, rating: 4.9, reviews: 312, tags: ['Engineering', 'Business', 'Pre-Med'], blurb: 'Walk Palm Drive and the Main Quad with students living it every day.' },
  { slug: 'harvard', name: 'Harvard University', location: 'Cambridge, MA', state: 'Massachusetts', accent: '#6b1521', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg/1280px-Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg', ambassadors: 53, toursFrom: 7000, rating: 4.9, reviews: 401, tags: ['Law', 'Liberal Arts', 'Research'], blurb: 'From Harvard Yard to the river houses with insider perspective.' },
  { slug: 'ucla', name: 'UCLA', location: 'Los Angeles, CA', state: 'California', accent: '#7a1a32', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/2019_UCLA_Royce_Hall_1.jpg/1280px-2019_UCLA_Royce_Hall_1.jpg', ambassadors: 61, toursFrom: 5000, rating: 4.8, reviews: 287, tags: ['Film', 'Athletics', 'Sciences'], blurb: 'Royce Hall, Bruin Walk, and the real LA student experience.' },
  { slug: 'nyu', name: 'New York University', location: 'New York, NY', state: 'New York', accent: '#6b1521', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Washington_Square_Park_in_2012.jpg/1280px-Washington_Square_Park_in_2012.jpg', ambassadors: 44, toursFrom: 6000, rating: 4.7, reviews: 219, tags: ['Arts', 'Finance', 'Tech'], blurb: 'A campus woven into the city — explore it like a local.' },
  { slug: 'umich', name: 'University of Michigan', location: 'Ann Arbor, MI', state: 'Michigan', accent: '#7a1a32', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/University_of_Michigan_Museum_of_Art%2C_University_of_Michigan%2C_State_Street_and_University_Avenue%2C_Ann_Arbor%2C_MI.jpg/1280px-University_of_Michigan_Museum_of_Art%2C_University_of_Michigan%2C_State_Street_and_University_Avenue%2C_Ann_Arbor%2C_MI.jpg', ambassadors: 39, toursFrom: 4500, rating: 4.8, reviews: 176, tags: ['Engineering', 'Public Health', 'Sports'], blurb: 'The Diag, the Big House, and a classic college town.' },
  { slug: 'utexas', name: 'UT Austin', location: 'Austin, TX', state: 'Texas', accent: '#6b1521', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/University_of_texas_at_austin_main_building_2014.jpg/1280px-University_of_texas_at_austin_main_building_2014.jpg', ambassadors: 36, toursFrom: 4000, rating: 4.8, reviews: 154, tags: ['CS', 'Business', 'Music'], blurb: 'Hook ’em — the Tower, the Drag, and Austin energy.' },
  { slug: 'berkeley', name: 'UC Berkeley', location: 'Berkeley, CA', state: 'California', accent: '#6b1521', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg/1280px-Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg', ambassadors: 45, toursFrom: 5500, rating: 4.8, reviews: 263, tags: ['Engineering', 'Sciences', 'Business'], blurb: 'Sather Gate, the Campanile, and Bay Area energy with a Golden Bear.' },
  { slug: 'usc', name: 'University of Southern California', location: 'Los Angeles, CA', state: 'California', accent: '#7a1a32', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/2019_UCLA_Royce_Hall_1.jpg/1280px-2019_UCLA_Royce_Hall_1.jpg', ambassadors: 42, toursFrom: 5800, rating: 4.7, reviews: 198, tags: ['Film', 'Business', 'Engineering'], blurb: 'Explore USC Village and the Trojan campus with an insider.' },
  { slug: 'columbia', name: 'Columbia University', location: 'New York, NY', state: 'New York', accent: '#6b1521', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Washington_Square_Park_in_2012.jpg/1280px-Washington_Square_Park_in_2012.jpg', ambassadors: 47, toursFrom: 6800, rating: 4.8, reviews: 241, tags: ['Journalism', 'Pre-Med', 'Liberal Arts'], blurb: 'Low Library steps and Morningside Heights, through a student’s eyes.' },
  { slug: 'cornell', name: 'Cornell University', location: 'Ithaca, NY', state: 'New York', accent: '#7a1a32', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/University_of_Michigan_Museum_of_Art%2C_University_of_Michigan%2C_State_Street_and_University_Avenue%2C_Ann_Arbor%2C_MI.jpg/1280px-University_of_Michigan_Museum_of_Art%2C_University_of_Michigan%2C_State_Street_and_University_Avenue%2C_Ann_Arbor%2C_MI.jpg', ambassadors: 38, toursFrom: 5200, rating: 4.8, reviews: 167, tags: ['Engineering', 'Agriculture', 'Hotel'], blurb: 'Gorges, the Arts Quad, and a true college-town experience.' },
  { slug: 'mit', name: 'MIT', location: 'Cambridge, MA', state: 'Massachusetts', accent: '#6b1521', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Stanford_University_campus_in_2016.jpg/1280px-Stanford_University_campus_in_2016.jpg', ambassadors: 51, toursFrom: 7200, rating: 4.9, reviews: 333, tags: ['Engineering', 'CS', 'Research'], blurb: 'The Infinite Corridor and the Great Dome with a current maker.' },
  { slug: 'bu', name: 'Boston University', location: 'Boston, MA', state: 'Massachusetts', accent: '#7a1a32', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg/1280px-Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg', ambassadors: 40, toursFrom: 4800, rating: 4.7, reviews: 142, tags: ['Communications', 'Business', 'Sciences'], blurb: 'Commonwealth Ave and the Charles River, the real BU way.' },
  { slug: 'tamu', name: 'Texas A&M University', location: 'College Station, TX', state: 'Texas', accent: '#6b1521', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/University_of_texas_at_austin_main_building_2014.jpg/1280px-University_of_texas_at_austin_main_building_2014.jpg', ambassadors: 34, toursFrom: 3800, rating: 4.8, reviews: 129, tags: ['Engineering', 'Agriculture', 'Business'], blurb: 'Kyle Field and Aggie traditions with a current student.' },
  { slug: 'rice', name: 'Rice University', location: 'Houston, TX', state: 'Texas', accent: '#7a1a32', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/2019_UCLA_Royce_Hall_1.jpg/1280px-2019_UCLA_Royce_Hall_1.jpg', ambassadors: 31, toursFrom: 5000, rating: 4.9, reviews: 118, tags: ['Sciences', 'Engineering', 'Architecture'], blurb: 'The residential colleges and live-oak quads, up close.' },
  { slug: 'ufl', name: 'University of Florida', location: 'Gainesville, FL', state: 'Florida', accent: '#6b1521', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Washington_Square_Park_in_2012.jpg/1280px-Washington_Square_Park_in_2012.jpg', ambassadors: 37, toursFrom: 3500, rating: 4.7, reviews: 151, tags: ['Sciences', 'Business', 'Journalism'], blurb: 'The Swamp, Century Tower, and Gator life with a local guide.' },
  { slug: 'miami', name: 'University of Miami', location: 'Coral Gables, FL', state: 'Florida', accent: '#7a1a32', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/University_of_Michigan_Museum_of_Art%2C_University_of_Michigan%2C_State_Street_and_University_Avenue%2C_Ann_Arbor%2C_MI.jpg/1280px-University_of_Michigan_Museum_of_Art%2C_University_of_Michigan%2C_State_Street_and_University_Avenue%2C_Ann_Arbor%2C_MI.jpg', ambassadors: 33, toursFrom: 4200, rating: 4.7, reviews: 124, tags: ['Marine Science', 'Business', 'Music'], blurb: 'Palm-lined Coral Gables and Lake Osceola, the Cane way.' },
  { slug: 'northwestern', name: 'Northwestern University', location: 'Evanston, IL', state: 'Illinois', accent: '#6b1521', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Stanford_University_campus_in_2016.jpg/1280px-Stanford_University_campus_in_2016.jpg', ambassadors: 39, toursFrom: 5600, rating: 4.8, reviews: 173, tags: ['Journalism', 'Engineering', 'Theatre'], blurb: 'Lakefill views and the Evanston campus with a current Wildcat.' },
  { slug: 'uchicago', name: 'University of Chicago', location: 'Chicago, IL', state: 'Illinois', accent: '#7a1a32', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg/1280px-Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg', ambassadors: 36, toursFrom: 6200, rating: 4.8, reviews: 156, tags: ['Economics', 'Sciences', 'Liberal Arts'], blurb: 'Gothic quads and the life of the mind in Hyde Park.' },
];

export const ambassadors: Ambassador[] = [
  { id: 'a1', name: 'Maya Robinson', university: 'Stanford University', universitySlug: 'stanford', major: 'Computer Science', gradYear: 2026, rating: 5.0, reviews: 64, toursGiven: 81, priceFrom: 6500, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English', 'Spanish'], verified: true, responseTime: 'within 2 hours', bio: 'CS junior who runs the largest student tour club on campus. I love showing families the parts of Stanford the official tours skip.', interests: ['AI research', 'A cappella', 'Rock climbing'], avatar: 'https://i.pravatar.cc/300?img=47' },
  { id: 'a2', name: 'Daniel Okafor', university: 'Harvard University', universitySlug: 'harvard', major: 'Economics', gradYear: 2025, rating: 4.9, reviews: 52, toursGiven: 70, priceFrom: 7000, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English', 'French'], verified: true, responseTime: 'within 1 hour', bio: 'Senior economist and house tour guide. Ask me anything about admissions, financial aid, and the house system.', interests: ['Debate', 'Investing', 'Photography'], avatar: 'https://i.pravatar.cc/300?img=12' },
  { id: 'a3', name: 'Sofia Martinez', university: 'UCLA', universitySlug: 'ucla', major: 'Film & Television', gradYear: 2026, rating: 4.9, reviews: 47, toursGiven: 58, priceFrom: 5000, services: ['CAMPUS_TOUR'], languages: ['English', 'Spanish'], verified: true, responseTime: 'within 3 hours', bio: 'Film student and lifelong Angeleno. I make every tour feel like a behind-the-scenes set visit.', interests: ['Screenwriting', 'Surfing', 'Coffee'], avatar: 'https://i.pravatar.cc/300?img=45' },
  { id: 'a4', name: 'Aiden Chen', university: 'New York University', universitySlug: 'nyu', major: 'Finance', gradYear: 2025, rating: 4.8, reviews: 39, toursGiven: 44, priceFrom: 6000, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English', 'Mandarin'], verified: true, responseTime: 'within 2 hours', bio: 'Stern finance senior. I show families how to navigate a campus that is the entire city.', interests: ['Markets', 'Street food', 'Jazz'], avatar: 'https://i.pravatar.cc/300?img=33' },
  { id: 'a5', name: 'Priya Nair', university: 'University of Michigan', universitySlug: 'umich', major: 'Biomedical Engineering', gradYear: 2026, rating: 5.0, reviews: 41, toursGiven: 49, priceFrom: 4500, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English', 'Hindi'], verified: true, responseTime: 'within 1 hour', bio: 'BME junior and orientation leader. I help pre-med and engineering families picture life in Ann Arbor.', interests: ['Research', 'Hockey', 'Baking'], avatar: 'https://i.pravatar.cc/300?img=44' },
  { id: 'a6', name: 'Jordan Blake', university: 'UT Austin', universitySlug: 'utexas', major: 'Computer Science', gradYear: 2025, rating: 4.9, reviews: 36, toursGiven: 42, priceFrom: 4000, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English'], verified: true, responseTime: 'within 4 hours', bio: 'CS senior and longhorn through and through. Real talk on dorms, dining, and the Austin scene.', interests: ['Startups', 'Live music', 'BBQ'], avatar: 'https://i.pravatar.cc/300?img=15' },
  { id: 'a7', name: 'Olivia Bennett', university: 'UC Berkeley', universitySlug: 'berkeley', major: 'Data Science', gradYear: 2026, rating: 4.9, reviews: 43, toursGiven: 55, priceFrom: 5500, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English', 'Mandarin'], verified: true, responseTime: 'within 2 hours', bio: 'Data science junior and campus tour lead. I show families the real Berkeley — from Memorial Glade to the best study cafés.', interests: ['Coding', 'Hiking', 'Coffee'], avatar: 'https://i.pravatar.cc/300?img=5' },
  { id: 'a8', name: 'Marcus Reed', university: 'University of Southern California', universitySlug: 'usc', major: 'Business Administration', gradYear: 2025, rating: 4.8, reviews: 38, toursGiven: 46, priceFrom: 5800, services: ['CAMPUS_TOUR'], languages: ['English'], verified: true, responseTime: 'within 3 hours', bio: 'Marshall senior and proud Trojan. Ask me about the alumni network, USC Village, and game-day traditions.', interests: ['Entrepreneurship', 'Basketball', 'Film'], avatar: 'https://i.pravatar.cc/300?img=60' },
  { id: 'a9', name: 'Hannah Cohen', university: 'Columbia University', universitySlug: 'columbia', major: 'Journalism', gradYear: 2026, rating: 5.0, reviews: 49, toursGiven: 61, priceFrom: 6800, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English', 'Hebrew'], verified: true, responseTime: 'within 1 hour', bio: 'Journalism student who knows every corner of Morningside Heights. I make NYC feel like home for visiting families.', interests: ['Writing', 'Theatre', 'Museums'], avatar: 'https://i.pravatar.cc/300?img=32' },
  { id: 'a10', name: 'Ethan Walsh', university: 'Cornell University', universitySlug: 'cornell', major: 'Hotel Administration', gradYear: 2025, rating: 4.8, reviews: 34, toursGiven: 40, priceFrom: 5200, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English'], verified: true, responseTime: 'within 4 hours', bio: 'Hotelie senior and orientation guide. I cover the gorges, the quads, and what life in Ithaca is really like.', interests: ['Cooking', 'Skiing', 'Travel'], avatar: 'https://i.pravatar.cc/300?img=16' },
  { id: 'a11', name: 'Aisha Khan', university: 'MIT', universitySlug: 'mit', major: 'Mechanical Engineering', gradYear: 2026, rating: 5.0, reviews: 57, toursGiven: 72, priceFrom: 7200, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English', 'Urdu'], verified: true, responseTime: 'within 1 hour', bio: 'MechE junior and maker-space mentor. I love showing prospective students the labs, the hacks, and the dorm culture.', interests: ['Robotics', 'Rowing', 'Sketching'], avatar: 'https://i.pravatar.cc/300?img=13' },
  { id: 'a12', name: 'Tyler Brooks', university: 'University of Florida', universitySlug: 'ufl', major: 'Marketing', gradYear: 2025, rating: 4.7, reviews: 29, toursGiven: 35, priceFrom: 3500, services: ['CAMPUS_TOUR'], languages: ['English', 'Spanish'], verified: true, responseTime: 'within 3 hours', bio: 'Born-and-raised Gator. From the Swamp to Midtown, I show families the full Gainesville experience.', interests: ['Football', 'Fishing', 'Photography'], avatar: 'https://i.pravatar.cc/300?img=9' },
  { id: 'a13', name: 'Grace Sullivan', university: 'Northwestern University', universitySlug: 'northwestern', major: 'Theatre', gradYear: 2026, rating: 4.9, reviews: 41, toursGiven: 50, priceFrom: 5600, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English'], verified: true, responseTime: 'within 2 hours', bio: 'Theatre major and Lakefill regular. I help families picture life along Lake Michigan with a Wildcat’s perspective.', interests: ['Acting', 'Sailing', 'Improv'], avatar: 'https://i.pravatar.cc/300?img=25' },
  { id: 'a14', name: 'Noah Feldman', university: 'University of Chicago', universitySlug: 'uchicago', major: 'Economics', gradYear: 2025, rating: 4.8, reviews: 37, toursGiven: 44, priceFrom: 6200, services: ['CAMPUS_TOUR', 'VIDEO_CONSULTATION'], languages: ['English', 'German'], verified: true, responseTime: 'within 2 hours', bio: 'Econ senior in Hyde Park. I give honest answers about the Core, the quarter system, and the life of the mind.', interests: ['Chess', 'Debate', 'Jazz'], avatar: 'https://i.pravatar.cc/300?img=52' },
  { id: 'a15', name: 'Camila Torres', university: 'Rice University', universitySlug: 'rice', major: 'Architecture', gradYear: 2026, rating: 4.9, reviews: 33, toursGiven: 39, priceFrom: 5000, services: ['CAMPUS_TOUR'], languages: ['English', 'Spanish'], verified: true, responseTime: 'within 3 hours', bio: 'Architecture student and residential-college advisor. I walk families through Rice’s quads, traditions, and Houston life.', interests: ['Design', 'Cycling', 'Coffee'], avatar: 'https://i.pravatar.cc/300?img=20' },
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

/* ─── Blog ───────────────────────────────────────────────────────────── */

export type BlogCategory = 'Admissions' | 'Schools' | 'College tours';

export interface BlogBlock {
  type: 'heading' | 'paragraph' | 'quote';
  text: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO date
  category: BlogCategory;
  image: string;
  featured?: boolean;
  author: { name: string; role: string; avatar: string };
  readMinutes: number;
  content: BlogBlock[];
}

const uImg = (slug: string) => universities.find((u) => u.slug === slug)?.image ?? universities[0]!.image;

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-tour-colleges-on-weekends-holidays-and-school-breaks',
    title: 'How to Tour Colleges on Weekends, Holidays, and School Breaks',
    excerpt:
      'Official tours often run only on weekdays — but your family’s free time doesn’t. Here’s how to see a campus for real when it fits your schedule.',
    date: '2026-05-01',
    category: 'College tours',
    image: uImg('cornell'),
    featured: true,
    author: { name: 'Hannah Cohen', role: 'Student guide, Columbia University', avatar: 'https://i.pravatar.cc/120?img=32' },
    readMinutes: 6,
    content: [
      { type: 'paragraph', text: 'Most families discover the same frustrating truth when they start planning college visits: official admissions tours almost always happen mid-week, during business hours, exactly when students are in school and parents are at work. If you can only travel on weekends, holidays, or breaks, it can feel like the door is closed.' },
      { type: 'paragraph', text: 'It isn’t. A private, student-led tour can happen whenever a current student is free — including Saturdays, Sundays, and the long stretches of winter and spring break when campuses are quieter and easier to actually see.' },
      { type: 'heading', text: 'Why off-peak visits can be better' },
      { type: 'paragraph', text: 'Touring on a weekend or break means smaller crowds, more time to ask questions, and a guide who isn’t rushing forty strangers to the next building. You get to linger in the dining hall, walk through a real dorm, and talk honestly about what the school is like the other 51 weeks of the year.' },
      { type: 'quote', text: 'The best visit I ever gave was on a Sunday in December — no crowds, and the family had two full hours to ask everything they were afraid to ask on the official tour.' },
      { type: 'heading', text: 'How to plan one' },
      { type: 'paragraph', text: 'Start by booking a student guide who actually attends the school and matches your interests. Share what matters most — academics, housing, dining, safety, social life — so the tour is built around your questions instead of a script. Then pick a time that works for you, not just the admissions office.' },
      { type: 'paragraph', text: 'A campus is a place you’ll live for four years. You deserve to see it on your own schedule, at your own pace, through the eyes of someone who’s already there.' },
    ],
  },
  {
    slug: 'smartest-sat-and-essay-advice-talk-to-a-student-who-already-got-in',
    title: 'The Smartest SAT & Essay Advice? Talk to a Student Who Already Got In.',
    excerpt:
      'Prep books and paid consultants have their place — but the sharpest, most current advice often comes from someone who did it last year.',
    date: '2026-05-20',
    category: 'Admissions',
    image: uImg('harvard'),
    author: { name: 'Daniel Okafor', role: 'Student guide, Harvard University', avatar: 'https://i.pravatar.cc/120?img=12' },
    readMinutes: 5,
    content: [
      { type: 'paragraph', text: 'When it comes to standardized tests and application essays, families spend thousands on tutors and consultants. That advice can be valuable — but it’s often a few years out of date, and it rarely reflects what a specific school is actually looking for right now.' },
      { type: 'heading', text: 'Current students know the current bar' },
      { type: 'paragraph', text: 'A student who got in last cycle knows which score ranges are realistic, how the essay prompts really read to an admissions reader, and what made their own application stand out. That perspective is fresh, specific, and free of the sales pressure that comes with paid packages.' },
      { type: 'quote', text: 'Nobody told me my essay could be about something small. A current student did — and that’s the essay that got me in.' },
      { type: 'heading', text: 'Questions worth asking' },
      { type: 'paragraph', text: 'Ask a guide what they wish they’d known about the SAT, how many drafts their essay went through, and which extracurriculars actually mattered. You’ll walk away with grounded, honest guidance you can trust.' },
    ],
  },
  {
    slug: 'why-every-student-benefits-from-a-college-counselor',
    title: 'Why Every Student Benefits from a College Counselor',
    excerpt:
      'A great counselor turns an overwhelming process into a clear plan. Here’s what they do — and how student guides fill the gaps.',
    date: '2026-04-24',
    category: 'Admissions',
    image: uImg('uchicago'),
    author: { name: 'Olivia Bennett', role: 'Student guide, UC Berkeley', avatar: 'https://i.pravatar.cc/120?img=5' },
    readMinutes: 5,
    content: [
      { type: 'paragraph', text: 'The college search is one of the biggest decisions a family makes, and it arrives with deadlines, jargon, and more options than anyone can reasonably track. A good counselor brings order to that chaos.' },
      { type: 'heading', text: 'What a counselor actually does' },
      { type: 'paragraph', text: 'They help you build a balanced school list, keep application timelines on track, and translate financial aid letters into plain English. Most importantly, they help you figure out what you actually want out of the next four years.' },
      { type: 'heading', text: 'Where student guides come in' },
      { type: 'paragraph', text: 'Counselors give you the strategy; current students give you the ground truth. Pairing professional guidance with an honest conversation from someone living the experience is the most complete picture you can get before committing.' },
    ],
  },
  {
    slug: 'college-visit-checklist-what-to-look-for-on-campus',
    title: 'College Visit Checklist: What to Look For on Campus',
    excerpt:
      'Beyond the pretty quad, the details reveal whether a school is right for you. Use this checklist on your next visit.',
    date: '2026-04-03',
    category: 'College tours',
    image: uImg('umich'),
    author: { name: 'Priya Nair', role: 'Student guide, University of Michigan', avatar: 'https://i.pravatar.cc/120?img=44' },
    readMinutes: 7,
    content: [
      { type: 'paragraph', text: 'It’s easy to be dazzled by a manicured quad and a shiny new gym. But the things that will actually shape your four years are often the ones the official tour glosses over.' },
      { type: 'heading', text: 'Eat where students eat' },
      { type: 'paragraph', text: 'Dining halls tell you a lot. Is the food good? Is it busy at normal hours? Do people linger and talk, or grab and go? You’ll eat there hundreds of times — it matters.' },
      { type: 'heading', text: 'See a real dorm' },
      { type: 'paragraph', text: 'Not the model room. Ask your guide to show you where they actually live, and what an average room looks like. Check the laundry, the common spaces, and how far it is from class.' },
      { type: 'heading', text: 'Read the bulletin boards' },
      { type: 'paragraph', text: 'Flyers for clubs, events, and study groups are an unfiltered snapshot of campus life. If the boards are buzzing, the community usually is too.' },
      { type: 'quote', text: 'Ask your guide the one question they wish they’d asked before enrolling. The answer is always revealing.' },
    ],
  },
  {
    slug: 'student-led-vs-official-college-tours-key-differences',
    title: 'Student-Led vs Official College Tours: Key Differences',
    excerpt:
      'Both have a role — but they answer very different questions. Here’s when to take each, and why families often do both.',
    date: '2026-03-13',
    category: 'College tours',
    image: uImg('stanford'),
    author: { name: 'Maya Robinson', role: 'Student guide, Stanford University', avatar: 'https://i.pravatar.cc/120?img=47' },
    readMinutes: 6,
    content: [
      { type: 'paragraph', text: 'Official tours and private student-led tours aren’t competitors — they’re two different tools. Knowing what each does best helps you plan visits that actually inform your decision.' },
      { type: 'heading', text: 'Official tours: the overview' },
      { type: 'paragraph', text: 'Run by the admissions office, official tours are polished, informative, and great for orientation. You’ll learn the history, see the landmarks, and hear the school’s pitch. The trade-off: large groups, a fixed route, and a script designed to impress.' },
      { type: 'heading', text: 'Student-led tours: the truth' },
      { type: 'paragraph', text: 'A private tour with a current student is personal and unscripted. You choose the guide, the route bends to your questions, and you get honest answers about dorms, workload, social life, and the things brochures leave out.' },
      { type: 'quote', text: 'Take the official tour to learn the school’s story. Take a student tour to learn if it’s your story.' },
      { type: 'paragraph', text: 'The families who feel most confident on decision day usually do both — the overview first, then the honest, personalized deep dive.' },
    ],
  },
  {
    slug: 'you-got-in-now-get-the-real-scoop',
    title: 'You Got In. Now Get the Real Scoop.',
    excerpt:
      'Acceptance is the beginning, not the end. Before you commit, talk to someone who’s already living the experience.',
    date: '2025-05-01',
    category: 'Admissions',
    image: uImg('nyu'),
    author: { name: 'Aiden Chen', role: 'Student guide, New York University', avatar: 'https://i.pravatar.cc/120?img=33' },
    readMinutes: 4,
    content: [
      { type: 'paragraph', text: 'Congratulations — you got in. Maybe more than once. Now comes the decision that actually shapes your next four years, and admissions brochures aren’t going to make it for you.' },
      { type: 'heading', text: 'Ask the questions that matter now' },
      { type: 'paragraph', text: 'What’s the vibe on weekends? How hard is it to get into popular classes? Is it easy to make friends as a first-year? A current student can answer all of this honestly, in a single conversation.' },
      { type: 'quote', text: 'Deciding between two schools is so much easier after ten minutes with someone who actually goes there.' },
      { type: 'paragraph', text: 'Before you put down a deposit, get the real scoop from someone on the inside. It’s the cheapest insurance you’ll ever buy on a very big decision.' },
    ],
  },
  {
    slug: 'hail-state-private-campus-tour-mississippi-state-university',
    title: 'Hail State: What to Really Expect from a Private Campus Tour at Mississippi State University',
    excerpt:
      'Mississippi State is the kind of land-grant institution that surprises visitors. Here’s what a private, student-led tour reveals.',
    date: '2026-06-08',
    category: 'Schools',
    image: uImg('tamu'),
    author: { name: 'Jordan Blake', role: 'Student guide', avatar: 'https://i.pravatar.cc/120?img=15' },
    readMinutes: 6,
    content: [
      { type: 'paragraph', text: 'Mississippi State University is the kind of land-grant institution that surprises first-time visitors — big-hearted, spirited, and far more welcoming than its size might suggest. A private tour lets you feel that in a way a group walk never can.' },
      { type: 'heading', text: 'Traditions you’ll actually understand' },
      { type: 'paragraph', text: 'From ringing cowbells to the energy of a fall Saturday, a current student can explain the traditions that make Starkville feel like home — and why students are so fiercely loyal to them.' },
      { type: 'heading', text: 'The parts of campus that matter' },
      { type: 'paragraph', text: 'Your guide will show you the real study spots, the best dining, and the labs and buildings tied to your intended major — not just the postcard views.' },
      { type: 'quote', text: 'Hail State isn’t just a chant. Spend a day here with a student and you’ll get why people mean it.' },
    ],
  },
  {
    slug: 'bear-territory-private-campus-tour-uc-berkeley',
    title: 'Bear Territory: What to Really Expect from a Private Campus Tour at UC Berkeley',
    excerpt:
      'UC Berkeley is one of the world’s great universities — and one of its most misunderstood. A student guide cuts through the myths.',
    date: '2026-06-08',
    category: 'Schools',
    image: uImg('berkeley'),
    author: { name: 'Olivia Bennett', role: 'Student guide, UC Berkeley', avatar: 'https://i.pravatar.cc/120?img=5' },
    readMinutes: 6,
    content: [
      { type: 'paragraph', text: 'The University of California, Berkeley is one of the great universities on earth, and also one of the most misunderstood. A private tour with a current Golden Bear replaces the rumors with reality.' },
      { type: 'heading', text: 'Big school, close community' },
      { type: 'paragraph', text: 'Berkeley’s scale can look intimidating from the outside. Your guide will show you how students actually find their people — through majors, clubs, res halls, and the study cafés that become second homes.' },
      { type: 'heading', text: 'From Sather Gate to the Campanile' },
      { type: 'paragraph', text: 'You’ll see the landmarks, but more importantly you’ll learn how to navigate them: where to study, where to eat, and how to make a huge campus feel like yours.' },
      { type: 'quote', text: 'People think Berkeley is impersonal. Ten minutes with a real student and that idea falls apart.' },
    ],
  },
  {
    slug: 'hotty-toddy-private-campus-tour-university-of-mississippi',
    title: 'Hotty Toddy: What to Really Expect from a Private Campus Tour at the University of Mississippi',
    excerpt:
      'Ole Miss is famous for its charm and its traditions. A private tour shows you the community behind the reputation.',
    date: '2026-06-07',
    category: 'Schools',
    image: uImg('ufl'),
    author: { name: 'Marcus Reed', role: 'Student guide', avatar: 'https://i.pravatar.cc/120?img=60' },
    readMinutes: 5,
    content: [
      { type: 'paragraph', text: 'The University of Mississippi — Ole Miss to everyone who has ever set foot there — is famous for its charm, its traditions, and one of the most beautiful campuses in the South. A private tour reveals the community behind the reputation.' },
      { type: 'heading', text: 'The Grove and beyond' },
      { type: 'paragraph', text: 'Everyone’s heard of the Grove, but a current student will show you daily life: the classroom buildings, the libraries, the dorms, and the corners of campus where friendships are made.' },
      { type: 'heading', text: 'Honest answers about fit' },
      { type: 'paragraph', text: 'Is the social scene right for you? What’s academic life really like? Your guide gives you straight answers so you can decide with confidence.' },
      { type: 'quote', text: 'Hotty Toddy is a greeting, a cheer, and a whole culture. A student can help you feel whether it fits.' },
    ],
  },
  {
    slug: 'go-blue-private-campus-tour-university-of-michigan',
    title: 'Go Blue: What to Really Expect from a Private Campus Tour at the University of Michigan',
    excerpt:
      'Ann Arbor is a classic college town wrapped around a world-class university. Here’s the student’s-eye view of Michigan.',
    date: '2026-06-05',
    category: 'Schools',
    image: uImg('umich'),
    author: { name: 'Priya Nair', role: 'Student guide, University of Michigan', avatar: 'https://i.pravatar.cc/120?img=44' },
    readMinutes: 6,
    content: [
      { type: 'paragraph', text: 'The University of Michigan pairs a world-class academic reputation with one of the best college towns in America. A private tour lets you experience both the way students actually do.' },
      { type: 'heading', text: 'The Diag, the Big House, and the everyday' },
      { type: 'paragraph', text: 'You’ll see the landmarks that define Michigan, but your guide will also walk you through the ordinary rhythm of student life — where you’ll study, eat, and unwind between classes.' },
      { type: 'heading', text: 'A town that’s part of the school' },
      { type: 'paragraph', text: 'Ann Arbor isn’t a backdrop; it’s part of the experience. A current Wolverine will show you the cafés, bookstores, and streets that make it feel like home.' },
      { type: 'quote', text: 'Go Blue is easy to say. Spend a day here with a student and you’ll actually feel it.' },
    ],
  },
];

export function findBlogPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}
export const blogCategories: BlogCategory[] = ['Admissions', 'Schools', 'College tours'];
