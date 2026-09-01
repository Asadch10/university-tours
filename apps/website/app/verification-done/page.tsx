import { Suspense } from 'react';
import type { Metadata } from 'next';
import { VerificationDoneView } from '@/components/verification/verification-done-view';

export const metadata: Metadata = {
  title: 'Identity check submitted',
  // Nothing here is useful to a search engine, and the URL only ever arrives
  // as a redirect target from Stripe.
  robots: { index: false, follow: false },
};

export default function VerificationDonePage() {
  // Suspense is required, not decorative: the view reads `?app=` via useSearchParams,
  // which opts the tree into a client-side bailout and would fail to prerender without it.
  return (
    <Suspense fallback={null}>
      <VerificationDoneView />
    </Suspense>
  );
}
