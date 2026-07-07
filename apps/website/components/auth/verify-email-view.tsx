'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, MailCheck, AlertCircle } from 'lucide-react';
import { authApi, ApiError, tokenStore } from '@/lib/client-api';
import { updateSessionUser } from '@/lib/auth';

/* University campus background — Stanford (Hoover Tower / Main Quad). */
const BG_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Stanford_University_campus_in_2016.jpg/1920px-Stanford_University_campus_in_2016.jpg';

type Mode = 'pending' | 'verifying' | 'verified' | 'error';

/** Centered white card over the campus backdrop — mirrors the /login shell. */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-dvh pt-[var(--header-h)]">
      <div className="absolute inset-0 top-[var(--header-h)] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BG_IMAGE} alt="" aria-hidden="true" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/40" aria-hidden />
      </div>

      <div className="relative flex justify-center px-0 pt-6 sm:px-4 sm:pt-14">
        <div className="flex min-h-[calc(100dvh-var(--header-h)-1.5rem)] w-full max-w-[540px] flex-col bg-white px-5 py-8 shadow-[0_0_60px_rgba(0,0,0,0.18)] sm:min-h-[auto] sm:rounded-2xl sm:px-12 sm:py-12">
          {children}
          {/* Brand accent bar (matches the sample layout) */}
          <div className="mt-auto pt-10">
            <div className="h-1.5 w-full rounded-full bg-maroon-900" />
          </div>
        </div>
      </div>
    </main>
  );
}

export function VerifyEmailView() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');

  const [mode, setMode] = useState<Mode>(token ? 'verifying' : 'pending');
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const verifiedRef = useRef(false);

  // Seed name/email from the current session (present right after sign-up).
  useEffect(() => {
    const u = tokenStore.user;
    if (u) {
      setEmail(u.email ?? '');
      setName(u.name ?? '');
    }
  }, []);

  // Auto-verify when arriving from the email link.
  useEffect(() => {
    if (!token || verifiedRef.current) return;
    verifiedRef.current = true;
    (async () => {
      try {
        const res = await authApi.verifyEmail(token);
        setEmail(res.email);
        setName(res.name);
        updateSessionUser({ emailVerified: true });
        setMode('verified');
      } catch (err) {
        setErrorMsg(
          err instanceof ApiError
            ? err.message
            : 'We couldn’t verify your email. The link may have expired.',
        );
        setMode('error');
      }
    })();
  }, [token]);

  const handleResend = useCallback(async () => {
    if (!tokenStore.user) {
      // Not signed in — send them to log in so we know which account to resend for.
      router.push('/login');
      return;
    }
    setResendState('sending');
    try {
      await authApi.resendVerification();
      setResendState('sent');
    } catch {
      setResendState('error');
    }
  }, [router]);

  const first = (name || '').trim().split(/\s+/)[0] || 'there';

  // ── Verifying ────────────────────────────────────────────────────────────
  if (mode === 'verifying') {
    return (
      <Card>
        <div className="flex flex-col items-center py-6 text-center">
          <Loader2 size={40} className="animate-spin text-maroon-900" />
          <h1 className="mt-6 font-display text-2xl font-bold text-ink-900">Verifying your email…</h1>
          <p className="mt-3 text-sm text-ink-600">Hang tight, this only takes a moment.</p>
        </div>
      </Card>
    );
  }

  // ── Verified ─────────────────────────────────────────────────────────────
  if (mode === 'verified') {
    return (
      <Card>
        <div className="flex flex-col py-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
            <CheckCircle2 size={30} />
          </div>
          <h1 className="mt-7 font-display text-3xl font-bold leading-tight text-ink-900">
            You’re all set, {first}!
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
            Your email{' '}
            {email && <span className="font-semibold text-ink-900">{email}</span>} has been verified.
            Let’s finish setting up your account.
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-maroon-900 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
          >
            Continue
          </button>
        </div>
      </Card>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (mode === 'error') {
    return (
      <Card>
        <div className="flex flex-col py-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
            <AlertCircle size={30} />
          </div>
          <h1 className="mt-7 font-display text-3xl font-bold leading-tight text-ink-900">
            This link didn’t work
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-600">{errorMsg}</p>

          <button
            onClick={handleResend}
            disabled={resendState === 'sending' || resendState === 'sent'}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-maroon-900 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {resendState === 'sending' && <Loader2 size={16} className="animate-spin" />}
            {resendState === 'sent' ? 'Verification email sent' : 'Send a new link'}
          </button>
          {resendState === 'error' && (
            <p className="mt-3 text-sm text-maroon-900">Couldn’t resend just now — please try again.</p>
          )}

          <p className="mt-6 text-sm text-ink-500">
            <Link href="/login" className="font-semibold text-maroon-900 hover:underline">
              Back to log in
            </Link>
          </p>
        </div>
      </Card>
    );
  }

  // ── Pending (default: shown right after sign-up) ──────────────────────────
  return (
    <Card>
      <div className="flex flex-col py-2">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
          <MailCheck size={30} />
        </div>

        <h1 className="mt-7 font-display text-3xl font-bold leading-tight text-ink-900">
          Hi {first}, check your inbox to verify your email address
        </h1>

        <p className="mt-5 text-[15px] leading-relaxed text-ink-600">
          Please click the button in the email we sent to{' '}
          {email ? (
            <span className="font-semibold text-ink-900">{email}</span>
          ) : (
            'your address'
          )}{' '}
          to verify your account. If you don’t see it, please check your spam folder.
        </p>

        <div className="mt-10 space-y-2 text-sm text-ink-500">
          <p>
            Didn’t get the email?{' '}
            {resendState === 'sent' ? (
              <span className="font-semibold text-green-600">Sent — check your inbox.</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendState === 'sending'}
                className="font-semibold text-maroon-900 hover:underline disabled:opacity-60"
              >
                {resendState === 'sending' ? 'Resending…' : 'Resend email'}
              </button>
            )}
            {resendState === 'error' && (
              <span className="ml-1 text-maroon-900">Couldn’t resend — try again.</span>
            )}
          </p>
          <p>
            Is there an error in your email?{' '}
            <Link href="/register" className="font-semibold text-maroon-900 hover:underline">
              Fix it
            </Link>
          </p>
        </div>
      </div>
    </Card>
  );
}
