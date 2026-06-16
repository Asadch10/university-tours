# University Campus Private Tours — Website Design System

High-fidelity design system and page spec for the public website (`apps/website`, Next.js 15 App
Router). Brand is derived from the collegiate crest logo: deep maroon + gold + warm ivory.

## 1. Brand foundations

| Token | Value | Use |
| ----- | ----- | --- |
| Primary | `maroon-900 #6b1521` / `maroon-800 #7a1a32` | Headers, primary buttons, crest |
| Accent | `gold-500 #cf9526` (gradient `bg-gold-sheen`) | Premium accents, highlight text, secondary CTA |
| Canvas | `ivory #fbf8f3`, `cream #f6f0e7` | Page + alternating section backgrounds |
| Text | `ink-900 #1f1a16` / `ink-600` / `ink-500` | Headings / body / muted |
| Success | `verified #2f7d57` | Verified badges, checkmarks |

**Type:** Playfair Display (`font-display`) for headings, Inter (`font-sans`) for body — the "Classic
Elegant" premium pairing. Loaded via `next/font` (no layout shift).

**Motion:** 150–300ms, easing `ease-premium` = `cubic-bezier(0.22,1,0.36,1)`. Scroll reveals via
`<Reveal>`/`<RevealGroup>`. All motion respects `prefers-reduced-motion`.

**Shadows:** `shadow-soft` (rest) → `shadow-lift` (hover) → `shadow-glow` (gold focus). Hover lifts
cards `-translate-y-1`.

## 2. Component kit (`components/`)

- `ui/button.tsx` — `Button` / `ButtonLink`; variants `primary | gold | outline | ghost | light | outline-light`; sizes `sm | md | lg | icon`.
- `ui/badge.tsx` — `Badge`; variants `maroon | gold | verified | neutral | light`.
- `ui/section-heading.tsx` — `SectionHeading` (eyebrow + title + description; `align`, `variant`).
- `ui/star-rating.tsx`, `ui/avatar.tsx`, `ui/accordion.tsx`, `ui/reveal.tsx` (`Reveal`, `RevealGroup`).
- `cards/university-card.tsx` (`UniversityCard`), `cards/ambassador-card.tsx` (`AmbassadorCard`).
- `search/search-bar.tsx` (`SearchBar`), `brand/logo.tsx` (`Logo`).
- `layout/navbar.tsx`, `layout/footer.tsx` (mounted in `app/layout.tsx`).
- Helpers: `lib/utils.ts` (`cn`, `formatPrice`), `lib/data.ts` (mock content).

## 3. Layout primitives

- Page width: `.container-page` (max 1280px, responsive padding).
- Section rhythm: `py-20 sm:py-28`; alternate `bg-ivory` / `bg-cream/60`.
- Eyebrow label: `.eyebrow`; gold text accent: `.text-gold-gradient`.

## 4. Pages & flows

| Route | Rendering | Purpose |
| ----- | --------- | ------- |
| `/` | Static (ISR-ready) | Hero search, trust, how-it-works, featured universities, services, stats, ambassadors, testimonials, become-a-guide, FAQ, CTA |
| `/universities` | Static | Browse/filter all universities |
| `/universities/[slug]` | SSR/ISR | University detail + guides + SEO |
| `/search` | Client (query-driven) | Guide search with filters + results grid |
| `/ambassadors/[id]` | SSR/ISR | Guide profile + booking sidebar |
| `/how-it-works` | Static | Buyer + guide journeys |
| `/become-a-guide` | Static | Conversion page for students |
| `/for-parents` | Static | Trust-focused parent page |
| `/about`, `/contact`, `/faq` | Static | Company + support |
| `/login`, `/register` | Client | Auth (split-screen premium) |
| `/terms`, `/privacy`, `/trust-safety` | Static | Legal (prose) |

## 5. Responsive breakpoints

375 (mobile) · 768 (`sm`/`md` tablet) · 1024 (`lg` desktop) · 1280+ (`2xl` container cap).
Grids collapse 3→2→1; navbar → drawer below `lg`; search bar stacks vertically on mobile.

## 6. Accessibility & performance

- WCAG AA contrast; visible `:focus-visible` gold ring; skip-to-content link.
- SVG icons only (lucide-react) — never emoji.
- Semantic landmarks, `aria-label`s on icon buttons, accessible star ratings & carousels.
- `next/font`, `next/image` for photos, balanced text, reduced-motion support.

## 7. Replacing the logo

A crest is provided at `public/logo.svg`. Drop your exact PNG/SVG at `public/logo.svg` (or update
`components/brand/logo.tsx`) to swap the mark everywhere.
