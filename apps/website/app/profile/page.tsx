'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  ArrowRight,
  Camera,
  User,
  Mail,
  FileText,
  Settings,
  GraduationCap,
  CalendarDays,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';
import { accountApi, reviewsApi, tokenStore, friendlyError, type ReviewDto } from '@/lib/client-api';
import { updateSessionUser } from '@/lib/auth';
import { useToast } from '@/lib/toast';

const inputClasses =
  'w-full rounded-xl border border-ink-200 bg-surface px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15';

function Labeled({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink-900">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [photo, setPhoto] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  // Any other profileJson fields we loaded — preserved verbatim on save.
  const [extra, setExtra] = useState<Record<string, unknown>>({});
  // Snapshot of the loaded values, so we only show "Save changes" once something
  // actually differs (name, bio, or photo).
  const [initial, setInitial] = useState({ firstName: '', lastName: '', bio: '', photo: null as string | null });

  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const photoInput = useRef<HTMLInputElement>(null);

  function splitName(full: string) {
    const parts = full.trim().split(/\s+/).filter(Boolean);
    setFirstName(parts[0] ?? '');
    setLastName(parts.slice(1).join(' '));
  }

  useEffect(() => {
    const u = tokenStore.user;
    if (!u) {
      router.replace('/login');
      return;
    }
    setEmail(u.email ?? '');
    splitName(u.name ?? '');

    accountApi
      .getMe()
      .then((me) => {
        const p = (me.profileJson ?? {}) as Record<string, unknown>;
        setExtra(p);
        const parts = (me.name ?? '').trim().split(/\s+/).filter(Boolean);
        const fn = parts[0] ?? '';
        const ln = parts.slice(1).join(' ');
        const b = typeof p.bio === 'string' ? p.bio : '';
        const ph = typeof p.photo === 'string' ? p.photo : null;
        setEmail(me.email ?? '');
        setFirstName(fn);
        setLastName(ln);
        setBio(b);
        setPhoto(ph);
        setInitial({ firstName: fn, lastName: ln, bio: b, photo: ph });
        // Reviews received by this user (as a guide).
        return reviewsApi.forUser(me.id).catch(() => null);
      })
      .then((res) => {
        if (res) setReviews(res.data);
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhoto(URL.createObjectURL(file));
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const initials =
    fullName
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const name = fullName || (typeof extra.name === 'string' ? extra.name : '');
    // Merge into the previously-loaded profileJson so nothing is dropped.
    const profileJson: Record<string, unknown> = {
      ...extra,
      name,
      bio,
      ...(photo && /^https?:\/\//.test(photo) ? { photo } : {}),
    };
    try {
      const me = await accountApi.updateMe({ name, profileJson });
      updateSessionUser({ name: me.name });
      // Baseline is now the saved state, so the button hides again until the next edit.
      setInitial({ firstName, lastName, bio, photo });
      toast.success('Profile saved', 'Your changes have been updated.');
    } catch (e) {
      toast.error('Could not save profile', friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-canvas">
        <Loader2 className="animate-spin text-brand" size={28} />
      </main>
    );
  }

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  // Only surface "Save changes" once the user has actually edited something.
  const dirty =
    firstName !== initial.firstName ||
    lastName !== initial.lastName ||
    bio !== initial.bio ||
    photo !== initial.photo;

  const quickLinks = [
    { href: '/settings', label: 'Account settings', desc: 'Password, college & payouts', icon: Settings },
    { href: '/manage-listing', label: 'Manage listing', desc: 'Your guide profile', icon: GraduationCap },
    { href: '/my-tours', label: 'My tours', desc: 'Bookings & schedule', icon: CalendarDays },
  ];

  return (
    <main className="min-h-dvh bg-canvas pb-20 pt-[calc(var(--header-h)+1.5rem)]">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">My profile</h1>
          <p className="mt-1.5 text-[0.95rem] text-ink-500">
            Manage how you appear across University Campus Private Tours.
          </p>
        </div>

        {/* ── Header banner ───────────────────────────────────────────── */}
        <section className="overflow-hidden rounded-3xl border border-ink-200/70 bg-surface shadow-card">
          <div className="relative h-32 bg-maroon-gradient sm:h-40">
            <div className="bg-grid absolute inset-0 opacity-20" aria-hidden />
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-gold-500/15 blur-3xl" aria-hidden />
          </div>
          <div className="px-6 pb-6 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4 sm:gap-5">
                <div className="relative -mt-14 shrink-0 sm:-mt-16">
                  <span className="inline-flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-maroon-gradient font-display text-4xl font-bold text-ivory shadow-lift ring-4 ring-white">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="Your profile" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => photoInput.current?.click()}
                    aria-label="Change photo"
                    className="absolute -bottom-1.5 -right-1.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-surface text-brand shadow-soft transition-colors hover:bg-brand-tint"
                  >
                    <Camera size={16} />
                  </button>
                  <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                </div>
                <div className="min-w-0 pb-1">
                  <h2 className="truncate font-display text-2xl font-semibold text-ink-900">
                    {fullName || 'Your name'}
                  </h2>
                  {email && (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-500">
                      <Mail size={14} className="shrink-0 text-ink-400" /> {email}
                    </p>
                  )}
                </div>
              </div>

              {reviews.length > 0 && (
                <div className="pb-1">
                  <div className="inline-flex items-center gap-3 rounded-2xl border border-ink-200 bg-surface px-4 py-2.5 shadow-soft">
                    <span className="font-display text-2xl font-bold leading-none text-ink-900">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="h-9 w-px bg-ink-200" aria-hidden />
                    <div>
                      <StarRating value={avgRating} size={14} />
                      <p className="mt-1 text-xs text-ink-500">
                        {reviews.length} review{reviews.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Body: edit form + sidebar ───────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
        >
          {/* Main column */}
          <div className="space-y-6">
            {/* Personal information */}
            <section className="rounded-3xl border border-ink-200/70 bg-surface p-6 shadow-card sm:p-8">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
                  <User size={17} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink-900">Personal information</h3>
                  <p className="text-xs text-ink-500">Your name as guests and hosts will see it.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Labeled label="First name" htmlFor="firstName">
                  <input id="firstName" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Asad" className={inputClasses} />
                </Labeled>
                <Labeled label="Last name" htmlFor="lastName">
                  <input id="lastName" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Naeem" className={inputClasses} />
                </Labeled>
                <div className="sm:col-span-2">
                  <Labeled label="Email" htmlFor="email">
                    <input
                      id="email"
                      value={email}
                      disabled
                      className={cn(inputClasses, 'cursor-not-allowed bg-ink-50 text-ink-500')}
                    />
                    <p className="mt-1.5 text-xs text-ink-400">
                      Your email is used to sign in and can’t be changed here.
                    </p>
                  </Labeled>
                </div>
              </div>
            </section>

            {/* Bio */}
            <section className="rounded-3xl border border-ink-200/70 bg-surface p-6 shadow-card sm:p-8">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
                  <FileText size={17} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink-900">About you</h3>
                  <p className="text-xs text-ink-500">Introduce yourself and why you joined.</p>
                </div>
              </div>
              <textarea
                id="bio"
                rows={5}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little bit about yourself…"
                className={cn(inputClasses, 'mt-6 resize-y leading-relaxed')}
              />
            </section>

            {dirty && (
              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      Save changes <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            {/* Quick links */}
            <section className="overflow-hidden rounded-3xl border border-ink-200/70 bg-surface shadow-card">
              <p className="border-b border-ink-100 px-5 py-3.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">
                Quick links
              </p>
              <ul>
                {quickLinks.map((l) => (
                  <li key={l.href} className="border-b border-ink-100 last:border-b-0">
                    <Link
                      href={l.href}
                      className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-surface-2"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-500 transition-colors group-hover:bg-brand-tint group-hover:text-brand">
                        <l.icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink-900">{l.label}</span>
                        <span className="block text-xs text-ink-500">{l.desc}</span>
                      </span>
                      <ChevronRight size={16} className="shrink-0 text-ink-300 transition-colors group-hover:text-brand" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </form>

        {/* ── Reviews ─────────────────────────────────────────────────── */}
        <section className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-ink-900">Reviews ({reviews.length})</h2>
            {reviews.length > 0 && <StarRating value={avgRating} count={reviews.length} />}
          </div>

          {reviews.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-ink-200 bg-surface/60 p-12 text-center">
              <p className="text-sm font-medium text-ink-600">No reviews yet</p>
              <p className="mt-1 text-xs text-ink-400">
                Reviews from guests you’ve hosted will appear here.
              </p>
            </div>
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-3xl border border-ink-200/70 bg-surface p-5 shadow-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.buyer?.name ?? 'Guest'} size={36} />
                      <span className="text-sm font-semibold text-ink-900">{r.buyer?.name ?? 'Guest'}</span>
                    </div>
                    <StarRating value={r.rating} size={14} />
                  </div>
                  {r.text && <p className="mt-3 text-sm leading-relaxed text-ink-600">{r.text}</p>}
                  <p className="mt-3 text-xs text-ink-400">
                    {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
