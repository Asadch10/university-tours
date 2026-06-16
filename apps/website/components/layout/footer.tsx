import Link from 'next/link';
import {
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Twitter,
  Instagram,
  Linkedin,
  Facebook,
  Youtube,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { NewsletterForm } from '@/components/layout/newsletter-form';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { href: '/universities', label: 'Universities' },
      { href: '/search', label: 'Find a Guide' },
      { href: '/how-it-works', label: 'How it Works' },
      { href: '/for-parents', label: 'For Parents' },
    ],
  },
  {
    title: 'For Students',
    links: [
      { href: '/become-a-guide', label: 'Become a Guide' },
      { href: '/register', label: 'Create an Account' },
      { href: '/login', label: 'Guide Login' },
      { href: '/faq', label: 'Guide FAQ' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/contact', label: 'Contact' },
      { href: '/faq', label: 'Help Center' },
      { href: '/trust-safety', label: 'Trust & Safety' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/trust-safety', label: 'Report a Concern' },
    ],
  },
];

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  { label: 'Twitter / X', href: 'https://twitter.com', icon: Twitter },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
  { label: 'Facebook', href: 'https://facebook.com', icon: Facebook },
  { label: 'YouTube', href: 'https://youtube.com', icon: Youtube },
];

const CONTACT = [
  { icon: Mail, label: 'hello@ucpt.example', href: 'mailto:hello@ucpt.example' },
  { icon: Phone, label: '+1 (888) 555-0142', href: 'tel:+18885550142' },
  { icon: MapPin, label: 'San Francisco, CA', href: null },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-maroon-gradient text-ivory">
      <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-maroon-400/15 blur-3xl"
        aria-hidden
      />

      <div className="container-page relative">
        {/* Brand + newsletter */}
        <div className="grid gap-12 border-b border-white/10 py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:py-16">
          <div className="max-w-md">
            <Logo variant="light" />
            <p className="mt-5 text-sm leading-relaxed text-ivory/70">
              Private campus tours and video consultations led by verified current students.
              See the real campus before you decide.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-gold-200 ring-1 ring-inset ring-white/15">
              <ShieldCheck size={14} /> Verified students only
            </div>

            <ul className="mt-7 space-y-3">
              {CONTACT.map(({ icon: Icon, label, href }) => {
                const inner = (
                  <span className="inline-flex items-center gap-3 text-sm text-ivory/75">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-gold-200 ring-1 ring-inset ring-white/10">
                      <Icon size={15} />
                    </span>
                    {label}
                  </span>
                );
                return (
                  <li key={label}>
                    {href ? (
                      <a href={href} className="group inline-flex transition-colors hover:text-gold-200">
                        {inner}
                      </a>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="lg:pl-8">
            <h3 className="font-display text-xl font-semibold text-ivory">
              Stay in the loop
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ivory/65">
              Join families planning smarter campus visits. Get insider tips and new university
              launches straight to your inbox.
            </p>
            <NewsletterForm />

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ivory/45">
                Follow us
              </p>
              <ul className="mt-3.5 flex flex-wrap gap-2.5">
                {SOCIALS.map(({ label, href, icon: Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-ivory/80 ring-1 ring-inset ring-white/15 transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-gold-sheen hover:text-maroon-950 hover:shadow-glow"
                    >
                      <Icon size={17} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation columns */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-gold-200">
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center text-sm text-ivory/70 transition-colors duration-200 hover:text-ivory"
                    >
                      <span className="h-px w-0 bg-gold-300 transition-all duration-300 ease-premium group-hover:mr-2 group-hover:w-4" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 py-7 text-sm text-ivory/55 sm:flex-row sm:items-center">
          <p>© {year} University Campus Private Tours. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/terms" className="transition-colors hover:text-gold-200">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-gold-200">
              Privacy
            </Link>
            <Link href="/trust-safety" className="transition-colors hover:text-gold-200">
              Trust &amp; Safety
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
