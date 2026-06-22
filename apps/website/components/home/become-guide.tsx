'use client';

import Link from 'next/link';

/* ─── Floating guide avatar positions ───────────────────────────────── */

const CIRCLES: Array<{ img: string; size: number } & React.CSSProperties> = [
  /* Left column */
  { img: 'https://i.pravatar.cc/120?img=3',  size: 68, top: '6%',  left: '32%' },
  { img: 'https://i.pravatar.cc/120?img=25', size: 54, top: '21%', left: '24%' },
  { img: 'https://i.pravatar.cc/120?img=44', size: 80, top: '38%', left: '26%' },
  { img: 'https://i.pravatar.cc/120?img=32', size: 64, top: '56%', left: '22%' },
  { img: 'https://i.pravatar.cc/120?img=15', size: 72, top: '71%', left: '28%' },
  { img: 'https://i.pravatar.cc/120?img=45', size: 54, top: '87%', left: '36%' },
  /* Right column */
  { img: 'https://i.pravatar.cc/120?img=12', size: 80, top: '5%',  right: '4%' },
  { img: 'https://i.pravatar.cc/120?img=47', size: 60, top: '21%', right: '16%' },
  { img: 'https://i.pravatar.cc/120?img=33', size: 74, top: '38%', right: '2%'  },
  { img: 'https://i.pravatar.cc/120?img=7',  size: 56, top: '56%', right: '18%' },
  { img: 'https://i.pravatar.cc/120?img=20', size: 70, top: '71%', right: '3%'  },
  { img: 'https://i.pravatar.cc/120?img=5',  size: 58, top: '87%', right: '15%' },
];

/* ─── Component ──────────────────────────────────────────────────────── */

export function BecomeGuide() {
  return (
    <section className="py-10 sm:py-12">
      {/* Same edge margins as the hero video and map section */}
      <div className="mx-5 sm:mx-7 lg:mx-10">
        <div className="relative min-h-[440px] overflow-hidden rounded-[2rem] sm:min-h-[560px] xl:min-h-[640px]">

          {/* ── Full-bleed background image ──────────────────────────── */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://d3m810mf773mim.cloudfront.net/static/become-guide-mobile-bg.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="lazy"
          />

          {/* Dark gradient — dense on the left so text stays legible,
              fades out to the right to let the background image show through */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(100deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.30) 65%, rgba(0,0,0,0.10) 100%)',
            }}
            aria-hidden="true"
          />

          {/* ── Content grid ─────────────────────────────────────────── */}
          <div className="relative z-10 grid min-h-[440px] items-center sm:min-h-[560px] lg:grid-cols-[5fr_7fr] xl:min-h-[640px]">

            {/* Left: heading + text + CTAs */}
            <div className="flex flex-col justify-center px-6 py-12 sm:px-14 sm:py-16 lg:px-16 xl:px-20">
              <h2
                className="font-display font-bold leading-[1.08] text-white"
                style={{ fontSize: 'clamp(1.75rem, 5vw, 3.6rem)' }}
              >
                Become a tour guide
              </h2>

              <p className="mt-5 max-w-[22rem] text-sm leading-relaxed text-white/60 sm:text-base">
                Join thousands of students earning $40/hour hosting private college tours
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/become-a-guide"
                  className="inline-flex items-center justify-center rounded-xl bg-maroon-900 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
                >
                  Get started
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10"
                >
                  Learn more
                </Link>
              </div>
            </div>

            {/* Right: floating guide avatar circles over the visible background */}
            <div className="relative hidden h-full lg:block">
              {CIRCLES.map(({ img, size, ...pos }, i) => (
                <div
                  key={i}
                  className="absolute overflow-hidden rounded-full ring-2 ring-white/25 shadow-lg"
                  style={{ width: size, height: size, ...pos }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
