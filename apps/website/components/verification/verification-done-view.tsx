'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Smartphone } from 'lucide-react';

/**
 * Where Stripe Identity sends a MOBILE applicant after the hosted flow.
 *
 * The flow runs inside the app's in-app browser, which has no website session — so the
 * normal return target (/manage-listing) would bounce the user to /login and read as a
 * failure even though the check succeeded. This page just confirms and hands control
 * back to the app.
 *
 * It also attempts a `ucpt://` redirect. In a standalone build that closes the browser
 * and returns to the app automatically; in Expo Go, or a browser with no app installed,
 * nothing happens and the message below is what the user sees. Either way the app
 * re-reads Stripe's own status when it regains focus — this page never decides anything.
 */
const APP_SCHEME = 'ucpt://verification-done';

export function VerificationDoneView() {
  const params = useSearchParams();
  const fromApp = params.get('app') === '1';
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!fromApp) return;
    // Small delay so the confirmation is readable even when the hand-off works instantly.
    const t = setTimeout(() => {
      setTried(true);
      window.location.href = APP_SCHEME;
    }, 900);
    return () => clearTimeout(t);
  }, [fromApp]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-ink-200/70 bg-surface p-8 text-center shadow-soft sm:p-10">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-verified">
          <CheckCircle2 size={30} />
        </span>

        <h1 className="mt-6 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          ID check submitted
        </h1>
        <p className="mt-3 leading-relaxed text-ink-600">
          {/* Deliberately not "verified": Stripe may still be reviewing, and only it
              decides the outcome. Claiming success here could be wrong. */}
          Stripe has your document. The result usually arrives within a minute.
        </p>

        {fromApp ? (
          <>
            <div className="mt-8 flex items-start gap-3.5 rounded-2xl border border-ink-200 bg-canvas-alt p-5 text-left">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-maroon-900 text-white">
                <Smartphone size={19} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Go back to the Campus Private Tours app
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">
                  It will show your status as soon as Stripe decides. You can close this page.
                </p>
              </div>
            </div>

            {tried && (
              <a
                href={APP_SCHEME}
                className="mt-5 inline-block text-sm font-semibold text-brand hover:underline"
              >
                Open the app
              </a>
            )}
          </>
        ) : (
          <Link
            href="/manage-listing"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-maroon-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-maroon-800"
          >
            Back to Manage listing
          </Link>
        )}
      </div>
    </main>
  );
}
