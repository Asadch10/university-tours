'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Footprints, Video, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar, formatDate } from '@/components/ui/calendar';
import { SERVICE_LABEL } from '@/lib/tour-types';
import { universities } from '@/lib/data';

type Segment = 'school' | 'date' | 'type' | null;

const TOUR_OPTIONS = [
  {
    value: 'CAMPUS_TOUR',
    icon: Footprints,
    label: SERVICE_LABEL.CAMPUS_TOUR,
    desc: 'Explore campus on a personalized tour tailored to your interests',
  },
  {
    value: 'VIDEO_CONSULTATION',
    icon: Video,
    label: SERVICE_LABEL.VIDEO_CONSULTATION,
    desc: 'Connect live with a current student and get the scoop from anywhere',
  },
  {
    value: 'CONSULTATION',
    icon: MessageSquare,
    label: SERVICE_LABEL.CONSULTATION,
    desc: 'A focused 1-on-1 advising session on admissions, essays, or student life',
  },
];

/* ─── Search bar ─────────────────────────────────────────────────────── */

export function GuideSearchBar({
  query,
  setQuery,
  date,
  setDate,
  service,
  setService,
  onExpandedChange,
}: {
  query: string;
  setQuery: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  service: string;
  setService: (v: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<Segment>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const schoolInputRef = useRef<HTMLInputElement>(null);

  // Notify the parent so it can hide adjacent UI (e.g. the Filters button).
  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setExpanded(false);
        setActive(null);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function open(segment: Segment) {
    setExpanded(true);
    setActive(segment);
    if (segment === 'school') setTimeout(() => schoolInputRef.current?.focus(), 0);
  }

  const schoolMatches = universities.filter((u) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.location.toLowerCase().includes(q);
  });

  const serviceLabel = TOUR_OPTIONS.find((t) => t.value === service)?.label;

  /* ── Collapsed pill ⇄ expanded bar (animated) ───────────────────── */
  return (
    <AnimatePresence mode="wait" initial={false}>
      {!expanded ? (
        <motion.div
          key="collapsed"
          ref={rootRef}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.985 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full items-center justify-center sm:w-auto"
        >
        <div className="flex w-full items-center rounded-full border border-ink-200 bg-surface shadow-sm sm:w-auto">
          <button
            type="button"
            onClick={() => open('school')}
            className="min-w-0 flex-1 rounded-l-full py-2.5 pl-4 pr-3 text-sm font-medium text-ink-900 hover:bg-ink-50/60 sm:flex-none sm:pl-5 sm:pr-4"
          >
            <span className="block truncate">{query || 'School'}</span>
          </button>
          <span className="h-6 w-px shrink-0 bg-ink-200" />
          <button
            type="button"
            onClick={() => open('date')}
            className="hidden px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-50/60 sm:block"
          >
            {date ? formatDate(date) : 'Date'}
          </button>
          <span className="hidden h-6 w-px bg-ink-200 sm:block" />
          <button
            type="button"
            onClick={() => open('type')}
            className="hidden px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-50/60 sm:block"
          >
            {service ? serviceLabel : 'Tour type'}
          </button>
          <button
            type="button"
            onClick={() => open('school')}
            aria-label="Search"
            className="mx-1.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-maroon-900 text-white transition-colors hover:bg-maroon-800"
          >
            <Search size={16} />
          </button>
        </div>
        </motion.div>
      ) : (
        <motion.div
          key="expanded"
          ref={rootRef}
          initial={{ opacity: 0, scale: 0.985, y: -3 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.985, y: -3 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
          className="relative flex w-full justify-center"
        >
      <div className="relative w-full max-w-3xl">
        <div className="flex flex-col gap-1 rounded-3xl border border-ink-200 bg-surface p-2 shadow-lift sm:flex-row sm:items-center sm:gap-0 sm:rounded-full">

          {/* School — wider than the rest */}
          <button
            type="button"
            onClick={() => open('school')}
            className={cn(
              'w-full rounded-2xl px-5 py-2.5 text-left transition-colors sm:w-auto sm:flex-[1.6] sm:rounded-full sm:px-6',
              active === 'school' ? 'bg-ink-50' : 'hover:bg-ink-50/60',
            )}
          >
            <span className="block whitespace-nowrap text-xs font-bold text-ink-900">School</span>
            <input
              ref={schoolInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setActive('school')}
              placeholder="Search schools"
              className="mt-0.5 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </button>

          <span
            className={cn(
              'hidden h-8 w-px sm:block',
              active === 'school' || active === 'date' ? 'bg-transparent' : 'bg-ink-200',
            )}
          />

          {/* Date */}
          <button
            type="button"
            onClick={() => open('date')}
            className={cn(
              'w-full rounded-2xl px-5 py-2.5 text-left transition-colors sm:w-auto sm:flex-[1.1] sm:rounded-full sm:px-6',
              active === 'date' ? 'bg-ink-50' : 'hover:bg-ink-50/60',
            )}
          >
            <span className="block whitespace-nowrap text-xs font-bold text-ink-900">Date</span>
            <span
              className={cn(
                'mt-0.5 block truncate whitespace-nowrap text-sm',
                date ? 'text-ink-900' : 'text-ink-400',
              )}
            >
              {date ? formatDate(date) : 'Add date'}
            </span>
          </button>

          <span
            className={cn(
              'hidden h-8 w-px sm:block',
              active === 'date' || active === 'type' ? 'bg-transparent' : 'bg-ink-200',
            )}
          />

          {/* Tour type */}
          <button
            type="button"
            onClick={() => open('type')}
            className={cn(
              'w-full rounded-2xl px-5 py-2.5 text-left transition-colors sm:w-auto sm:flex-[1.2] sm:rounded-full sm:px-6',
              active === 'type' ? 'bg-ink-50' : 'hover:bg-ink-50/60',
            )}
          >
            <span className="block whitespace-nowrap text-xs font-bold text-ink-900">Tour type</span>
            <span
              className={cn(
                'mt-0.5 block truncate whitespace-nowrap text-sm',
                service ? 'text-ink-900' : 'text-ink-400',
              )}
            >
              {service ? serviceLabel : 'Add tour type'}
            </span>
          </button>

          {/* Search button */}
          <button
            type="button"
            onClick={() => {
              setExpanded(false);
              setActive(null);
            }}
            aria-label="Search"
            className="mt-1 inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-maroon-900 text-white transition-colors hover:bg-maroon-800 sm:mt-0 sm:ml-2 sm:w-12 sm:rounded-full"
          >
            <Search size={18} />
            <span className="text-sm font-semibold sm:hidden">Search</span>
          </button>
        </div>

        {/* ── Dropdown panels — smooth open/close ──────────────────── */}
        <AnimatePresence>
        {active === 'school' && (
          <motion.div
            key="school"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-[calc(100%+0.75rem)] z-50 w-full max-w-[400px] origin-top overflow-hidden rounded-2xl border border-ink-200/80 bg-surface shadow-lift sm:w-[400px]"
          >
            <div className="max-h-[330px] overflow-y-auto p-2">
              {schoolMatches.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-400">No schools found</p>
              ) : (
                schoolMatches.map((u) => (
                  <button
                    key={u.slug}
                    type="button"
                    onClick={() => {
                      setQuery(u.name);
                      setActive('date');
                    }}
                    className="flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-brand-tint"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.image}
                      alt={u.name}
                      className="h-12 w-12 shrink-0 rounded-xl object-cover" loading="lazy" decoding="async"/>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">{u.name}</p>
                      <p className="truncate text-xs text-ink-500">{u.location}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => setActive(null)}
              className="block w-full border-t border-ink-100 px-5 py-3.5 text-center text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-50"
            >
              Suggest a new school
            </button>
          </motion.div>
        )}

        {/* ── Date calendar ────────────────────────────────────────── */}
        {active === 'date' && (
          <motion.div
            key="date"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-[calc(100%+0.75rem)] z-50 origin-top sm:left-1/4"
          >
            <Calendar
              value={date}
              onSelect={(v) => {
                setDate(v);
                setActive('type');
              }}
            />
          </motion.div>
        )}

        {/* ── Tour type dropdown ───────────────────────────────────── */}
        {active === 'type' && (
          <motion.div
            key="type"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-full max-w-[380px] origin-top overflow-hidden rounded-2xl border border-ink-200/80 bg-surface shadow-lift sm:right-14 sm:w-[380px]"
          >
            <p className="px-6 pb-3 pt-5 text-base font-bold text-ink-900">
              How would you like to tour?
            </p>
            {TOUR_OPTIONS.map(({ value, icon: Icon, label, desc }) => {
              const selected = service === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setService(selected ? '' : value);
                    setActive(null);
                  }}
                  className="flex w-full items-start gap-4 border-t border-ink-100 px-6 py-4 text-left transition-colors hover:bg-ink-50/60"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-900">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink-900">{label}</p>
                    <p className="mt-1 text-[0.8rem] leading-relaxed text-ink-500">{desc}</p>
                  </div>
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      selected ? 'border-brand' : 'border-ink-300',
                    )}
                  >
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-maroon-900" />}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
        </AnimatePresence>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
