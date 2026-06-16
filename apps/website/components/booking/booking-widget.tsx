'use client';

import { useState } from 'react';
import {
  Footprints,
  Video,
  Check,
  ShieldCheck,
  Clock,
  MessageCircle,
  CalendarCheck,
  Send,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import type { Ambassador } from '@/lib/data';

const DURATIONS = [
  { minutes: 60, label: '1 hour', mult: 1 },
  { minutes: 90, label: '90 minutes', mult: 1.4 },
  { minutes: 120, label: '2 hours', mult: 1.8 },
];

type View = 'form' | 'message';
type Status = 'idle' | 'submitting' | 'requested' | 'messaged';

function formatWhen(date: string, time: string) {
  if (!date) return '';
  const d = new Date(`${date}T${time || '00:00'}`);
  if (Number.isNaN(d.getTime())) return `${date} ${time}`.trim();
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(time ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

export function BookingWidget({ a }: { a: Ambassador }) {
  const firstName = a.name.split(' ')[0];
  const [service, setService] = useState<Ambassador['services'][number]>(a.services[0]!);
  const [duration, setDuration] = useState(DURATIONS[0]!);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [view, setView] = useState<View>('form');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const price = Math.round((a.priceFrom * duration.mult) / 100) * 100;
  const ready = Boolean(date && time);
  const serviceLabel = service === 'CAMPUS_TOUR' ? 'Private in-person tour' : 'Video consultation';

  const submitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || status === 'submitting') return;
    setStatus('submitting');
    // Simulated request — swap for a real @ucpt/sdk booking call when the backend is wired.
    setTimeout(() => setStatus('requested'), 900);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || status === 'submitting') return;
    setStatus('submitting');
    setTimeout(() => setStatus('messaged'), 900);
  };

  const reset = () => {
    setStatus('idle');
    setView('form');
    setMessage('');
  };

  // ---- Confirmation: booking requested ----
  if (status === 'requested') {
    return (
      <div className="rounded-3xl border border-ink-200/70 bg-white p-6 shadow-card">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-verified/10 text-verified">
            <CalendarCheck size={26} />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold text-maroon-900">Request sent</h3>
          <p className="mt-1.5 text-sm text-ink-600">
            {firstName} has been notified and typically responds {a.responseTime}. You won’t be charged
            until they accept.
          </p>
        </div>

        <dl className="mt-5 space-y-2.5 rounded-2xl bg-cream/60 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-500">Service</dt>
            <dd className="text-right font-medium text-ink-900">{serviceLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-500">Duration</dt>
            <dd className="text-right font-medium text-ink-900">{duration.label}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-500">When</dt>
            <dd className="text-right font-medium text-ink-900">{formatWhen(date, time)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-ink-200/70 pt-2.5">
            <dt className="text-ink-500">Total if accepted</dt>
            <dd className="text-right font-semibold text-maroon-900">{formatPrice(price)}</dd>
          </div>
        </dl>

        <Button variant="outline" size="md" className="mt-5 w-full" onClick={reset}>
          <ArrowLeft size={16} /> Back to booking
        </Button>
      </div>
    );
  }

  // ---- Confirmation: message sent ----
  if (status === 'messaged') {
    return (
      <div className="rounded-3xl border border-ink-200/70 bg-white p-6 shadow-card">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-maroon-50 text-maroon-800">
            <Send size={24} />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold text-maroon-900">Message sent</h3>
          <p className="mt-1.5 text-sm text-ink-600">
            Your message is on its way to {firstName}. You’ll get a reply {a.responseTime}.
          </p>
        </div>
        <Button variant="outline" size="md" className="mt-5 w-full" onClick={reset}>
          <ArrowLeft size={16} /> Back to booking
        </Button>
      </div>
    );
  }

  // ---- Message composer ----
  if (view === 'message') {
    return (
      <form onSubmit={sendMessage} className="rounded-3xl border border-ink-200/70 bg-white p-6 shadow-card">
        <button
          type="button"
          onClick={() => setView('form')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-maroon-900"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h3 className="mt-3 font-display text-xl font-bold text-maroon-900">Message {firstName}</h3>
        <p className="mt-1 text-sm text-ink-600">
          Ask a question before you book — no charge for messaging.
        </p>
        <label htmlFor="bw-message" className="sr-only">
          Your message
        </label>
        <textarea
          id="bw-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          required
          placeholder={`Hi ${firstName}, I'd love to hear about life at ${a.university}…`}
          className="mt-4 w-full resize-none rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15"
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-4 w-full"
          disabled={!message.trim() || status === 'submitting'}
        >
          {status === 'submitting' ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send size={16} /> Send message
            </>
          )}
        </Button>
      </form>
    );
  }

  // ---- Booking form ----
  return (
    <form onSubmit={submitRequest} className="rounded-3xl border border-ink-200/70 bg-white p-6 shadow-card">
      <div className="flex items-baseline justify-between">
        <p>
          <span className="font-display text-3xl font-bold text-maroon-900">{formatPrice(price)}</span>
          <span className="text-sm text-ink-500"> / session</span>
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm text-ink-500">
          <Clock size={14} /> {a.responseTime}
        </span>
      </div>

      {/* Service */}
      <div className="mt-5">
        <p className="text-sm font-semibold text-ink-900">Service</p>
        <div className="mt-2 grid grid-cols-1 gap-2">
          {a.services.map((s) => {
            const Icon = s === 'CAMPUS_TOUR' ? Footprints : Video;
            const label = s === 'CAMPUS_TOUR' ? 'Private in-person tour' : 'Video consultation';
            const active = service === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setService(s)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all cursor-pointer',
                  active
                    ? 'border-maroon-800 bg-maroon-50 text-maroon-900 ring-1 ring-maroon-800/20'
                    : 'border-ink-200 text-ink-700 hover:border-maroon-800/40',
                )}
              >
                <Icon size={18} className={active ? 'text-maroon-800' : 'text-ink-400'} />
                <span className="font-medium">{label}</span>
                {active && <Check size={16} className="ml-auto text-maroon-800" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <div className="mt-5">
        <p className="text-sm font-semibold text-ink-900">Duration</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => {
            const active = duration.minutes === d.minutes;
            return (
              <button
                key={d.minutes}
                type="button"
                onClick={() => setDuration(d)}
                className={cn(
                  'rounded-xl border px-2 py-2.5 text-center text-sm transition-all cursor-pointer',
                  active
                    ? 'border-maroon-800 bg-maroon-50 text-maroon-900'
                    : 'border-ink-200 text-ink-600 hover:border-maroon-800/40',
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date + time */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="bw-date" className="text-sm font-semibold text-ink-900">
            Date
          </label>
          <input
            id="bw-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 w-full cursor-pointer rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15"
          />
        </div>
        <div>
          <label htmlFor="bw-time" className="text-sm font-semibold text-ink-900">
            Time
          </label>
          <input
            id="bw-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-2 w-full cursor-pointer rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15"
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="mt-6 w-full"
        disabled={!ready || status === 'submitting'}
      >
        {status === 'submitting' ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Sending request…
          </>
        ) : ready ? (
          'Request to book'
        ) : (
          'Select a date & time'
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="md"
        className="mt-2.5 w-full"
        onClick={() => setView('message')}
      >
        <MessageCircle size={16} /> Message {firstName}
      </Button>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink-500">
        <ShieldCheck size={14} className="text-verified" /> You won’t be charged until {firstName} accepts.
      </p>
    </form>
  );
}
