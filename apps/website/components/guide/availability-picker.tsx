'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Video, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TIME_SLOTS,
  TOUR_TYPE_LABELS,
  ymd,
  labelForDate,
  sortTimes,
  type Availability,
  type ServiceType,
  type TypeAvailability,
} from '@/lib/availability';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const TYPE_ICON: Record<ServiceType, typeof MapPin> = {
  CAMPUS_TOUR: MapPin,
  VIDEO_CONSULTATION: Video,
  CONSULTATION: MessageSquare,
};

/**
 * Availability editor. Renders one section per selected tour type — each with a
 * multi-select date calendar and a single set of times shared across those dates.
 */
export function AvailabilityPicker({
  types,
  value,
  onChange,
}: {
  types: ServiceType[];
  value: Availability;
  onChange: (next: Availability) => void;
}) {
  if (!types.length) {
    return (
      <p className="text-sm text-ink-500">
        Select at least one tour type above, then set the dates and times you’re available for each.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {types.map((service) => (
        <TypeSection
          key={service}
          service={service}
          value={value[service] ?? { dates: [], times: [] }}
          onChange={(next) => onChange({ ...value, [service]: next })}
        />
      ))}
    </div>
  );
}

function TypeSection({
  service,
  value,
  onChange,
}: {
  service: ServiceType;
  value: TypeAvailability;
  onChange: (next: TypeAvailability) => void;
}) {
  const now = new Date();
  const todayKey = ymd(now.getFullYear(), now.getMonth(), now.getDate());
  const [cal, setCal] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const dates = new Set(value.dates);
  const Icon = TYPE_ICON[service];

  const monthLabel = new Date(cal.y, cal.m, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const firstWeekday = new Date(cal.y, cal.m, 1).getDay();
  const daysInMonth = new Date(cal.y, cal.m + 1, 0).getDate();
  const shiftMonth = (delta: number) => {
    const nm = cal.m + delta;
    setCal({ y: cal.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 });
  };

  const toggleDate = (key: string) => {
    onChange({
      ...value,
      dates: dates.has(key)
        ? value.dates.filter((d) => d !== key)
        : [...value.dates, key].sort(),
    });
  };
  const toggleTime = (time: string) => {
    onChange({
      ...value,
      times: value.times.includes(time)
        ? value.times.filter((t) => t !== time)
        : sortTimes([...value.times, time]),
    });
  };

  return (
    <div className="rounded-2xl border border-ink-200 bg-surface-2/60 p-4 sm:p-5">
      <p className="mb-4 inline-flex items-center gap-2 font-bold text-brand">
        <Icon size={16} /> {TOUR_TYPE_LABELS[service]}
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Dates */}
        <div>
          <p className="mb-2 text-sm font-semibold text-ink-900">Available dates</p>
          <div className="rounded-xl border border-ink-200 bg-surface p-3">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-ink-900">{monthLabel}</span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
              {WEEKDAYS.map((w) => (
                <span key={w} className="py-1 text-xs font-semibold text-ink-500">
                  {w}
                </span>
              ))}
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <span key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = ymd(cal.y, cal.m, day);
                const isPast = key < todayKey;
                const selected = dates.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isPast}
                    onClick={() => toggleDate(key)}
                    className={cn(
                      'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors',
                      isPast && 'cursor-not-allowed text-ink-300',
                      !isPast && !selected && 'text-ink-800 hover:bg-ink-100',
                      selected && 'bg-maroon-900 font-semibold text-ivory hover:bg-maroon-800',
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Times (shared across all selected dates) */}
        <div>
          <p className="mb-2 text-sm font-semibold text-ink-900">Available times</p>
          <p className="mb-2 text-xs text-ink-500">Applies to every date you selected.</p>
          <div className="flex flex-wrap gap-2">
            {TIME_SLOTS.map((t) => {
              const on = value.times.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTime(t)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium tabular-nums transition-colors',
                    on
                      ? 'border-brand bg-maroon-900 text-ivory'
                      : 'border-ink-200 text-ink-700 hover:border-ink-400',
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inline hints */}
      {(value.dates.length === 0 || value.times.length === 0) && (
        <p className="mt-3 text-xs font-semibold text-red-600">
          {value.dates.length === 0 && value.times.length === 0
            ? 'Pick at least one date and one time for this tour type.'
            : value.dates.length === 0
              ? 'Pick at least one date for this tour type.'
              : 'Pick at least one time for this tour type.'}
        </p>
      )}
      {value.dates.length > 0 && value.times.length > 0 && (
        <p className="mt-3 text-xs text-ink-500">
          {value.dates.length} date{value.dates.length > 1 ? 's' : ''} · {value.times.length} time
          {value.times.length > 1 ? 's' : ''}:{' '}
          {value.dates.map(labelForDate).join(', ')}
        </p>
      )}
    </div>
  );
}
