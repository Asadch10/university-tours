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
