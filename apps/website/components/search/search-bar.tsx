'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, GraduationCap, Sparkles, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { universities } from '@/lib/data';

const POPULAR = ['Stanford', 'Harvard', 'UCLA', 'NYU'];

/** Hero/search composite: the primary CTA of the marketplace. */
export function SearchBar({ variant = 'hero' }: { variant?: 'hero' | 'compact' }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('');

  function submit(e?: React.FormEvent, overrideQ?: string) {
    e?.preventDefault();
    const query = overrideQ ?? q;
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (service) params.set('service', service);
    if (date) params.set('date', date);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className={cn('w-full', variant === 'hero' && 'mx-auto max-w-4xl')}>
      <form
        onSubmit={submit}
        className="flex flex-col gap-2 rounded-3xl border border-white/15 bg-white/95 p-2 shadow-lift backdrop-blur-xl sm:flex-row sm:items-center sm:rounded-full sm:p-1.5"
      >
        <label className="flex min-w-0 flex-[2] items-center gap-2.5 rounded-2xl px-4 py-2.5 sm:rounded-full">
          <GraduationCap size={18} className="shrink-0 text-maroon-800" />
          <span className="sr-only">University</span>
          <input
            list="uni-list"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a university…"
            className="w-full min-w-0 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
          <datalist id="uni-list">
            {universities.map((u) => (
              <option key={u.slug} value={u.name} />
            ))}
          </datalist>
        </label>

        <span className="hidden h-7 w-px bg-ink-200 sm:block" aria-hidden />

        <label className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 sm:rounded-full">
          <Sparkles size={18} className="shrink-0 text-maroon-800" />
          <span className="sr-only">Service type</span>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full cursor-pointer bg-transparent text-sm text-ink-900 focus:outline-none sm:w-36"
          >
            <option value="">Any service</option>
            <option value="CAMPUS_TOUR">In-person tour</option>
            <option value="VIDEO_CONSULTATION">Video consult</option>
          </select>
        </label>

        <span className="hidden h-7 w-px bg-ink-200 sm:block" aria-hidden />

        <label className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 sm:rounded-full">
          <Calendar size={18} className="shrink-0 text-maroon-800" />
          <span className="sr-only">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full cursor-pointer bg-transparent text-sm text-ink-900 focus:outline-none sm:w-36"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-maroon-900 px-7 text-sm font-semibold text-ivory shadow-soft transition-all duration-300 ease-premium hover:bg-maroon-800 hover:shadow-glow active:scale-[0.98] sm:rounded-full cursor-pointer"
        >
          <Search size={18} /> Search
        </button>
      </form>

      {variant === 'hero' && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-ivory/70">
          <span>Popular:</span>
          {POPULAR.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setQ(p);
                submit(undefined, p);
              }}
              className="rounded-full bg-white/10 px-3 py-1 text-ivory/90 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20 cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
