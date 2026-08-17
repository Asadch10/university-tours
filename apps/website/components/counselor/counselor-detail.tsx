'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, BadgeCheck, Briefcase, Globe, Loader2, Star } from 'lucide-react';
import { BookingCard } from '@/components/guide/guide-detail';
import { tourTypeLabel } from '@/lib/tour-types';
import { counselorsApi } from '@/lib/client-api';
import { counselorFromDto, type Counselor } from '@/lib/counselors';

/**
 * Public counselor profile — the counselor counterpart of the guide detail page.
 * Booking routes through the existing consultation flow, so the CTA points at the
 * same booking entry point families already use.
 */
export function CounselorDetail({ id }: { id: string }) {
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    counselorsApi
      .byId(id)
      .then((dto) => {
        if (!cancelled) setCounselor(counselorFromDto(dto));
      })
      .catch(() => {
        if (!cancelled) setCounselor(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={28} />
      </div>
    );
  }

  if (!counselor) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink-900">Counselor not found</h1>
        <p className="mt-3 text-ink-600">
          This profile may have been removed or is no longer accepting consultations.
        </p>
        <Link href="/browse-counselors" className="mt-6 inline-block text-sm font-semibold text-brand hover:underline">
          Back to all counselors
        </Link>
      </div>
    );
  }

  const c = counselor;

  return (
    <div className="container-page py-10 sm:py-14">
      <Link
        href="/browse-counselors"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 transition-colors hover:text-ink-900"
      >
        <ArrowLeft size={16} />
        All counselors
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="flex flex-wrap items-start gap-5">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-ink-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.photo}
                alt={c.name}
                width={96}
                height={96}
                /* Above the fold and the page's largest image — same treatment as the
                   guide gallery's main photo. */
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-bold text-ink-900">{c.name}</h1>
              <p className="mt-1 text-ink-600">{c.headline}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-600">
                <span className="inline-flex items-center gap-1.5 font-medium text-verified">
                  <BadgeCheck size={15} />
                  Credentials verified
                </span>
                {c.rating !== null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Star size={14} className="fill-gold-500 text-gold-500" />
                    {c.rating.toFixed(1)} ({c.reviews} review{c.reviews === 1 ? '' : 's'})
                  </span>
                )}
              </div>
            </div>
          </div>

          {c.bio && (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-ink-900">Counseling approach</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-600">{c.bio}</p>
            </section>
          )}

          {c.services.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-ink-900">Services offered</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.services.map((sv) => (
                  <span
                    key={sv}
                    className="rounded-full bg-brand-tint px-3.5 py-1.5 text-sm font-medium text-brand"
                  >
                    {tourTypeLabel(
                      sv === 'CAMPUS_TOUR'
                        ? 'Campus tour'
                        : sv === 'VIDEO_CONSULTATION'
                          ? 'Video chat'
                          : 'Consultancy',
                    )}
                  </span>
                ))}
              </div>
            </section>
          )}

          {c.specialties.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-ink-900">Specialties</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-ink-200 px-3.5 py-1.5 text-sm font-medium text-ink-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Booking / facts card */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-ink-200/70 bg-surface p-6 shadow-soft">
            <dl className="space-y-4 text-sm">
              {c.organization && (
                <div>
                  <dt className="font-semibold text-ink-800">Practice</dt>
                  <dd className="mt-0.5 inline-flex items-center gap-1.5 text-ink-600">
                    <Briefcase size={14} />
                    {c.organization}
                  </dd>
                </div>
              )}
              {c.yearsExperience && (
                <div>
                  <dt className="font-semibold text-ink-800">Experience</dt>
                  <dd className="mt-0.5 text-ink-600">{c.yearsExperience} years in admissions</dd>
                </div>
              )}
              {c.credentials && (
                <div>
                  <dt className="font-semibold text-ink-800">Credentials</dt>
                  <dd className="mt-0.5 text-ink-600">{c.credentials}</dd>
                </div>
              )}
              {c.website && (
                <div>
                  <dt className="font-semibold text-ink-800">Website</dt>
                  <dd className="mt-0.5">
                    <a
                      href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline"
                    >
                      <Globe size={14} />
                      Visit
                    </a>
                  </dd>
                </div>
              )}
            </dl>

          </div>

          {/* The same booking widget the guide profile uses — it reads the counselor's
              saved availability, so only the dates and times they set are offerable.
              `kind` files the booking under the counselor marketplace. */}
          {c.services.length > 0 ? (
            <div className="mt-6">
              <BookingCard
                g={{
                  id: c.id,
                  name: c.name,
                  headline: c.headline,
                  university: c.organization || 'Independent counselor',
                  services: c.services,
                  availability: c.availability,
                }}
                kind="COUNSELOR"
              />
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed border-ink-300 bg-canvas-alt px-4 py-6 text-center text-sm text-ink-500">
              This counselor hasn&rsquo;t opened any availability yet.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
