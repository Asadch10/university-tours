import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { StarRating } from '@/components/ui/star-rating';
import {
  getGuideProfile,
  communityGuideToProfile,
  type GuideProfile,
  type CommunityGuideDto,
} from '@/lib/guides';

// Live, admin-approved guides are fetched per request (uncached), so keep the
// route dynamic (see the ambassadors page for the same rationale).
export const dynamic = 'force-dynamic';

/** Fetch an admin-approved website guide by owner id. */
async function fetchLiveGuide(id: string): Promise<GuideProfile | null> {
  const base =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:4000';
  try {
    const res = await fetch(`${base}/api/v1/search/community-guides/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const dto = (await res.json()) as CommunityGuideDto;
    return communityGuideToProfile(dto);
  } catch {
    return null;
  }
}

async function resolveGuide(id: string): Promise<GuideProfile | null> {
  return getGuideProfile(id) ?? (await fetchLiveGuide(id));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const g = await resolveGuide(id);
  return g
    ? { title: `${g.name} — profile`, alternates: { canonical: `/u/${g.id}` } }
    : { title: 'Profile not found' };
}

/** Simple public profile: image, short description, and reviews (mirrors the sample site's /u page). */
export default async function GuideProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await resolveGuide(id);
  if (!g) notFound();

  const description = g.hostedBy?.trim() || g.intro?.trim() || '';

  return (
    <main className="bg-surface pt-[var(--header-h)]">
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          {/* Greeting */}
          <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
            Hi, I&apos;m {g.name}
          </h1>

          {/* Image + description */}
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="h-40 w-40 shrink-0 overflow-hidden rounded-2xl border border-ink-200 bg-ink-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.photo} alt={g.name} className="h-full w-full object-contain" loading="eager" fetchPriority="high" decoding="async"/>
            </div>
            <div className="min-w-0">
              {g.university && (
                <p className="inline-flex items-center gap-1.5 text-sm text-ink-500">
                  <GraduationCap size={15} className="text-brand" /> {g.university}
                </p>
              )}
              {description && (
                <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-700">{description}</p>
              )}
              <Link
                href={`/ambassadors/${g.id}`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-maroon-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
              >
                View listing &amp; book <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Reviews */}
          <section className="mt-12 border-t border-ink-100 pt-10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-ink-900">Reviews ({g.reviews})</h2>
              {g.reviews > 0 && <StarRating value={g.rating} />}
            </div>

            {g.reviewList.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-dashed border-ink-200 bg-surface/60 p-8 text-center text-sm text-ink-500">
                No reviews yet.
              </p>
            ) : (
              <div className="mt-5 grid gap-4">
                {g.reviewList.map((r, i) => (
                  <figure key={i} className="rounded-2xl border border-ink-200/70 bg-surface p-6">
                    <StarRating value={r.rating} size={14} />
                    <blockquote className="mt-3 leading-relaxed text-ink-700">“{r.text}”</blockquote>
                    <figcaption className="mt-4 flex items-center gap-3">
                      <Avatar name={r.name} size={36} />
                      <span className="text-sm font-semibold text-ink-900">{r.name}</span>
                      <span className="text-sm text-ink-400">· {r.date}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
