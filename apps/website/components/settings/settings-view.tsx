'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { accountApi, tokenStore, type MyProfileDto } from '@/lib/client-api';
import { ContactInformation } from './contact-information';
import { PasswordSettings } from './password-settings';
import { PayoutsSettings } from './payouts-settings';
import { PaymentsSettings } from './payments-settings';
import { CollegeStatus } from './college-status';
import { ManageAccount } from './manage-account';

/** Sections receive the loaded profile (payouts/payments ignore it). */
export interface SectionProps {
  profile?: MyProfileDto | null;
}

const SECTIONS: { key: string; label: string; Component: ComponentType<SectionProps> }[] = [
  { key: 'contact', label: 'Contact information', Component: ContactInformation },
  { key: 'password', label: 'Password', Component: PasswordSettings },
  { key: 'payouts', label: 'Payouts', Component: PayoutsSettings },
  { key: 'payments', label: 'Payments', Component: PaymentsSettings },
  { key: 'college', label: 'College status', Component: CollegeStatus },
  { key: 'manage', label: 'Manage account', Component: ManageAccount },
];

export function SettingsView() {
  const router = useRouter();
  const [active, setActive] = useState('contact');
  const [profile, setProfile] = useState<MyProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Deep-link support: /settings?section=college opens that tab (e.g. from the
  // "switch to guest to review" toast). Read client-side to avoid useSearchParams'
  // build-time Suspense requirement.
  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get('section');
    if (section && SECTIONS.some((s) => s.key === section)) setActive(section);
  }, []);

  // Load the account once when Settings opens.
  useEffect(() => {
    if (!tokenStore.user) {
      router.replace('/login');
      return;
    }
    accountApi
      .getMe()
      .then(setProfile)
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const Active = SECTIONS.find((s) => s.key === active)!.Component;

  return (
    <main className="min-h-dvh bg-surface pt-[var(--header-h)]">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 lg:grid-cols-[300px_1fr]">
        {/* Left rail */}
        <aside className="border-b border-ink-200/70 bg-canvas-alt px-6 py-10 lg:min-h-[calc(100dvh-var(--header-h))] lg:border-b-0 lg:border-r lg:px-8">
          <nav className="space-y-1" aria-label="Settings sections">
            {SECTIONS.map((s) => {
              const on = active === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActive(s.key)}
                  aria-current={on ? 'page' : undefined}
                  className={cn(
                    'relative block w-full rounded-lg px-3 py-2.5 text-left text-lg font-medium transition-colors',
                    on ? 'text-brand' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800',
                  )}
                >
                  {on && <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-maroon-900" aria-hidden />}
                  {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Section content */}
        <section className="px-6 py-10 sm:px-12">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-brand" size={26} />
            </div>
          ) : (
            <Active profile={profile} />
          )}
        </section>
      </div>
    </main>
  );
}
