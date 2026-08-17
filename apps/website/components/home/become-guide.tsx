'use client';

import Link from 'next/link';

/**
 * The "join us" banner, promoting both marketplace roles.
 *
 * The artwork is a finished 1400x1400 composition — a phone mockup ringed by avatar
 * circles on a black field — so it is shown whole (object-contain at its native
 * square ratio) rather than cropped to a wide strip. Cropping it to the panel with
 * object-cover left only a narrow middle band, which read as one giant face.
 *
 * For the same reason there is no overlay of extra avatar circles: the image already
 * contains them, and a second set on top doubled them up.
 *
 * The panel is black to match the artwork's own background, so the image's edges
 * dissolve into the panel instead of sitting in a visible box — in both themes.
 */

const BANNER_IMAGE = 'https://d3m810mf773mim.cloudfront.net/static/become-guide-mobile-bg.webp';

export function BecomeGuide() {
  return (
    <section className="py-10 sm:py-12">
      {/* Same edge margins as the hero video and map section */}
      <div className="mx-5 sm:mx-7 lg:mx-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-black">
          <div className="grid items-center gap-2 lg:grid-cols-[6fr_5fr] xl:grid-cols-[7fr_6fr]">
            {/* ── Left: copy + CTAs ─────────────────────────────────── */}
            <div className="order-2 flex flex-col justify-center px-6 pb-12 pt-2 sm:px-14 sm:pb-16 lg:order-1 lg:px-16 lg:py-16 xl:px-20">
              <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/50">
                Two ways to join
              </p>

              <h2
                className="font-display font-bold leading-[1.08] text-white"
                style={{ fontSize: 'clamp(1.75rem, 4.4vw, 3.4rem)' }}
              >
                Become a tour guide
                <span className="block text-white/45">or college counselor</span>
              </h2>

              {/* One line per role, so each opportunity is stated plainly rather than
                  merged into a sentence that describes neither properly. */}
              <div className="mt-6 max-w-[26rem] space-y-2.5">
                <p className="text-sm leading-relaxed text-white/60 sm:text-base">
                  <span className="font-semibold text-white/85">Students</span> — earn $40/hour
                  hosting private college tours at your school.
                </p>
                <p className="text-sm leading-relaxed text-white/60 sm:text-base">
                  <span className="font-semibold text-white/85">Counselors</span> — advise families
                  as a verified admissions professional.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/become-a-guide"
                  className="inline-flex items-center justify-center rounded-xl bg-maroon-900 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
                >
                  Become a guide
                </Link>
                <Link
                  href="/become-a-counselor"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10"
                >
                  Become a counselor
                </Link>
              </div>

              <Link
                href="/how-it-works"
                className="mt-5 inline-flex text-sm font-semibold text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Learn how it works
              </Link>
            </div>

            {/* ── Right: the artwork, uncropped ─────────────────────── */}
            <div className="order-1 lg:order-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BANNER_IMAGE}
                alt="Student guides and counselors on Campus Private Tours"
                width={1400}
                height={1400}
                loading="lazy"
                /* aspect-square + object-contain keeps the native 1:1 composition
                   intact at every breakpoint; the height cap stops it dominating the
                   panel on wide screens. */
                className="mx-auto aspect-square w-full max-w-[420px] object-contain lg:max-h-[520px] lg:max-w-none xl:max-h-[600px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
