'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Pencil, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';
import { accountApi, reviewsApi, tokenStore, friendlyError, type ReviewDto } from '@/lib/client-api';
import { updateSessionUser } from '@/lib/auth';
import { useToast } from '@/lib/toast';

const inputClasses =
  'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15';

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
        setEmail(me.email ?? '');
        splitName(me.name ?? '');
        if (typeof p.bio === 'string') setBio(p.bio);
        if (typeof p.photo === 'string') setPhoto(p.photo);
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
      toast.success('Profile saved', 'Your changes have been updated.');
    } catch (e) {
      toast.error('Could not save profile', friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-ivory">
        <Loader2 className="animate-spin text-maroon-800" size={28} />
      </main>
    );
  }

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <main className="min-h-dvh bg-ivory/40 pb-16 pt-[calc(var(--header-h)+1.5rem)]">
      <div className="mx-auto w-full max-w-2xl px-5">
        <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-[1.75rem]">My profile</h1>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5">
          {/* Identity */}
          <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <span className="inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-maroon-gradient font-display text-2xl font-bold text-ivory shadow-soft">
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
                  className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-ink-200 bg-white text-maroon-800 shadow-soft transition-colors hover:bg-maroon-50"
                >
                  <Pencil size={13} />
                </button>
                <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900">Profile photo</p>
                <p className="mt-0.5 text-xs text-ink-400">Clear photo of your face · JPG, GIF, PNG · max 20MB</p>
                {email && <p className="mt-1 truncate text-xs text-ink-500">{email}</p>}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Labeled label="First name" htmlFor="firstName">
                <input id="firstName" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Asad" className={inputClasses} />
              </Labeled>
              <Labeled label="Last name" htmlFor="lastName">
                <input id="lastName" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Naeem" className={inputClasses} />
              </Labeled>
            </div>
          </section>

          {/* Bio */}
          <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Bio</h2>
            <p className="mt-1 text-xs text-ink-500">Help others get to know you — introduce yourself and why you joined.</p>
            <textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a little bit about yourself…"
              className={cn(inputClasses, 'mt-3 resize-y leading-relaxed')}
            />
          </section>

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Saving profile…
              </>
            ) : (
              <>
                Save profile <ArrowRight size={18} />
              </>
            )}
          </Button>
        </form>

        {/* Reviews */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink-900">Reviews ({reviews.length})</h2>
            {reviews.length > 0 && <StarRating value={avgRating} count={reviews.length} />}
          </div>

          {reviews.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white/60 p-8 text-center text-sm text-ink-500">
              No reviews yet.
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.buyer?.name ?? 'Guest'} size={32} />
                      <span className="text-sm font-semibold text-ink-900">{r.buyer?.name ?? 'Guest'}</span>
                    </div>
                    <StarRating value={r.rating} size={14} />
                  </div>
                  {r.text && <p className="mt-2 text-sm leading-relaxed text-ink-600">{r.text}</p>}
                  <p className="mt-2 text-xs text-ink-400">
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
