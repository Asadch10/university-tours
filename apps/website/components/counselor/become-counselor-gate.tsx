'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { tokenStore } from '@/lib/client-api';
import { CounselorApplication } from './counselor-application';

/**
 * Renders the public marketing landing for signed-out visitors, and the counselor
 * application for signed-in users. The marketing node is produced on the server and
 * passed in, so it stays the SSR/first-paint content (good for SEO).
 *
 * Mirrors BecomeGuideGate exactly.
 */
export function BecomeCounselorGate({ marketing }: { marketing: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLoggedIn(!!tokenStore.user);
    setReady(true);
  }, []);

  if (ready && loggedIn) return <CounselorApplication />;
  return <>{marketing}</>;
}
