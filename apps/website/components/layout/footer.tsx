import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { ShieldCheck, Mail } from 'lucide-react';

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

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-maroon-gradient text-ivory">
      <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
      <div className="container-page relative">
        <div className="grid gap-12 py-16 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:py-20">
          <div className="max-w-xs">
            <Logo variant="light" />
            <p className="mt-5 text-sm leading-relaxed text-ivory/70">
              Private campus tours and video consultations led by verified current students.
              See the real campus before you decide.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-gold-200 ring-1 ring-inset ring-white/15">
              <ShieldCheck size={14} /> Verified students only
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-semibold tracking-wide text-ivory">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ivory/70 transition-colors duration-200 hover:text-gold-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/15 py-7 text-sm text-ivory/60 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} University Campus Private Tours. All rights reserved.</p>
          <a
            href="mailto:hello@ucpt.example"
            className="inline-flex items-center gap-2 transition-colors hover:text-gold-200"
          >
            <Mail size={15} /> hello@ucpt.example
          </a>
        </div>
      </div>
    </footer>
  );
}
