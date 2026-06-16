# University Campus Private Tours — Public Website

The premium, SEO-critical **public website** for University Campus Private Tours — a two-sided
education marketplace where families discover universities and book **private campus tours** and
**video consultations** with verified current-student ambassadors.

Built with **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS**, and **Framer Motion**, it
consumes the shared backend API via `@ucpt/sdk`. This package is part of the
[University Campus Private Tours monorepo](../../README.md).

> **Design reference:** the full design system and page spec lives in [`DESIGN.md`](./DESIGN.md).

---

## Table of contents

1. [Quick start](#quick-start)
2. [Scripts](#scripts)
3. [Tech stack](#tech-stack)
4. [Brand & design system](#brand--design-system)
5. [Project structure](#project-structure)
6. [Pages & routes](#pages--routes)
7. [Component library](#component-library)
8. [Data layer](#data-layer)
9. [Animations & micro-interactions](#animations--micro-interactions)
10. [Accessibility](#accessibility)
11. [Performance & SEO](#performance--seo)
12. [Replacing the logo & assets](#replacing-the-logo--assets)
13. [Environment variables](#environment-variables)
14. [Roadmap](#roadmap)

---

## Quick start

From this folder (`apps/website`):

```bash
pnpm dev          # start dev server → http://localhost:3000
```

Or from anywhere in the monorepo:

```bash
pnpm --filter @ucpt/website dev
```

If dependencies aren’t installed yet, run `pnpm install` once from the repo root.

---

## Scripts

| Command          | Description                                  |
| ---------------- | -------------------------------------------- |
| `pnpm dev`       | Dev server with hot reload (port 3000)       |
| `pnpm build`     | Production build (also type-checks & lints)  |
| `pnpm start`     | Serve the production build                    |
| `pnpm typecheck` | `tsc --noEmit` type-check                     |
| `pnpm lint`      | Next.js ESLint                               |
| `pnpm clean`     | Remove `.next`, `node_modules`, `.turbo`     |

---

## Tech stack

| Concern        | Choice                                                            |
| -------------- | ---------------------------------------------------------------- |
| Framework      | Next.js 15 (App Router), React 19, TypeScript                    |
| Styling        | Tailwind CSS 3.4 + `@tailwindcss/typography`                     |
| Animation      | Framer Motion 11 (scroll reveals, carousels, counters)          |
| Icons          | `lucide-react` (SVG only — never emoji)                          |
| Variants/utils | `class-variance-authority`, `clsx`, `tailwind-merge` (`cn`)      |
| Fonts          | `next/font` — Playfair Display (display) + Inter (body)          |
| API contract   | `@ucpt/sdk`, `@ucpt/types`, `@ucpt/validation` (workspace pkgs)  |

---

## Brand & design system

Derived from the collegiate **crest logo**.

| Token        | Value                                            | Use                                    |
| ------------ | ------------------------------------------------ | -------------------------------------- |
| Primary      | `maroon-900 #6b1521` / `maroon-800 #7a1a32`      | Headers, primary buttons, crest        |
| Accent       | `gold-500 #cf9526` (gradient `bg-gold-sheen`)    | Premium accents, highlight text, CTAs  |
| Canvas       | `ivory #fbf8f3`, `cream #f6f0e7`                  | Page + alternating section backgrounds |
| Text         | `ink-900 / ink-600 / ink-500`                    | Headings / body / muted                |
| Success      | `verified #2f7d57`                               | Verified badges, checkmarks            |

- **Type:** Playfair Display headings (`font-display`) + Inter body (`font-sans`) — the
  “Classic Elegant” premium pairing.
- **Motion:** 150–300ms, easing `ease-premium` = `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Shadows:** `shadow-soft` (rest) → `shadow-lift` (hover) → `shadow-glow` (gold focus).
- **Layout helpers:** `.container-page` (max 1280px), `.eyebrow`, `.text-gold-gradient`, `.bg-grid`.
- **Section rhythm:** `py-20 sm:py-28`, alternating `bg-ivory` / `bg-cream/60`.

Tokens are defined in [`tailwind.config.ts`](./tailwind.config.ts) and base styles in
[`app/globals.css`](./app/globals.css).

---

## Project structure

```
apps/website/
├── app/                       # App Router routes
│   ├── layout.tsx             # Root layout: fonts, Navbar, Footer, metadata, skip-link
│   ├── globals.css            # Tailwind layers, base styles, reduced-motion
│   ├── fonts.ts               # next/font (Playfair + Inter) → CSS variables
│   ├── page.tsx               # Homepage
│   ├── search/page.tsx        # Guide search
│   ├── universities/          # index + [slug] detail
│   ├── ambassadors/[id]/      # guide profile + booking
│   ├── how-it-works/  become-a-guide/  for-parents/
│   ├── about/  contact/  faq/
│   ├── login/  register/
│   └── terms/  privacy/  trust-safety/
├── components/
│   ├── ui/                    # Button, Badge, SectionHeading, StarRating, Avatar, Accordion, Reveal
│   ├── cards/                 # UniversityCard, AmbassadorCard
│   ├── layout/                # Navbar, Footer
│   ├── home/                  # Hero, StatCounter, TestimonialCarousel
│   ├── search/                # SearchBar, SearchResults (filters)
│   ├── booking/               # BookingWidget
│   ├── contact/               # ContactForm
│   └── brand/                 # Logo
├── lib/
│   ├── data.ts                # Mock content (universities, ambassadors, testimonials, FAQs…)
│   ├── utils.ts               # cn(), formatPrice()
│   └── api.ts                 # @ucpt/sdk instance for live data
├── public/logo.svg            # Crest mark (replaceable)
├── tailwind.config.ts         # Design tokens
├── DESIGN.md                  # Design system spec
└── README.md                  # This file
```

---

## Pages & routes

| Route                    | Rendering        | Description                                                                          |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------- |
| `/`                      | Static (ISR-ready) | Hero search, trust marquee, how-it-works, featured universities, services, animated stats, ambassadors, testimonial carousel, become-a-guide, FAQ, CTA |
| `/universities`          | Static           | Browse all universities                                                              |
| `/universities/[slug]`   | SSG/ISR          | University detail — hero, highlights, programs, student guides, CTA (SEO + canonical) |
| `/search`                | Dynamic (query)  | Guide search with live filters (university, service, price, rating), sort, mobile filter sheet, empty state |
| `/ambassadors/[id]`      | SSG/ISR          | Guide profile — bio, languages, interests, reviews + sticky **booking widget**       |
| `/how-it-works`          | Static           | Buyer + guide journeys, trust strip, FAQ                                             |
| `/become-a-guide`        | Static           | Student conversion page — earnings, steps, requirements, guide FAQ                   |
| `/for-parents`           | Static           | Trust-focused page for parents                                                       |
| `/about`                 | Static           | Brand story, values, impact stats, team                                             |
| `/contact`               | Static + form    | Contact methods + interactive contact form                                          |
| `/faq`                   | Static           | Grouped help center (booking, guides, safety)                                        |
| `/login`                 | Client           | Premium split-screen sign-in                                                         |
| `/register`              | Client           | Split-screen sign-up with buyer/guide role toggle                                    |
| `/terms`                 | Static           | Terms of Service (prose)                                                             |
| `/privacy`               | Static           | Privacy Policy (prose)                                                               |
| `/trust-safety`          | Static           | Trust & Safety pillars + report a concern                                            |

**Core user flow:** Home → Search → Ambassador profile → Booking widget (request) — charged only on
guide acceptance.

---

## Component library

**UI primitives** (`components/ui/`)

| Component        | Notes                                                                       |
| ---------------- | --------------------------------------------------------------------------- |
| `Button` / `ButtonLink` | Variants: `primary · gold · outline · ghost · light · outline-light`; sizes `sm · md · lg · icon` |
| `Badge`          | Variants: `maroon · gold · verified · neutral · light`                       |
| `SectionHeading` | Eyebrow + title + description; `align`, `variant`                            |
| `StarRating`     | Accessible (announces value via `aria-label`)                               |
| `Avatar`         | Initials with brand tint; optional `ring`                                    |
| `Accordion`      | Animated expand/collapse (FAQ)                                               |
| `Reveal` / `RevealGroup` | Scroll-triggered fade/slide; reduced-motion aware                  |

**Feature components**

- `cards/` — `UniversityCard`, `AmbassadorCard`
- `layout/` — `Navbar` (always-solid frosted header, hover cover + animated underline, mobile drawer), `Footer`
- `home/` — `Hero`, `StatCounter` (count-up on view), `TestimonialCarousel`
- `search/` — `SearchBar` (hero/compact; **popular chips search on click**), `SearchResults` (filters + grid)
- `booking/` — `BookingWidget` (service/duration/date/time → price; **request flow with confirmation summary + in-widget message composer**)
- `contact/` — `ContactForm`
- `brand/` — `Logo` (`default` | `light` variants)

---

## Data layer

Marketing/discovery content is currently **mock data** in [`lib/data.ts`](./lib/data.ts)
(universities, ambassadors, testimonials, services, stats, FAQs, how-it-works). Shapes mirror the
documented backend domain model so they swap cleanly for live data via
[`lib/api.ts`](./lib/api.ts), which creates a typed `@ucpt/sdk` client pointed at
`NEXT_PUBLIC_API_BASE_URL`.

Ambassadors carry an optional `avatar` photo URL (currently placeholder images, rendered by the
`Avatar` component with an initials fallback) — swap these for real uploads when the backend lands.

Money is handled in **integer cents** and rendered with `formatPrice()` from `lib/utils.ts`.

> **Interactive flows** (booking request, in-widget messaging, login/email-link, register, contact)
> currently **simulate** success on the client — each handler is marked with a comment where the real
> `@ucpt/sdk` call goes once the backend is wired.

---

## Animations & micro-interactions

- **Scroll reveals** via `Reveal` / `RevealGroup` (staggered).
- **Hero** entrance animation + floating crest.
- **Stat counters** count up when scrolled into view.
- **Testimonial carousel** with animated slide transitions + dots.
- **FAQ accordion** height/opacity transitions.
- **Navbar** transparent → frosted on scroll, animated active-link underline, animated mobile drawer.
- **Cards** lift on hover (`-translate-y-1`, shadow `soft → lift`).
- All motion respects `prefers-reduced-motion` (globally disabled in `globals.css` + via Framer’s
  `useReducedMotion`).

---

## Accessibility

- WCAG AA color contrast; visible `:focus-visible` gold ring on all interactive elements.
- Skip-to-content link; semantic landmarks and heading hierarchy (one `h1` per page).
- `aria-label`s on icon-only buttons; accessible star ratings, carousel controls, and forms
  (`htmlFor`/`id`, `autocomplete`, `aria-pressed` on toggles, `aria-live` on form status).
- SVG icons only (lucide-react) — never emoji as icons.
- Responsive at 375 / 768 / 1024 / 1280; grids collapse 3→2→1; navbar → drawer below `lg`.

---

## Performance & SEO

- `next/font` (no layout shift), `next/image` for real photos, balanced text wrapping.
- Static/ISR rendering for SEO surfaces; dynamic params prerendered via `generateStaticParams`.
- Per-page `metadata` (titles, descriptions, canonical URLs), Open Graph + Twitter defaults in the
  root layout; admin/console surfaces excluded (this is the public, indexable site).
- Production build: ~102 KB shared First-Load JS; pages 102–158 KB.

---

## Replacing the logo & assets

A placeholder crest is provided at [`public/logo.svg`](./public/logo.svg). To use your exact brand
mark, **replace that file** (keep the name `logo.svg`) — it’s referenced by the `Logo` component, the
hero, footer, university cards, and the become-a-guide panel, so it updates everywhere at once.
For a raster file, drop `public/logo.png` and update the `src` in
[`components/brand/logo.tsx`](./components/brand/logo.tsx).

---

## Environment variables

Configured at the monorepo root (`.env`, see `.env.example`):

| Variable                            | Purpose                                  |
| ----------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`          | Backend API base URL for `@ucpt/sdk`     |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`| Stripe Elements (checkout, future)       |

---

## Roadmap

Done:

- Booking **request flow** with confirmation summary + in-widget message composer (client-side)
- Hero search "popular" chips trigger a real search; `/search` filters, sort & mobile sheet
- Auth pages with simulated submit + login email-link ("magic link") state
- Ambassador profile photos via the `Avatar` `src` field (placeholder images)

Not yet implemented (next steps):

- Persist booking requests + payment hold; **checkout flow** (Stripe Elements) and receipts
- Buyer dashboard (my bookings, messages, receipts, reviews)
- Ambassador dashboard (listings, requests, earnings, payouts)
- Wire `@ucpt/sdk` to the live backend (replace `lib/data.ts` mocks + simulated handlers)
- Real photography/imagery via `next/image` (swap placeholder avatars)
- Component refinement with Magic MCP
