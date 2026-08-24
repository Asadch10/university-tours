'use client';

import Link from 'next/link';

/**
 * The "join us" banner, promoting both marketplace roles.
 *
 * The artwork is a single wide composition whose left ~37% is deliberately empty —
 * a pale blue field the copy is laid over. So this is one full-bleed image with the
 * text positioned into that gap, not the old two-column split panel.
 *
 * Two consequences worth knowing before editing:
 *
 * 1. The copy overlays the image only from `lg` up. Below that the gap is too narrow
 *    to hold a headline, so the copy returns to normal flow ABOVE the image and the
 *    panel's own background carries it. One <img loading="lazy" decoding="async">, two layouts.
 *
 * 2. Every text colour here is a fixed hex, NOT an ink-* theme token. The artwork is
 *    dark in both themes, so a token that flips to near-black in light mode would
 *    render the headline invisible on top of it. Measured against the artwork's left
 *    band (#020305): white is 20.3:1, the muted grey is 9.7:1, near-black is 1.14:1.
 */

const BANNER_IMAGE = '/photos/hero-black.webp';

/** Sampled from the artwork's empty left band, so the panel and image are seamless. */
const PANEL_BG = '#020305';

const INK = '#FFFFFF';
const INK_MUTED = '#A9B4C7';
const INK_SOFT = '#7C8AA5';

export function BecomeGuide() {
  return (
    <section className="py-10 sm:py-12">
      {/* Same edge margins as the hero video and map section */}
      <div className="mx-5 sm:mx-7 lg:mx-10">
        <div
          className="relative overflow-hidden rounded-[2rem]"
          style={{ backgroundColor: PANEL_BG }}
        >
          {/* ── Copy — in flow on small screens, overlaid on the artwork's empty
                 left band from lg up ─────────────────────────────────────────── */}
          <div className="relative z-10 flex flex-col justify-center px-6 pb-8 pt-10 sm:px-10 lg:absolute lg:inset-y-0 lg:left-0 lg:w-[44%] lg:px-14 lg:py-0 xl:w-[42%] xl:px-16">
            <p
              className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em]"
              style={{ color: INK_SOFT }}
            >
              Two ways to join
            </p>

            <h2
              className="font-display font-bold leading-[1.08]"
              style={{ fontSize: 'clamp(1.75rem, 3.6vw, 3rem)', color: INK }}
            >
              Become a tour guide
              <span className="block" style={{ color: INK_SOFT }}>
                or college counselor
              </span>
            </h2>

            {/* One line per role, so each opportunity is stated plainly rather than
                merged into a sentence that describes neither properly. */}
            <div className="mt-6 max-w-[24rem] space-y-2.5">
              <p className="text-sm leading-relaxed sm:text-[0.95rem]" style={{ color: INK_MUTED }}>
                <span className="font-semibold" style={{ color: INK }}>
                  Students
                </span>{' '}
                — get paid to host private college tours at your school.
              </p>
              <p className="text-sm leading-relaxed sm:text-[0.95rem]" style={{ color: INK_MUTED }}>
                <span className="font-semibold" style={{ color: INK }}>
                  Counselors
                </span>{' '}
                — advise families as a verified admissions professional.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/become-a-guide"
                className="inline-flex items-center justify-center rounded-xl bg-maroon-900 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
              >
                Become a guide
              </Link>
              <Link
                href="/become-a-counselor"
                className="inline-flex items-center justify-center rounded-xl border px-7 py-3 text-sm font-semibold transition-colors hover:border-white/60 hover:bg-white/10"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: INK }}
              >
                Become a counselor
              </Link>
            </div>

            <Link
              href="/how-it-works"
              className="mt-5 inline-flex text-sm font-semibold underline-offset-4 transition-colors hover:underline"
              style={{ color: INK_MUTED }}
            >
              Learn how it works
            </Link>
          </div>

          {/* ── Artwork ───────────────────────────────────────────────────────
              alt="" because the image is decorative here: it carries no text of
              its own and the copy beside it already says everything it depicts. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BANNER_IMAGE}
            alt=""
            width={1771}
            height={888}
            loading="lazy"
            /* The source is ~2:1, so at full width on a wide screen it renders
               ~900px tall and the section no longer fits the viewport. Capping the
               height and letting object-cover crop keeps the banner on-screen.
               object-position sits at 25% rather than centre so the crop comes off
               the empty sky and the ground, not the two floating cards near the top
               — centring here clips the "Tour Guide" card off entirely.
               min-h on lg guarantees room for the overlaid copy on short viewports. */
            className="block max-h-[420px] w-full object-cover object-[50%_25%] sm:max-h-[480px] lg:max-h-[min(560px,70vh)] lg:min-h-[430px] xl:max-h-[min(620px,72vh)]" decoding="async"/>
        </div>
      </div>
    </section>
  );
}
