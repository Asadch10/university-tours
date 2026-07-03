'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { tokenStore } from '@/lib/client-api';
import { GuideApplication } from './guide-application';

/**
 * Renders the public marketing landing for signed-out visitors, and the guide
 * application form for signed-in users. The marketing node is produced on the
 * server and passed in, so it stays the SSR/first-paint content (good for SEO).
 */
export function BecomeGuideGate({ marketing }: { marketing: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLoggedIn(!!tokenStore.user);
    setReady(true);
  }, []);

  if (ready && loggedIn) return <GuideApplication />;
  return <>{marketing}</>;
}
