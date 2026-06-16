import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format integer cents as USD (the platform stores all money as integer cents). */
export function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Compact number, e.g. 12_400 → "12.4k". */
export function formatCompact(n: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** ISO timestamp → "Jun 15, 2026". Deterministic (UTC) to stay SSR-safe. */
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** ISO timestamp → "Jun 15, 2026 · 2:30 PM". */
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

/** Relative time, e.g. "3h ago". `now` is injected so it stays deterministic on the server. */
export function timeAgo(iso: string, now: number = Date.parse('2026-06-15T15:00:00Z')) {
  const diff = now - Date.parse(iso);
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

/** Initials from a full name, e.g. "Priya Nair" → "PN". */
export function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Title-case a SNAKE_CASE enum, e.g. "CAMPUS_TOUR" → "Campus Tour". */
export function humanize(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Convert rows of objects to a CSV string. */
export function toCsv<T extends Record<string, unknown>>(rows: T[], columns?: (keyof T)[]) {
  if (rows.length === 0) return '';
  const keys = (columns ?? (Object.keys(rows[0]!) as (keyof T)[])) as (keyof T)[];
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = keys.map((k) => escape(k)).join(',');
  const body = rows.map((r) => keys.map((k) => escape(r[k])).join(',')).join('\n');
  return `${header}\n${body}`;
}

/** Trigger a client-side CSV download. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Simulate an async backend call (resolves after `ms`). Swap for real @ucpt/sdk calls later. */
export function simulate<T>(value: T, ms = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
