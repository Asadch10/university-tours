import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SettingsView } from '@/components/settings/settings-view';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  // SettingsView reads `?section=` via useSearchParams — same prerender requirement
  // as /manage-listing.
  return (
    <Suspense fallback={null}>
      <SettingsView />
    </Suspense>
  );
}
