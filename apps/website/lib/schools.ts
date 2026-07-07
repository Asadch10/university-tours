'use client';

/**
 * Live universities for the explore map — the same `schools` the admin console
 * manages. Fetched from the public catalog endpoint (`GET /api/v1/schools`,
 * enabled schools only) and mapped into the `UniversityPin` shape the map
 * components render. A school without coordinates still appears in the list,
 * it just doesn't get a map pin.
 */

import { useEffect, useState } from 'react';
import type { UniversityPin } from '@/components/home/map-view';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

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

function toPin(s: SchoolDto): UniversityPin {
  const [city, stateAbbr] = (s.location ?? '').split(',').map((p) => p.trim());
  return {
    id: s.slug,
    name: s.name,
    city: city || s.name,
    state: stateAbbr || s.state || '',
    lat: s.lat,
    lng: s.lng,
    image: s.image ? (s.image.startsWith('http') ? s.image : `${API_URL}${s.image}`) : null,
    blurb:
      s.seoContent ??
      `Meet verified student guides at ${s.name} and see the campus through their eyes.`,
    ambassadors: s._count?.sellerProfiles ?? 0,
    href: `/universities/${s.slug}`,
  };
}

export function useUniversities(): { universities: UniversityPin[]; loading: boolean } {
  const [universities, setUniversities] = useState<UniversityPin[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/v1/schools`)
      .then((res) => (res.ok ? (res.json() as Promise<SchoolDto[]>) : Promise.reject(new Error(String(res.status)))))
      .then((schools) => {
        if (!cancelled) setUniversities(schools.map(toPin));
      })
      .catch(() => {
        if (!cancelled) setUniversities([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { universities: universities ?? [], loading: universities === null };
}
