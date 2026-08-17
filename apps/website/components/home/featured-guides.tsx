'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { guidesApi } from '@/lib/client-api';
import { communityGuideToGuide, type CommunityGuideDto } from '@/lib/guides';
import { ProfileCarousel, CarouselEmpty, type ProfileCard } from './profile-carousel';

/**
 * Featured tour guides — the real, admin-approved guides from the API.
 *
 * Previously a hard-coded list of eight fake profiles. It now reads the same
 * `/search/community-guides` endpoint that Browse guides uses, so the homepage can
 * never advertise a guide who doesn't exist or link to a profile that 404s.
 */

/** How many to show — the strip scrolls, but the whole directory would be excessive. */
const MAX_CARDS = 12;

export function FeaturedGuides() {
  const [dtos, setDtos] = useState<CommunityGuideDto[] | null>(null);

  useEffect(() => {
    let active = true;
    guidesApi
      .community()
      .then((res) => {
        if (active) setDtos(res.data ?? []);
      })
      // A failed fetch is treated as "none available" rather than a broken section.
      .catch(() => {
        if (active) setDtos([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo<ProfileCard[]>(
    () =>
      (dtos ?? []).slice(0, MAX_CARDS).map((dto) => {
        const g = communityGuideToGuide(dto);
        return {
          id: g.id,
          headline: g.headline,
          subtitle: g.university,
          name: g.name,
          photo: g.photo,
          href: `/ambassadors/${g.id}`,
        };
      }),
    [dtos],
  );

  return (
    <ProfileCarousel
      title="Featured tour guides"
      subtitle={
        <>
          Browse all tour guides{' '}
          <Link href="/search" className="text-brand underline-offset-2 hover:underline">
            here
          </Link>
        </>
      }
      items={items}
      loading={dtos === null}
      empty={
        <CarouselEmpty
          title="Tour guides coming soon"
          body="We're verifying our first student guides. Check back shortly — or apply to become one yourself."
        />
      }
    />
  );
}
