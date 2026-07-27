// Mobile schools client for the Explore map — mirrors the website's lib/schools.ts.
// Fetches the public catalog (`GET /schools`, enabled schools only) and maps each
// into a UniversityPin. A school without coordinates still lists; it just isn't pinned.
import { api, API_BASE_URL } from './client';

// Single source of truth (already LAN-rewritten for devices); used to absolutize
// relative image paths returned by the API.
const API_BASE = API_BASE_URL;

interface SchoolDto {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  location: string | null;
  state: string | null;
  seoContent: string | null;
  lat: number | null;
  lng: number | null;
  _count?: { sellerProfiles: number; listings: number };
}

export interface UniversityPin {
  id: string; // slug
  name: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  image: string | null;
  blurb: string;
  ambassadors: number;
  ranking?: string;
  slug: string;
}

function toPin(s: SchoolDto): UniversityPin {
  const [city, stateAbbr] = (s.location ?? '').split(',').map((p) => p.trim());
  return {
    id: s.slug,
    name: s.name,
    city: city || s.name,
    state: stateAbbr || s.state || '',
    lat: s.lat,
    lng: s.lng,
    image: s.image ? (s.image.startsWith('http') ? s.image : `${API_BASE}${s.image}`) : null,
    blurb:
      s.seoContent ??
      `Meet verified student guides at ${s.name} and see the campus through their eyes.`,
    ambassadors: s._count?.sellerProfiles ?? 0,
    slug: s.slug,
  };
}

export async function fetchUniversities(): Promise<UniversityPin[]> {
  const schools = await api.request<SchoolDto[]>('GET', '/schools');
  return schools.map(toPin);
}
