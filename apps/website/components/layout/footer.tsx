import Link from 'next/link';
import { Instagram, Linkedin } from 'lucide-react';
import { Logo } from '@/components/brand/logo';

const COLUMNS = [
  {
    title: 'Campus Tours',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/universities', label: 'Explore schools' },
      { href: '/faq', label: 'Help Center' },
      { href: '/refer', label: 'Refer a friend ($20)' },
      { href: '/partnerships', label: 'School partnerships' },
      { href: '/testimonials', label: 'Testimonials' },
      { href: '/resources', label: 'Resource Center' },
      { href: '/trust-safety', label: 'Trust and safety' },
      { href: '/trust-safety', label: 'Report a concern' },
      { href: '/reviews', label: 'Leave a review' },
      { href: '/blog', label: 'Blog' },
      { href: 'https://youtube.com', label: 'YouTube' },
      { href: '/contact', label: 'Contact us' },
    ],
  },
  {
    title: 'Guest',
    links: [
      { href: '/search', label: 'Browse tour guides' },
      { href: '/prepare', label: 'Prepare for tour' },
      { href: '/suggest-school', label: 'Suggest a new school' },
      { href: '/virtual-tours', label: 'Virtual tours' },
      { href: '/for-parents', label: 'Parents' },
      { href: '/group-tours', label: 'Group tours' },
      { href: '/counselors', label: 'College counselors' },
    ],
  },
  {
    title: 'Guide',
    links: [
      { href: '/become-a-guide', label: 'Become a guide' },
      { href: '/prepare-to-host', label: 'Prepare to host' },
      { href: '/hosting-resources', label: 'Hosting resources' },
    ],
  },
  {
    title: 'Terms & Policies',
    links: [
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
    ],
  },
];

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="container-page py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_3fr]">

          {/* ── Brand column ─────────────────────────────────────────── */}
          <div>
            <Logo />

            {/* Social icons */}
            <div className="mt-8 flex items-center gap-3">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-maroon-900 transition-colors hover:text-maroon-800"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>

            {/* Copyright + credits */}
            <p className="mt-6 max-w-sm text-[0.8rem] leading-relaxed text-ink-400">
              © {year} University Campus Private Tours, LLC. All rights reserved.
              Image credits: Freepik, Unsplash, Pexels, Pixabay, Noun Project, Dreamstime.
            </p>
          </div>

          {/* ── Link columns ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-[0.95rem] font-bold text-ink-900">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-[0.875rem] text-ink-600 transition-colors hover:text-ink-900"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
