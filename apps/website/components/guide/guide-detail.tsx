'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Star, ChevronLeft, ChevronRight, ChevronDown, Check, Share, Maximize2,
  Footprints, Video, Minus, Plus,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { GuideProfile } from '@/lib/guides';

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export function GuideDetail({ g }: { g: GuideProfile }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <div className="container-page pt-[calc(var(--header-h)+1.5rem)] pb-20 sm:pt-[calc(var(--header-h)+2rem)] sm:pb-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12 xl:gap-14">
          {/* Gallery — top-left */}
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <Gallery g={g} />
          </div>

          {/*
           * Booking sidebar.
           * Mobile: appears right after the gallery (order in DOM), so users can book
           *         without scrolling the whole profile.
           * Desktop: right column, spanning both rows, sticky.
           */}
          <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              <h1 className="font-display text-xl font-bold leading-tight text-ink-900 sm:text-[1.6rem]">
                {g.headline}
              </h1>

              <div className="mt-5 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.photo} alt={g.name} className="h-12 w-12 rounded-full object-cover ring-1 ring-ink-200" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink-900">{g.name}</p>
                  <p className="truncate text-sm text-ink-600">{g.university}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-700">
                    <Star size={13} className="fill-ink-900 text-ink-900" />
                    {g.rating.toFixed(1)} ({g.reviews})
                  </p>
                </div>
              </div>

              <BookingCard g={g} />
            </div>
          </aside>

          {/* Profile content — below gallery on desktop, below booking on mobile */}
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            <Intro g={g} />
            <UniversityRow g={g} />
            <AboutMe g={g} />
            <TourType g={g} />
            <Field label="Hometown" value={g.hometown} />
            <Field label="Major(s)" value={g.majors.join(', ')} />
            <Checklist title="Extracurriculars activities" items={g.extracurriculars} columns />
            <ListSection title="Clubs, organizations & involvement" items={g.clubs} />
            <Checklist title="Housing experience" items={g.housing} />
            <Prose title="Describe your college experience" paragraphs={g.collegeExperience} />
            <Prose title="Tip for future students" paragraphs={[g.tip]} />
            <Prose title="Favorite class" paragraphs={g.favoriteClass} />
            <Prose title="Career goals" paragraphs={g.careerGoals} />
            <Reviews g={g} />
            <HostedBy g={g} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Gallery ── */

function Gallery({ g }: { g: GuideProfile }) {
  const [active, setActive] = useState(0);
  const total = g.gallery.length;
  const go = (d: number) => setActive((i) => (i + d + total) % total);

  return (
    <div className="max-w-[520px]">
      <div className="relative overflow-hidden rounded-3xl bg-ink-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={g.gallery[active]}
          alt={`${g.name} photo ${active + 1}`}
          className="aspect-square w-full object-cover"
        />

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous photo"
          className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-800 shadow-lift transition-colors hover:bg-ink-50"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next photo"
          className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-800 shadow-lift transition-colors hover:bg-ink-50"
        >
          <ChevronRight size={20} />
        </button>

        <div className="absolute bottom-3 right-3 flex gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-ink-800 shadow-md">
            <Share size={15} /> Share
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-ink-800 shadow-md">
            <Maximize2 size={15} /> Expand
          </span>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {g.gallery.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`View photo ${i + 1}`}
            className={cn(
              'h-16 w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition',
              i === active ? 'ring-maroon-800' : 'ring-transparent hover:ring-ink-200',
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Content blocks ── */

function Intro({ g }: { g: GuideProfile }) {
  return (
    <p className="mt-8 whitespace-pre-line text-justify text-[1.05rem] leading-relaxed text-ink-700 sm:text-left">
      {g.intro}
    </p>
  );
}

function UniversityRow({ g }: { g: GuideProfile }) {
  return (
    <Link
      href={`/universities/${g.universitySlug}`}
      className="mt-8 flex items-center gap-4 border-y border-ink-100 py-5 transition-colors hover:bg-ink-50/50"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={g.universityImage} alt="" className="h-full w-full object-cover" />
      </div>
      <div>
        <p className="font-bold text-ink-900">{g.university}</p>
        <p className="text-sm text-ink-500">{g.universityLocation}</p>
      </div>
    </Link>
  );
}

function AboutMe({ g }: { g: GuideProfile }) {
  const rows: [string, string][] = [
    ['Gender', g.gender],
    ['Current academic year', g.year],
    ['Age', String(g.age)],
    ['Admission type', g.admission],
    ['Academic focus', g.focus],
  ];
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold text-ink-900">About me</h2>
      <dl className="mt-4 overflow-hidden rounded-2xl border border-ink-200">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between gap-4 border-b border-ink-100 px-4 py-3.5 last:border-0 even:bg-ink-50/40"
          >
            <dt className="shrink-0 text-sm font-semibold text-ink-900 sm:text-base">{k}</dt>
            <dd className="min-w-0 break-words text-right text-sm text-ink-700 sm:text-base">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function TourType({ g }: { g: GuideProfile }) {
  const items = [
    { label: 'Campus tour', active: g.services.includes('CAMPUS_TOUR') },
    { label: 'Video chat', active: g.services.includes('VIDEO_CONSULTATION') },
  ];
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold text-ink-900">Tour type</h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2.5">
            <Check size={18} className={it.active ? 'text-blue-600' : 'text-ink-300'} />
            <span className={it.active ? 'font-medium text-ink-900' : 'text-ink-400 line-through'}>
              {it.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold text-ink-900">{label}</h2>
      <p className="mt-3 text-ink-700">{value}</p>
    </section>
  );
}

function Checklist({
  title,
  items,
  columns = false,
}: {
  title: string;
  items: { label: string; active: boolean }[];
  columns?: boolean;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold text-ink-900">{title}</h2>
      <ul className={cn('mt-4 gap-x-10 gap-y-2.5', columns ? 'grid sm:grid-cols-2' : 'space-y-2.5')}>
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2.5">
            <Check size={18} className={it.active ? 'text-blue-600' : 'text-ink-300'} />
            <span className={it.active ? 'font-medium text-ink-900' : 'text-ink-400 line-through'}>
              {it.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold text-ink-900">{title}</h2>
      <ul className="mt-3 space-y-1.5 text-ink-700">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </section>
  );
}

function Prose({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold text-ink-900">{title}</h2>
      <div className="mt-3 space-y-4 text-justify leading-relaxed text-ink-700 sm:text-left">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}

function Reviews({ g }: { g: GuideProfile }) {
  return (
    <section className="mt-12 border-t border-ink-100 pt-10">
      <h2 className="font-display text-xl font-bold text-ink-900">Reviews ({g.reviewList.length})</h2>
      <div className="mt-6 space-y-8">
        {g.reviewList.map((r, i) => (
          <figure key={i} className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {initials(r.name)}
            </span>
            <div className="min-w-0">
              <blockquote className="text-justify italic leading-relaxed text-ink-700 sm:text-left">{r.text}</blockquote>
              <figcaption className="mt-2 flex items-center gap-2 text-sm text-ink-500">
                <span className="font-medium text-ink-700">{r.name}</span>
                <span>·</span>
                <span>{r.date}</span>
                <span className="flex gap-0.5">
                  {Array.from({ length: r.rating }).map((_, k) => (
                    <Star key={k} size={13} className="fill-blue-600 text-blue-600" />
                  ))}
                </span>
              </figcaption>
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}

function HostedBy({ g }: { g: GuideProfile }) {
  return (
    <section className="mt-12 border-t border-ink-100 pt-10">
      <h2 className="font-display text-xl font-bold text-ink-900">Hosted by</h2>
      <p className="mt-4 font-semibold text-ink-900">Hi, I’m {g.name}</p>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={g.photo}
          alt={g.name}
          className="h-24 w-24 shrink-0 rounded-full object-cover ring-1 ring-ink-200"
        />
        <div>
          <p className="text-justify leading-relaxed text-ink-700 sm:text-left">{g.hostedBy}</p>
          <Link
            href={`/ambassadors/${g.id}`}
            className="mt-3 inline-block font-medium text-blue-600 hover:underline"
          >
            View profile
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Booking card (interactive) ── */

type Panel = 'tour' | 'guests' | 'date' | 'time' | 'duration' | null;

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DURATIONS = [
  { label: '1 hour', desc: 'Good for a quick campus overview and answers to your top questions.' },
  {
    label: '2 hours',
    recommended: true,
    desc: 'Perfect for a more thorough, personalized tour and deeper campus insights.',
  },
];

function timeSlots() {
  const slots: string[] = [];
  for (let h = 8; h <= 18; h++) {
    const hour12 = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    slots.push(`${hour12}:00 ${ampm} (ET)`, `${hour12}:30 ${ampm} (ET)`);
  }
  return slots;
}
const SLOTS = timeSlots();

function BookingCard({ g }: { g: GuideProfile }) {
  const [open, setOpen] = useState<Panel>(null);
  const ref = useRef<HTMLDivElement>(null);

  const [tourType, setTourType] = useState<'CAMPUS_TOUR' | 'VIDEO_CONSULTATION'>(
    g.services[0] ?? 'CAMPUS_TOUR',
  );
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [date, setDate] = useState<{ y: number; m: number; d: number } | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);

  const now = new Date();
  const [cal, setCal] = useState({ y: now.getFullYear(), m: now.getMonth() });

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggle = (p: Panel) => setOpen((cur) => (cur === p ? null : p));

  const guests = adults + children;
  const guestLabel = `${guests} guest${guests > 1 ? 's' : ''}`;
  const tourLabel = tourType === 'CAMPUS_TOUR' ? 'Campus tour' : 'Video chat';
  const dateLabel = date
    ? new Date(date.y, date.m, date.d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Add date';

  const ready = Boolean(date && time && duration);

  const monthLabel = new Date(cal.y, cal.m, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const firstWeekday = new Date(cal.y, cal.m, 1).getDay();
  const daysInMonth = new Date(cal.y, cal.m + 1, 0).getDate();
  const shiftMonth = (d: number) => {
    const nm = cal.m + d;
    setCal({ y: cal.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 });
  };

  return (
    <div ref={ref} className="mt-6 space-y-4">
      {/* Tour type */}
      <div className="relative">
        <Trigger label="Tour type" value={tourLabel} active={open === 'tour'} chevron={false} onClick={() => toggle('tour')} />
        {open === 'tour' && (
          <DropPanel>
            <p className="mb-3 font-bold text-ink-900">How would you like to tour?</p>
            <div className="space-y-2">
              <OptionRow
                icon={<Footprints size={20} />}
                iconClass="bg-blue-600 text-white"
                title="Campus tour"
                desc="Explore campus on a personalized tour tailored to your interests"
                selected={tourType === 'CAMPUS_TOUR'}
                onClick={() => {
                  setTourType('CAMPUS_TOUR');
                  setOpen(null);
                }}
              />
              <OptionRow
                icon={<Video size={20} />}
                iconClass="bg-ink-100 text-ink-700"
                title="Video chat"
                desc="Connect live with a current student and get the scoop from anywhere"
                selected={tourType === 'VIDEO_CONSULTATION'}
                onClick={() => {
                  setTourType('VIDEO_CONSULTATION');
                  setOpen(null);
                }}
              />
            </div>
          </DropPanel>
        )}
      </div>

      {/* Guests */}
      <div className="relative">
        <Trigger label="Guests" value={guestLabel} active={open === 'guests'} onClick={() => toggle('guests')} />
        {open === 'guests' && (
          <DropPanel>
            <Counter label="Adults" sub="Age 18+" value={adults} min={1} onChange={setAdults} />
            <Counter label="Children" sub="Age 2–17" value={children} min={0} onChange={setChildren} />
            <p className="mt-4 text-sm text-ink-600">Planning a group tour with 5 or more guests?</p>
            <Link href="/group-tours" className="text-sm font-medium text-blue-600 underline">
              Learn more
            </Link>
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="font-semibold text-ink-900 hover:underline"
              >
                Close
              </button>
            </div>
          </DropPanel>
        )}
      </div>

      {/* Date */}
      <div className="relative">
        <Trigger label="Date" value={dateLabel} muted={!date} chevron={false} active={open === 'date'} onClick={() => toggle('date')} />
        {open === 'date' && (
          <DropPanel>
            <div className="mb-3 flex items-center justify-between">
              <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="text-blue-600">
                <ChevronLeft size={20} />
              </button>
              <span className="font-bold text-ink-900">{monthLabel}</span>
              <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="text-blue-600">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
              {WEEKDAYS.map((w) => (
                <span key={w} className="py-1 font-semibold text-ink-500">
                  {w}
                </span>
              ))}
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <span key={`b${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const isSel = date && date.y === cal.y && date.m === cal.m && date.d === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDate({ y: cal.y, m: cal.m, d });
                      setOpen(null);
                    }}
                    className={cn(
                      'mx-auto flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-ink-100',
                      isSel && 'bg-maroon-900 text-ivory hover:bg-maroon-900',
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </DropPanel>
        )}
      </div>

      {/* Start time + Duration */}
      <div className="relative grid grid-cols-2 gap-4">
        <Trigger label="Start time" value={time ?? 'Add time'} muted={!time} active={open === 'time'} onClick={() => toggle('time')} />
        <Trigger label="Duration" value={duration ?? 'Add duration'} muted={!duration} active={open === 'duration'} onClick={() => toggle('duration')} />

        {open === 'time' && (
          <DropPanel>
            <div className="grid max-h-72 grid-cols-2 gap-x-4 overflow-y-auto">
              {SLOTS.map((s) => {
                const sel = time === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setTime(s);
                      setOpen(null);
                    }}
                    className="flex items-center gap-2.5 border-b border-ink-100 py-3 text-left text-sm"
                  >
                    <span
                      className={cn(
                        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                        sel ? 'border-blue-600 bg-blue-600 text-white' : 'border-ink-300',
                      )}
                    >
                      {sel && <Check size={12} />}
                    </span>
                    {s}
                  </button>
                );
              })}
            </div>
          </DropPanel>
        )}

        {open === 'duration' && (
          <DropPanel>
            <div className="space-y-1">
              {DURATIONS.map((d) => {
                const sel = duration === d.label;
                return (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => {
                      setDuration(d.label);
                      setOpen(null);
                    }}
                    className="flex w-full items-start gap-3 border-b border-ink-100 py-3 text-left last:border-0"
                  >
                    <div className="flex-1">
                      <p className="flex items-center gap-2 font-bold text-ink-900">
                        {d.label}
                        {d.recommended && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                            Recommended
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-600">{d.desc}</p>
                    </div>
                    <span
                      className={cn(
                        'mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                        sel ? 'border-blue-600 bg-blue-600 text-white' : 'border-ink-300',
                      )}
                    >
                      {sel && <Check size={12} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </DropPanel>
        )}
      </div>

      <button
        type="button"
        disabled={!ready}
        className={cn(
          'w-full rounded-2xl py-4 text-center font-semibold transition-colors',
          ready
            ? 'bg-maroon-900 text-ivory hover:bg-maroon-800'
            : 'cursor-not-allowed bg-ink-200 text-ink-500',
        )}
      >
        Reserve
      </button>
      <p className="text-center text-sm text-ink-500">
        From <span className="font-semibold text-ink-900">{formatPrice(g.price)}</span> · you won’t be
        charged yet
      </p>
    </div>
  );
}

function Trigger({
  label,
  value,
  muted = false,
  chevron = true,
  active = false,
  onClick,
}: {
  label: string;
  value: string;
  muted?: boolean;
  chevron?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left transition-colors',
        active ? 'border-ink-900 ring-1 ring-ink-900' : 'border-ink-200 hover:border-ink-300',
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold text-ink-900">{label}</span>
        <span className={cn('block truncate text-sm', muted ? 'text-ink-400' : 'text-ink-700')}>{value}</span>
      </span>
      {chevron && (
        <ChevronDown size={18} className={cn('shrink-0 text-ink-500 transition-transform', active && 'rotate-180')} />
      )}
    </button>
  );
}

function DropPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 rounded-2xl border border-ink-200 bg-white p-4 shadow-lift">
      {children}
    </div>
  );
}

function OptionRow({
  icon,
  iconClass,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors',
        selected ? 'bg-blue-50' : 'hover:bg-ink-50',
      )}
    >
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconClass)}>{icon}</span>
      <span className="flex-1">
        <span className="block font-bold text-ink-900">{title}</span>
        <span className="block text-sm text-ink-600">{desc}</span>
      </span>
      <span
        className={cn(
          'mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
          selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-ink-300',
        )}
      >
        {selected && <Check size={12} />}
      </span>
    </button>
  );
}

function Counter({
  label,
  sub,
  value,
  min,
  onChange,
}: {
  label: string;
  sub: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-bold text-ink-900">{label}</p>
        <p className="text-sm text-ink-500">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-300 text-ink-700 transition-colors hover:border-ink-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus size={16} />
        </button>
        <span className="w-4 text-center font-medium text-ink-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-300 text-ink-700 transition-colors hover:border-ink-500"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
