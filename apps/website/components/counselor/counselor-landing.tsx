'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  DollarSign,
  FileCheck2,
  MessagesSquare,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import { PHOTOS } from '@/lib/images';

/**
 * Public marketing page for Become a College Counselor.
 *
 * The counselor counterpart of GuideLanding: same page rhythm (hero → value props →
 * how it works → earnings → FAQ → CTA) and the same design tokens, but written for an
 * outside admissions professional rather than an enrolled student.
 */

const VALUE_PROPS = [
  {
    icon: Users,
    title: 'Families who already want help',
    body: 'Students and parents come to us mid-search, with a school list and real questions. You skip the marketing and start with the work.',
  },
  {
    icon: CalendarCheck,
    title: 'Your calendar, your rules',
    body: 'Set the hours you take consultations. Accept or decline every request — nothing is ever booked without you saying yes.',
  },
  {
    icon: DollarSign,
    title: 'Paid on schedule',
    body: 'The card is authorized when a family books and captured once the session is done. Payouts land in your bank automatically.',
  },
  {
    icon: ShieldCheck,
    title: 'Contact details stay private',
    body: 'Messaging runs through the platform until a session is confirmed, so your personal number and inbox stay yours.',
  },
];

const STEPS = [
  {
    icon: FileCheck2,
    title: 'Apply',
    body: 'Tell us about your background, credentials, and areas of specialty. It takes about ten minutes.',
  },
  {
    icon: BadgeCheck,
    title: 'Get verified',
    body: 'Our team reviews your credentials. Once approved, your counselor profile goes live in the directory.',
  },
  {
    icon: MessagesSquare,
    title: 'Start counseling',
    body: 'Families find you, book a consultation, and you meet them by video. You get paid after each session.',
  },
];

const FAQS = [
  {
    q: 'Do I need to be affiliated with a university?',
    a: 'No. College counselors on Campus Private Tours are independent professionals — you do not need to be employed by or enrolled at any school.',
  },
  {
    q: 'What credentials do you accept?',
    a: 'Anything that demonstrates professional admissions experience: an IECA or HECA membership, a NACAC affiliation, a graduate degree in counseling or education, or a documented track record advising applicants. You will upload proof as part of the application.',
  },
  {
    q: 'How much can I charge?',
    a: 'Consultation pricing is set by the platform within a published range, so families see consistent pricing across counselors. You will see the exact rate before your profile goes live.',
  },
  {
    q: 'Can I also be a campus guide?',
    a: 'Yes. The two are separate applications with separate approvals — if you are a current student as well as a counselor, you can hold both roles at once.',
  },
];

export function CounselorLanding() {
  return (
    <div className="pt-[var(--header-h)]">
      <Hero />
      <ValueProps />
      <HowItWorks />
      <Faq />
      <ClosingCta />
    </div>
  );
}

/* ─── 1. Hero ────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="container-page grid items-center gap-8 py-12 sm:gap-10 lg:grid-cols-2 lg:gap-12 lg:py-16">
      <div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-brand">
          For admissions professionals
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] text-ink-900 sm:text-5xl lg:text-6xl">
          Become a college counselor
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-600">
          Advise families who are actively choosing a school. Set your own availability,
          keep your contact details private, and get paid for every consultation.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-maroon-900 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
          >
            Start your application
          </Link>
          <Link href="/browse-counselors" className="text-sm font-semibold text-ink-900 hover:text-ink-600">
            See who&rsquo;s already counseling
          </Link>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} className="fill-gold-500 text-gold-500" />
            ))}
          </div>
          <span className="text-sm font-medium text-ink-600">
            Trusted by families across 200+ schools
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="overflow-hidden rounded-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PHOTOS.consultation.src}
            alt={PHOTOS.consultation.alt}
            className="aspect-[4/5] w-full object-cover sm:aspect-[4/3]" loading="eager" fetchPriority="high" decoding="async"/>
        </div>

        <div className="absolute left-4 top-4 hidden items-center gap-3 rounded-2xl bg-surface p-3 pr-5 shadow-lift sm:flex">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-maroon-900 text-white">
            <MessagesSquare size={16} />
          </span>
          <div>
            <p className="text-sm font-bold text-ink-900">New consultation request</p>
            <p className="text-xs text-ink-500">From the Alvarez family &middot; 60 min</p>
          </div>
        </div>

        <div className="absolute bottom-6 right-4 hidden items-center gap-3 rounded-2xl bg-surface p-3 pr-5 shadow-lift sm:flex">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-verified-solid text-white">
            <BadgeCheck size={16} />
          </span>
          <div>
            <p className="text-sm font-bold text-ink-900">Credentials verified</p>
            <p className="text-xs text-ink-500">Profile live in the directory</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 2. Value props ─────────────────────────────────────────────────── */

function ValueProps() {
  return (
    <section className="bg-canvas-alt py-14 sm:py-16">
      <div className="container-page">
        <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          Why counsel here
        </h2>
        <p className="mt-3 max-w-2xl text-ink-600">
          You bring the expertise. We handle discovery, scheduling, payments, and privacy.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-ink-200/70 bg-surface p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-maroon-900 text-white">
                <Icon size={18} />
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink-900">{title}</h3>
              <p className="mt-2 leading-relaxed text-ink-600">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 3. How it works ────────────────────────────────────────────────── */

function HowItWorks() {
  return (
    <section className="container-page py-14 sm:py-16">
      <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
        How it works
      </h2>

      <div className="mt-10 grid gap-8 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <div key={title}>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-maroon-900 text-white">
                <Icon size={18} />
              </span>
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Step {i + 1}
              </span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-ink-900">{title}</h3>
            <p className="mt-2 leading-relaxed text-ink-600">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── 4. FAQ ─────────────────────────────────────────────────────────── */

function Faq() {
  return (
    <section className="bg-canvas-alt py-14 sm:py-16">
      <div className="container-page max-w-3xl">
        <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          Common questions
        </h2>
        <dl className="mt-8 space-y-6">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="rounded-2xl border border-ink-200/70 bg-surface p-6">
              <dt className="font-bold text-ink-900">{q}</dt>
              <dd className="mt-2 leading-relaxed text-ink-600">{a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ─── 5. Closing CTA ─────────────────────────────────────────────────── */

function ClosingCta() {
  return (
    <section className="container-page py-16 text-center">
      <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
        Ready to start?
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-ink-600">
        Create an account, complete the counselor application, and our team will review
        your credentials.
      </p>
      <Link
        href="/register"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-maroon-900 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
      >
        Start your application
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
