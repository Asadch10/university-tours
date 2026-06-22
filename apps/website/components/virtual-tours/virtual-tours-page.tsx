'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowUpRight, Plus } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const HERO = 'https://schoolscoops.s3.us-east-1.amazonaws.com/static/video-chats-hero-v2.webp';
const BENTO_SAVE = 'https://schoolscoops.s3.us-east-1.amazonaws.com/static/vc-bento-save-time.avif';
const BENTO_SCOOP = 'https://schoolscoops.s3.us-east-1.amazonaws.com/static/vc-bento-honest-insights.avif';
const BENTO_LAPTOP = 'https://schoolscoops.s3.us-east-1.amazonaws.com/static/vc-bento-explore-colleges.webp';

const FAQS = [
  { q: 'How is a video chat different from a regular virtual campus tour?', a: 'Typical virtual tours are scripted, pre-recorded videos of the prettiest buildings. A video chat is a personalized, live conversation with a real student currently attending that school — you set the agenda.' },
  { q: 'Can I choose which student I talk to?', a: 'Yes. Browse guides by school and pick someone who shares your major, interests, or background, so you connect with a student you really identify with.' },
  { q: 'Are these video chats live?', a: 'They are. Every chat is a real-time, two-way video call with a current student — not a recording.' },
  { q: 'How long does a virtual college chat last?', a: 'Most chats run 30–60 minutes, but you and your guide can agree on a length that works for you.' },
  { q: 'Can parents join the call?', a: 'Absolutely. Parents and students are welcome on the call together.' },
  { q: 'Which colleges are available for an online tour?', a: 'Hundreds of universities nationwide have verified student guides available for video chats. Search your school to see who’s available.' },
  { q: 'How do I prepare for my video chat?', a: 'Just jot down the questions that matter most to you — academics, housing, social life, clubs, internships, safety, or anything else. Your guide handles the rest.' },
  { q: 'What does it cost?', a: 'Pricing is set by each guide and shown upfront. You’re only charged once your guide accepts the booking.' },
  { q: 'Is my information private?', a: 'Yes. Your details are only shared with your guide to coordinate the call, and your booking is protected.' },
  { q: 'Can I book more than one chat?', a: 'Of course — many families talk to several guides across different schools to compare and decide with confidence.' },
];

export function VirtualToursPage() {
  return (
    <div className="bg-white pt-[var(--header-h)]">
      <Hero />
      <Bento />
      <Faq />
    </div>
  );
}

/* ── 1. Hero ─────────────────────────────────────────────────────────── */

function Hero() {
  const router = useRouter();
  const [q, setQ] = useState('');

  return (
    <section className="container-page grid items-center gap-12 py-12 lg:grid-cols-2 lg:py-16">
      <div>
        <Reveal>
          <h1 className="font-display text-4xl font-bold leading-[1.08] text-ink-900 sm:text-5xl lg:text-6xl">
            Talk to real students before choosing a college
          </h1>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-600">
            Get honest answers about academics, campus life, and more on a live video call with a
            current student.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
            }}
            className="mt-8 flex max-w-md items-center gap-2.5 rounded-full border border-ink-200 bg-white px-5 py-3.5 shadow-sm transition-colors focus-within:border-maroon-800/40"
          >
            <Search size={17} className="shrink-0 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search schools"
              className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </form>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-7 flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {[32, 45, 44].map((n) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={n} src={`https://i.pravatar.cc/80?img=${n}`} alt="" className="h-8 w-8 rounded-full border-2 border-white object-cover" />
              ))}
            </div>
            <span className="text-sm font-medium text-ink-600">Trusted by thousands of guests</span>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <div className="overflow-hidden rounded-3xl shadow-lift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO} alt="A current student on a live video call" className="w-full object-cover" />
        </div>
      </Reveal>
    </section>
  );
}

/* ── 2. Bento (dark) ─────────────────────────────────────────────────── */

function BentoCard({ image, label, className }: { image: string; label: string; className?: string }) {
  return (
    <div className={cn('group relative overflow-hidden rounded-2xl', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={label}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }}
        aria-hidden
      />
      <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white ring-1 ring-inset ring-white/30 backdrop-blur transition-colors group-hover:bg-white group-hover:text-ink-900">
        <ArrowUpRight size={16} />
      </span>
      <span className="absolute bottom-4 left-4 font-display text-lg font-semibold text-white">
        {label}
      </span>
    </div>
  );
}

function Bento() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-5 sm:mx-7 lg:mx-10">
        <div className="overflow-hidden rounded-[2rem] bg-black px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Bento grid */}
            <div className="grid grid-cols-2 gap-4">
              <BentoCard image={BENTO_SAVE} label="Save time and money" className="h-[230px]" />
              <BentoCard image={BENTO_SCOOP} label="Get the inside scoop" className="h-[230px]" />
              <BentoCard image={BENTO_LAPTOP} label="Real conversations" className="col-span-2 h-[200px]" />
            </div>

            {/* Text */}
            <div>
              <Reveal>
                <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                  Virtual tours, real answers
                </h2>
              </Reveal>
              <Reveal delay={0.05}>
                <p className="mt-5 text-[0.95rem] leading-relaxed text-white/65">
                  Our video tours are not the typical virtual college tours you see online. Instead
                  of scripted, pre-recorded videos showing you the prettiest buildings on campus,
                  you’ll have a genuine conversation with a real student currently attending that
                  school.
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-white/65">
                  These are personalized live video calls with a current student where you set the
                  agenda. Get admissions tips and ask about academics, social life, or what it’s
                  really like to find your place on campus. You’ll get the inside scoop from a real
                  student.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <ButtonLink href="/search" variant="primary" size="lg" className="mt-8">
                  Browse guides
                </ButtonLink>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 3. FAQ ──────────────────────────────────────────────────────────── */

function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="container-page py-16 sm:py-24">
      <Reveal>
        <h2 className="mx-auto max-w-2xl text-center font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          Your virtual college tour questions, answered
        </h2>
      </Reveal>

      <div className="mx-auto mt-12 max-w-3xl">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="border-t border-ink-100 last:border-b">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className={cn(
                  'flex w-full items-center justify-between gap-6 rounded-2xl px-5 py-5 text-left transition-colors',
                  isOpen ? 'bg-ink-50/70' : 'hover:bg-ink-50/70',
                )}
              >
                <span className="text-[0.95rem] font-bold text-ink-900 sm:text-base">{item.q}</span>
                <span className={cn('shrink-0 text-ink-400 transition-transform duration-300', isOpen && 'rotate-45 text-ink-700')}>
                  <Plus size={20} strokeWidth={1.75} />
                </span>
              </button>
              <div className={cn('overflow-hidden transition-all duration-300', isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0')}>
                <p className="px-5 pb-5 text-[0.95rem] leading-relaxed text-ink-600">{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Still have questions bar */}
      <Reveal>
        <div className="mx-auto mt-10 flex max-w-3xl flex-col items-start justify-between gap-4 rounded-3xl bg-ink-900 px-7 py-6 text-white sm:flex-row sm:items-center">
          <p className="font-display text-lg font-bold">Still have questions?</p>
          <div className="flex gap-3">
            <Link
              href="/faq"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-white/90"
            >
              Help Center
            </Link>
            <Link
              href="/contact"
              className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/20"
            >
              Contact us
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
