import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ManageProfilesView } from '@/components/listing/manage-profiles-view';

export const metadata: Metadata = { title: 'Manage listing' };

export default function ManageListingPage() {
  // Shows the guide and counselor profiles as two sections when the user holds both.
  //
  // The Suspense boundary is required, not decorative: ManageProfilesView reads
  // `?tab=` via useSearchParams, which opts the tree into client-side bailout. Without
  // it the production build fails to prerender this route.
  return (
    <Suspense fallback={null}>
      <ManageProfilesView />
    </Suspense>
  );
}
