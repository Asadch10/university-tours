'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, MoreHorizontal, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { accountApi, friendlyError, tokenStore } from '@/lib/client-api';
import { updateSessionUser } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface GuideListing {
  listingTitle?: string;
  photos?: string[];
  status?: string;
}

export function ManageListingView() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [listing, setListing] = useState<GuideListing | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tokenStore.user) {
      router.replace('/login');
      return;
    }
    setName(tokenStore.user.name ?? '');
    accountApi
      .getMe()
      .then((me) => {
        setName(me.name ?? '');
        const p = (me.profileJson ?? {}) as Record<string, unknown>;
        const gl = p.guideListing as GuideListing | undefined;
        setListing(gl ?? null);
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  // Close the menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  async function del() {
    setDeleting(true);
    try {
      const res = await accountApi.deleteGuideListing();
      updateSessionUser({ hasListing: false, role: res.role ?? 'BUYER' });
      setListing(null);
      setConfirmOpen(false);
      toast.success('Listing deleted', 'Your listing has been removed.');
    } catch (e) {
      toast.error('Could not delete listing', friendlyError(e));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white">
        <Loader2 className="animate-spin text-maroon-800" size={28} />
      </main>
    );
  }

  const photo = listing?.photos?.[0];
  // A 'draft' listing was started but never submitted — keep letting the user finish it.
  const submitted = !!listing && listing.status !== 'draft';

  return (
    <main className="min-h-dvh bg-white pb-20 pt-[calc(var(--header-h)+3rem)]">
      <div className="mx-auto w-full max-w-5xl px-6 sm:px-10">
        <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">Manage listing</h1>

        {!submitted ? (
          /* No submitted listing yet — start a new one, or resume an in-progress draft */
          <Link
            href="/become-a-guide"
            className="mt-6 inline-flex items-center gap-1.5 text-base font-semibold text-maroon-800 transition-colors hover:text-maroon-900 hover:underline"
          >
            {listing ? 'Continue your listing' : 'Get started hosting'} <ArrowRight size={16} />
          </Link>
        ) : (
          /* Listing card */
          <div className="mt-8 w-full max-w-[17rem]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-maroon-gradient">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-4xl font-bold text-ivory">
                  {(name.trim()[0] ?? 'U').toUpperCase()}
                </div>
              )}

              {/* Under-review overlay */}
              {listing!.status !== 'published' && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 px-6 text-center backdrop-blur-[1px]">
                  <p className="text-sm leading-relaxed text-ink-700">
                    Your listing is currently under review and has not been published yet. Please allow up to
                    48 hours for the team to review your listing. Once approved, your listing will be published
                    on the site.
                  </p>
                </div>
              )}

              {/* Menu */}
              <div ref={menuRef} className="absolute right-3 top-3 z-10">
                <button
                  type="button"
                  aria-label="Listing options"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
                  className="inline-flex h-8 w-10 items-center justify-center rounded-lg bg-ink-900/80 text-white transition-colors hover:bg-ink-900"
                >
                  <MoreHorizontal size={18} />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push('/become-a-guide');
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-ink-800 transition-colors hover:bg-ink-50"
                    >
                      <Pencil size={16} className="text-ink-500" /> Edit
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-ink-500">{name || 'Your name'}</p>
            {listing!.listingTitle && (
              <p className="mt-1 font-semibold leading-snug text-ink-900">{listing!.listingTitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-6"
          role="dialog"
          aria-modal="true"
          onClick={() => !deleting && setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-semibold text-ink-900">Delete listing?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              This will permanently remove your listing. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={del}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors',
                  deleting ? 'cursor-not-allowed bg-red-400' : 'bg-red-600 hover:bg-red-700',
                )}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Deleting…
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
