import { Suspense } from 'react';
import type { Metadata } from 'next';
import { OnboardingView } from '@/components/onboarding/onboarding-view';

export const metadata: Metadata = { title: 'Welcome' };

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingView />
    </Suspense>
  );
}
