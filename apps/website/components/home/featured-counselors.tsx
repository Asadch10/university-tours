'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { counselorsApi } from '@/lib/client-api';
import { counselorFromDto, type Counselor } from '@/lib/counselors';
import type { CommunityGuideDto } from '@/lib/guides';
import { ProfileCarousel, CarouselEmpty, type ProfileCard } from './profile-carousel';

/**
 * Featured college counselors — the counterpart of FeaturedGuides, reading the
 * approved + published counselors from `/search/counselors`.
 *
 * Uses the same carousel component, so the two sections are identical in card size,
 * slider behaviour and responsive breakpoints by construction.
 */

const MAX_CARDS = 12;

export function FeaturedCounselors() {
  const [dtos, setDtos] = useState<CommunityGuideDto[] | null>(null);

  useEffect(() => {
    let active = true;
    counselorsApi
      .list()
      .then((res) => {
        if (active) setDtos(res.data ?? []);
      })
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
        const c: Counselor = counselorFromDto(dto);
        return {
          id: c.id,
          headline: c.headline,
          // Counselors aren't campus-bound — their practice stands in for a school.
          subtitle: c.organization || 'Independent counselor',
          name: c.name,
          photo: c.photo,
          href: `/browse-counselors/${c.id}`,
        };
      }),
    [dtos],
  );

  return (
    <ProfileCarousel
      title="Featured college counselors"
      subtitle={
        <>
          Browse all college counselors{' '}
          <Link href="/browse-counselors" className="text-brand underline-offset-2 hover:underline">
            here
          </Link>
        </>
      }
      items={items}
      loading={dtos === null}
      // No counselors approved yet → an honest placeholder, never invented profiles.
      empty={
        <CarouselEmpty
          title="College counselors coming soon"
          body="We're verifying our first admissions counselors. Check back shortly — or apply to join them."
        />
      }
    />
  );
}
