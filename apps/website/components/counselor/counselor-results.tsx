'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  SlidersHorizontal,
  SearchX,
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { counselorsApi } from '@/lib/client-api';
import { counselorFromDto, type Counselor } from '@/lib/counselors';

/**
 * Browse College Counselors.
 *
 * Deliberately the same page architecture as SearchResults (Browse guides): a pill
 * search bar over a bordered strip, a Filters pill opening a modal with FilterGroup
 * sections, a count + sort row, a 4-up card grid, and the same empty state and
 * pagination. Only the filter *dimensions* differ — counselors have specialties and
 * experience rather than gender, academic year, and admission type.
 */

type Sort = 'recommended' | 'rating' | 'experience';

const PAGE_SIZE = 20;

const EXPERIENCE_BUCKETS = ['Less than 2', '2–5', '6–10', '11–20', '20+'];

/** "11–20" → 11, so the experience sort/filter can order the buckets. */
function yearsRank(v: string): number {
  const m = v.match(/\d+/);
  return m ? Number(m[0]) : 0;
}

function toggle(list: string[], set: (v: string[]) => void, value: string) {
  set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
}

/* ─── Counselor card ─────────────────────────────────────────────────── */

function CounselorCard({ c }: { c: Counselor }) {
  return (
    <Link href={`/browse-counselors/${c.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.photo} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
        <span className="pointer-events-none absolute left-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-ink-800 opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
          <ChevronLeft size={16} />
        </span>
        <span className="pointer-events-none absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-ink-800 opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
          <ChevronRight size={16} />
        </span>
        <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
          {[0, 1, 2].map((d) => (
            <span
              key={d}
              className={cn('h-1.5 w-1.5 rounded-full', d === 0 ? 'bg-surface' : 'bg-surface/55')}
            />
          ))}
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 text-[0.95rem] font-bold leading-snug text-ink-900">
        {c.headline}
      </h3>
      <p className="mt-1.5 flex items-center gap-1.5 text-[0.8rem] text-ink-600">
        <span>{c.name}</span>
        {c.rating !== null && (
          <>
            <span className="text-ink-300">·</span>
            <Star size={12} className="fill-ink-900 text-ink-900" />
            <span>
              {c.rating.toFixed(1)} ({c.reviews})
            </span>
          </>
        )}
      </p>
      <p className="mt-0.5 text-[0.8rem] text-ink-500">
        {c.organization || 'Independent counselor'}
      </p>
    </Link>
  );
}

/* ─── Filter pill (modal option) ─────────────────────────────────────── */

function FilterPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'rounded-xl border px-4 py-3.5 text-sm font-medium transition-colors',
        selected
          ? 'border-ink-900 bg-ink-100 text-ink-900'
          : 'border-ink-200 bg-surface text-ink-700 hover:bg-ink-50',
      )}
    >
      {label}
    </button>
  );
}

/* ─── Browse college counselors ──────────────────────────────────────── */

export function CounselorResults({ initialQuery = '' }: { initialQuery?: string }) {
  const [all, setAll] = useState<Counselor[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<Sort>('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Category filters (multi-select), mirroring the guide page's modal.
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [experience, setExperience] = useState<string[]>([]);

  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    counselorsApi
      .list()
      .then((res) => {
        if (active) setAll((res.data ?? []).map(counselorFromDto));
      })
      .catch(() => {
        /* Browse still renders its empty state if the fetch fails. */
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Specialty options come from the live data, so the modal never offers a filter
  // that would return nothing.
  const specialtyOptions = useMemo(
    () => Array.from(new Set(all.flatMap((c) => c.specialties))).sort(),
    [all],
  );

  const activeFilterCount = specialties.length + experience.length;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = all.filter((c) => {
      if (specialties.length && !specialties.some((s) => c.specialties.includes(s))) return false;
      if (experience.length && !experience.includes(c.yearsExperience)) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        c.organization.toLowerCase().includes(q) ||
        c.credentials.toLowerCase().includes(q) ||
        c.specialties.some((s) => s.toLowerCase().includes(q))
      );
    });

    if (sort === 'rating') return [...out].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    if (sort === 'experience')
      return [...out].sort((a, b) => yearsRank(b.yearsExperience) - yearsRank(a.yearsExperience));
    return out;
  }, [all, query, specialties, experience, sort]);

  // Any filter change invalidates the current page.
  useEffect(() => {
    setPage(1);
  }, [query, specialties, experience, sort]);

  // Lock background scroll while the filters modal is open — same as Browse guides.
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [filtersOpen]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function goToPage(p: number) {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function clearAllFilters() {
    setSpecialties([]);
    setExperience([]);
  }

  return (
    <div>
      {/* ── Centered pill search bar ────────────────────────────────── */}
      <div className="border-b border-ink-100 py-4">
        <div className="container-page flex flex-wrap items-start justify-center gap-3">
          <div className="relative w-full max-w-xl">
            <Search
              size={17}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, specialty, or practice"
              aria-label="Search counselors"
              className="w-full rounded-full border border-ink-200 bg-surface py-3 pl-12 pr-5 text-sm text-ink-900 placeholder:text-ink-400 shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-ink-200 bg-surface px-5 py-2.5 text-sm font-medium text-ink-900 shadow-sm transition-colors hover:bg-ink-50"
          >
            <SlidersHorizontal size={15} /> Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon-900 px-1.5 text-[0.7rem] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      <div className="blog-wrap py-8">
        <div ref={topRef} className="scroll-mt-[calc(var(--header-h)+1rem)]" />

        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink-900">
            {results.length.toLocaleString()} counselor{results.length === 1 ? '' : 's'}
            {query && (
              <>
                {' '}
                for <span className="text-brand">“{query}”</span>
              </>
            )}
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort by"
            className="cursor-pointer rounded-full border border-ink-200 bg-surface px-4 py-2 text-sm text-ink-800 focus:border-brand focus:outline-none"
          >
            <option value="recommended">Recommended</option>
            <option value="rating">Top rated</option>
            <option value="experience">Most experienced</option>
          </select>
        </div>

        {results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pageItems.map((c) => (
                <CounselorCard key={c.id} c={c} />
              ))}
            </div>
            <Pagination
              currentPage={current}
              totalPages={totalPages}
              onPageChange={goToPage}
              className="mt-12"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-300 bg-surface/60 px-6 py-20 text-center">
            <SearchX size={40} className="text-ink-300" />
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">
              {loaded && all.length === 0 ? 'No counselors yet' : 'No counselors match'}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-ink-500">
              {loaded && all.length === 0
                ? 'No counselors have been approved yet — check back soon.'
                : 'Try clearing some filters or searching for another specialty.'}
            </p>
            {!(loaded && all.length === 0) && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-6 rounded-xl bg-maroon-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-maroon-800"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Filters modal ───────────────────────────────────────────── */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Scrim */}
          <div
            className="absolute inset-0 bg-canvas/80"
            onClick={() => setFiltersOpen(false)}
            aria-hidden
          />

          {/* Panel */}
          <div className="relative flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-surface shadow-lift">
            {/* Header */}
            <div className="relative flex shrink-0 items-center justify-center border-b border-ink-100 px-6 py-5">
              <h2 className="font-display text-lg font-bold text-ink-900">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="absolute right-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-ink-700 transition-colors hover:bg-ink-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <FilterGroup
                title="Specialty"
                options={specialtyOptions}
                selected={specialties}
                onToggle={(v) => toggle(specialties, setSpecialties, v)}
                emptyHint="Specialties appear here once counselors are approved."
              />
              <FilterGroup
                title="Years of experience"
                options={EXPERIENCE_BUCKETS}
                selected={experience}
                onToggle={(v) => toggle(experience, setExperience, v)}
                last
              />
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-ink-100 px-6 py-4">
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-sm font-semibold text-ink-900 underline-offset-2 hover:underline"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-xl bg-maroon-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
              >
                Show {results.length.toLocaleString()} counselor{results.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Modal filter group ─────────────────────────────────────────────── */

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
  last = false,
  emptyHint,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  last?: boolean;
  /** Shown instead of the grid when there are no options to offer yet. */
  emptyHint?: string;
}) {
  return (
    <div className={cn(!last && 'border-b border-ink-100 pb-6', 'mb-6 last:mb-0')}>
      <h3 className="mb-4 text-base font-bold text-ink-900">{title}</h3>
      {options.length === 0 && emptyHint ? (
        <p className="text-sm text-ink-500">{emptyHint}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <FilterPill
              key={opt}
              label={opt}
              selected={selected.includes(opt)}
              onClick={() => onToggle(opt)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
