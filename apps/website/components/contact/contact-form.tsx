'use client';

import * as React from 'react';
import { Send, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { contactApi, friendlyError } from '@/lib/client-api';

const TOPICS = [
  'General question',
  'Booking a tour',
  'Becoming a guide',
  'Trust & safety',
  'Press & partnerships',
  'Something else',
] as const;

const fieldClass =
  'w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15';

const labelClass = 'mb-1.5 block text-sm font-semibold text-ink-800';

export function ContactForm() {
  const [submitted, setSubmitted] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get('name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    const topic = String(fd.get('topic') ?? '').trim();
    const message = String(fd.get('message') ?? '').trim();

    if (!name || !email || !topic || !message) {
      setError('Please fill in your name, email, a topic, and a message.');
      return;
    }

    setError('');
    setSending(true);
    try {
      await contactApi.submit({ name, email, topic, message });
      setSubmitted(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex h-full flex-col items-center justify-center rounded-4xl border border-ink-200/70 bg-white p-8 text-center shadow-soft sm:p-12"
      >
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-verified/10 text-verified">
          <CheckCircle2 size={32} />
        </span>
        <h3 className="mt-6 font-display text-2xl font-semibold text-ink-900">
          Message sent — thank you!
        </h3>
        <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-ink-600">
          Our team has your note and will get back to you within one business day. Keep an eye on
          your inbox.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-8"
          onClick={() => {
            setSubmitted(false);
            setError('');
          }}
        >
          Send another message <ArrowRight size={16} />
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-4xl border border-ink-200/70 bg-white p-6 shadow-soft sm:p-8"
    >
      <fieldset disabled={sending} className="space-y-5">
        <legend className="sr-only">Contact form</legend>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className={labelClass}>
              Full name
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Jordan Avery"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="contact-email" className={labelClass}>
              Email address
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-topic" className={labelClass}>
            Topic
          </label>
          <select id="contact-topic" name="topic" defaultValue="" required className={cn(fieldClass, 'pr-10')}>
            <option value="" disabled>
              Choose a topic…
            </option>
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-message" className={labelClass}>
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            required
            placeholder="Tell us how we can help…"
            className={cn(fieldClass, 'resize-y')}
          />
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-ink-500">
            We typically reply within one business day. Your details stay private.
          </p>
          <Button type="submit" variant="primary" size="lg" className="shrink-0" disabled={sending}>
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Sending…
              </>
            ) : (
              <>
                Send message <Send size={16} />
              </>
            )}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
