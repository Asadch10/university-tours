'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SlidersHorizontal, SearchX, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { GuideSearchBar } from '@/components/search/guide-search-bar';
import { Pagination } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { universities } from '@/lib/data';

type Sort = 'recommended' | 'rating' | 'price-asc' | 'price-desc';
type Service = 'CAMPUS_TOUR' | 'VIDEO_CONSULTATION';

/* ─── Filter option sets ─────────────────────────────────────────────── */

const GENDERS = ['Male', 'Female', 'Non-binary'];
const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate student'];
const ADMISSIONS = ['Admitted as a freshman', 'Transfer student'];
const FOCUSES = ['STEM', 'Business', 'Humanities', 'Arts', 'Social Sciences', 'Pre-Med', 'Pre-Law'];

type Guide = {
  id: string;
  headline: string;
  name: string;
  university: string;
  rating: number;
  reviews: number;
  photo: string;
  price: number; // cents
  services: Service[];
  gender: string;
  year: string;
  admission: string;
  focus: string;
};

const PAGE_SIZE = 20;

/* ─── Dummy guide data ───────────────────────────────────────────────── */

const HEADLINES = [
  'Biology Student @ Columbia University',
  'CS Junior sharing real research culture & startup life',
  'Economics Senior & House tour guide',
  'Film & TV student giving behind-the-scenes campus tours',
  'Dual-Degree Student in the Huntsman Program',
  'MIMG Major, Global Health Minor, Pre-Med Student & Dancer :)',
  'Stern Finance Senior navigating an urban campus',
  'Pre-Med & Orientation Leader who loves Ann Arbor',
  'Data Science junior exploring cafés & Bay Area energy',
  'Journalism student showing the real neighborhood life',
  'Mechanical Engineering & robotics team captain',
  'Architecture student with a love for campus design',
  'Political Science major & varsity athlete',
  'Neuroscience student and peer mentor',
  'Business + Music double major, campus tour veteran',
  'Public Health senior passionate about community',
  'English Lit student & campus poetry club lead',
  'Aerospace Engineering junior and maker',
  'Psychology major & student government rep',
  'Marine Science student who knows every hidden spot',
];

const NAMES = [
  'Rachel B', 'Ujala C', 'Eric L', 'Sara H', 'Maya R', 'Daniel O', 'Sofia M', 'Aiden C',
  'Priya N', 'Jordan B', 'Olivia B', 'Hannah C', 'Liam K', 'Noah P', 'Emma W', 'Ava T',
  'Lucas D', 'Mia G', 'Ethan R', 'Isabella F', 'Mason H', 'Charlotte S', 'Logan M', 'Amelia V',
  'James L', 'Harper N', 'Benjamin O', 'Evelyn Q', 'Henry Z', 'Abigail Y',
];

const PHOTOS = [
  47, 45, 12, 33, 44, 15, 5, 32, 9, 13, 25, 51, 60, 14, 16, 20, 3, 7, 11, 24,
  31, 36, 40, 48, 52, 56, 59, 62, 65, 68,
];

const GUIDES: Guide[] = NAMES.map((name, i) => {
  const uni = universities[i % universities.length]!;
  const ratingChoices = [5.0, 4.9, 4.8, 5.0, 4.7];
  return {
    id: `g${i + 1}`,
    headline: HEADLINES[i % HEADLINES.length]!,
    name,
    university: uni.name,
    rating: ratingChoices[i % ratingChoices.length]!,
    reviews: 4 + ((i * 7) % 40),
    photo: `https://i.pravatar.cc/600?img=${PHOTOS[i % PHOTOS.length]}`,
    price: 4000 + ((i % 7) * 500),
    services:
      i % 3 === 0
        ? ['CAMPUS_TOUR']
        : i % 3 === 1
          ? ['CAMPUS_TOUR', 'VIDEO_CONSULTATION']
          : ['VIDEO_CONSULTATION'],
    gender: GENDERS[i % GENDERS.length]!,
    year: YEARS[i % YEARS.length]!,
    admission: ADMISSIONS[i % ADMISSIONS.length]!,
    focus: FOCUSES[i % FOCUSES.length]!,
  };
});

/* ─── Guide card ─────────────────────────────────────────────────────── */

function GuideCard({ g }: { g: Guide }) {
  return (
    <Link href={`/ambassadors/${g.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={g.photo}
          alt={g.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <span className="pointer-events-none absolute left-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-800 opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
          <ChevronLeft size={16} />
        </span>
        <span className="pointer-events-none absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-800 opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
          <ChevronRight size={16} />
        </span>
        <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
          {[0, 1, 2].map((d) => (
            <span
              key={d}
              className={cn('h-1.5 w-1.5 rounded-full', d === 0 ? 'bg-white' : 'bg-white/55')}
            />
          ))}
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 text-[0.95rem] font-bold leading-snug text-ink-900">
        {g.headline}
      </h3>
      <p className="mt-1.5 flex items-center gap-1.5 text-[0.8rem] text-ink-600">
        <span>{g.name}</span>
        <span className="text-ink-300">·</span>
        <Star size={12} className="fill-ink-900 text-ink-900" />
        <span>
          {g.rating.toFixed(1)} ({g.reviews})
        </span>
      </p>
      <p className="mt-0.5 text-[0.8rem] text-ink-500">{g.university}</p>
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
          : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
      )}
    >
      {label}
    </button>
  );
}

/* ─── Browse tour guides ─────────────────────────────────────────────── */

export function SearchResults({
  initialQuery = '',
  initialService = '',
}: {
  initialQuery?: string;
  initialService?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [date, setDate] = useState('');
  const [service, setService] = useState(initialService);
  const [sort, setSort] = useState<Sort>('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [barExpanded, setBarExpanded] = useState(false);
  const [page, setPage] = useState(1);

  // Category filters (multi-select)
  const [genders, setGenders] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [admissions, setAdmissions] = useState<string[]>([]);
  const [focuses, setFocuses] = useState<string[]>([]);

  const topRef = useRef<HTMLDivElement>(null);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const activeFilterCount =
    genders.length + years.length + admissions.length + focuses.length;

  const results = useMemo(() => {
    let list = GUIDES.filter((g) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !query ||
        g.university.toLowerCase().includes(q) ||
        g.name.toLowerCase().includes(q) ||
        g.headline.toLowerCase().includes(q);
      const matchesService = !service || g.services.includes(service as Service);
      const matchesGender = genders.length === 0 || genders.includes(g.gender);
      const matchesYear = years.length === 0 || years.includes(g.year);
      const matchesAdmission = admissions.length === 0 || admissions.includes(g.admission);
      const matchesFocus = focuses.length === 0 || focuses.includes(g.focus);
      return (
        matchesQuery &&
        matchesService &&
        matchesGender &&
        matchesYear &&
        matchesAdmission &&
        matchesFocus
      );
    });
    list = [...list].sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      return b.reviews - a.reviews;
    });
    return list;
  }, [query, service, genders, years, admissions, focuses, sort]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, service, genders, years, admissions, focuses, sort]);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [filtersOpen]);

  const current = Math.min(page, totalPages);
  const pageItems = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function goToPage(p: number) {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function clearAllFilters() {
    setGenders([]);
    setYears([]);
    setAdmissions([]);
    setFocuses([]);
  }

  return (
    <div>
      {/* ── Centered pill search bar ────────────────────────────────── */}
      <div className="border-b border-ink-100 py-4">
        <div className="container-page flex items-start justify-center gap-3">
          <GuideSearchBar
            query={query}
            setQuery={setQuery}
            date={date}
            setDate={setDate}
            service={service}
            setService={setService}
            onExpandedChange={setBarExpanded}
          />

          {/* Filters pill — hidden while the search bar is expanded */}
          {!barExpanded && (
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-ink-200 bg-white px-5 py-2.5 text-sm font-medium text-ink-900 shadow-sm transition-colors hover:bg-ink-50"
            >
              <SlidersHorizontal size={15} /> Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon-900 px-1.5 text-[0.7rem] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      <div className="container-page py-8">
        <div ref={topRef} className="scroll-mt-[calc(var(--header-h)+1rem)]" />

        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink-900">
            {results.length.toLocaleString()} guide{results.length === 1 ? '' : 's'}
            {query && (
              <>
                {' '}
                for <span className="text-maroon-900">“{query}”</span>
              </>
            )}
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort by"
            className="cursor-pointer rounded-full border border-ink-200 bg-white px-4 py-2 text-sm text-ink-800 focus:border-maroon-800 focus:outline-none"
          >
            <option value="recommended">Recommended</option>
            <option value="rating">Top rated</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>

        {results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pageItems.map((g) => (
                <GuideCard key={g.id} g={g} />
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
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-300 bg-white/60 px-6 py-20 text-center">
            <SearchX size={40} className="text-ink-300" />
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">No guides match</h3>
            <p className="mt-2 max-w-sm text-sm text-ink-500">
              Try clearing some filters or searching another university.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-6 rounded-xl bg-maroon-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-maroon-800"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── Filters modal ───────────────────────────────────────────── */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Scrim */}
          <div
            className="absolute inset-0 bg-ink-900/50"
            onClick={() => setFiltersOpen(false)}
            aria-hidden
          />

          {/* Panel */}
          <div className="relative flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-lift">
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
                title="Gender"
                options={GENDERS}
                selected={genders}
                onToggle={(v) => toggle(genders, setGenders, v)}
              />
              <FilterGroup
                title="Current academic year"
                options={YEARS}
                selected={years}
                onToggle={(v) => toggle(years, setYears, v)}
              />
              <FilterGroup
                title="Admission type"
                options={ADMISSIONS}
                selected={admissions}
                onToggle={(v) => toggle(admissions, setAdmissions, v)}
              />
              <FilterGroup
                title="Academic focus"
                options={FOCUSES}
                selected={focuses}
                onToggle={(v) => toggle(focuses, setFocuses, v)}
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
                Show {results.length.toLocaleString()} guide{results.length === 1 ? '' : 's'}
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
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  last?: boolean;
}) {
  return (
    <div className={cn(!last && 'border-b border-ink-100 pb-6', 'mb-6 last:mb-0')}>
      <h3 className="mb-4 text-base font-bold text-ink-900">{title}</h3>
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
    </div>
  );
}
