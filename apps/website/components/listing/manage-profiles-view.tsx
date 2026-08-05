'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { accountApi } from '@/lib/client-api';
import { ManageListingView } from './manage-listing-view';
import { ManageCounselorView } from '@/components/counselor/manage-counselor-view';

/**
 * Manage listing, for a user who may hold both roles.
 *
 * A guide who later applies as a counselor has two independent profiles, each with its
 * own review status. This shows them as two sections; the switcher is hidden entirely
 * when the user only has one, so a guide-only account sees exactly what it saw before.
 */

type Section = 'guide' | 'counselor';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'guide', label: 'Guide profile' },
  { key: 'counselor', label: 'Counselor profile' },
];

export function ManageProfilesView() {
  const searchParams = useSearchParams();
  // `?tab=counselor` opens the counselor section directly — the nav's
  // "Manage counselor listing" item and approval emails link straight to it.
  const requested: Section | null =
    searchParams.get('tab') === 'counselor'
      ? 'counselor'
      : searchParams.get('tab') === 'guide'
        ? 'guide'
        : null;

  const [loading, setLoading] = useState(true);
  const [hasGuide, setHasGuide] = useState(false);
  const [hasCounselor, setHasCounselor] = useState(false);
  const [section, setSection] = useState<Section>('guide');

  useEffect(() => {
    let cancelled = false;
    accountApi
      .getMe()
      .then((me) => {
        if (cancelled) return;
        const p = (me.profileJson ?? {}) as Record<string, unknown>;
        const guide = !!p.guideListing;
        const counselor = !!p.counselorListing;
        setHasGuide(guide);
        setHasCounselor(counselor);
        // Honour ?tab= when they actually have that profile; otherwise land on
        // whichever one exists (guide wins when they hold both).
        const wanted =
          requested && ((requested === 'guide' && guide) || (requested === 'counselor' && counselor))
            ? requested
            : guide
              ? 'guide'
              : counselor
                ? 'counselor'
                : 'guide';
        setSection(wanted);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requested]);

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-surface">
        <Loader2 className="animate-spin text-brand" size={28} />
      </main>
    );
  }

  const both = hasGuide && hasCounselor;

  return (
    <>
      {both && (
        // Same container width and header offset as the two views below, so the tabs
        // sit flush with the "Manage …" heading instead of a stray narrower strip.
        <div className="bg-canvas pt-[calc(var(--header-h)+2.5rem)]">
          <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <div
            role="tablist"
            aria-label="Profile"
            className="inline-flex gap-1 rounded-xl border border-ink-200 bg-surface p-1 shadow-soft"
          >
            {SECTIONS.map((s) => {
              const active = section === s.key;
              return (
                <button
                  key={s.key}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setSection(s.key)}
                  className={cn(
                    'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-maroon-900 text-ivory shadow-sm'
                      : 'text-ink-600 hover:text-ink-900',
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {/* Only one is mounted at a time — each fetches and owns its own state.
          `embedded` stops them re-applying the header offset the tab bar added. */}
      {section === 'counselor' ? (
        <ManageCounselorView embedded={both} />
      ) : (
        <ManageListingView embedded={both} />
      )}
    </>
  );
}
