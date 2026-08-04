# University Campus Private Tours — Website Design System

High-fidelity design system and page spec for the public website (`apps/website`, Next.js 15 App
Router). Brand is derived from the collegiate crest logo: deep maroon + gold, rendered on a warm
near-black canvas.

**The website ships both themes with a visitor-facing toggle.** Dark is the default; the choice
persists in `localStorage` under `ucpt-theme`. The admin panel and mobile app are still light and
are intentionally untouched.

### How theming works

Every colour token resolves to a CSS variable defined twice in [`app/theme.css`](app/theme.css):
`:root` holds the **dark** values and `.light` the **light** ones. Because dark is the default, the
server HTML and any no-JS render are already correct without a class.

- `lib/theme.tsx` — `ThemeProvider`, `useTheme()`, and `THEME_SCRIPT`.
- `THEME_SCRIPT` runs **inline and synchronously in `<head>`** (`app/layout.tsx`). It must stay
  there: anything async lets a light-theme visitor see a dark flash on every navigation.
- `components/ui/theme-toggle.tsx` — the switch, mounted in the navbar (desktop + mobile).
- **You almost never need a `dark:` variant.** The scales below are contrast-ordered, so
  `text-ink-900` / `bg-surface` / `border-ink-200` are already right in both themes. `dark:` is
  wired to `:root:not(.light)` if you genuinely need it.

**Adding a token: define it in BOTH blocks.** One present only in `:root` silently keeps its dark
value in light mode. `scripts`-free check: the audit in the PR description compares key parity and
contrast for both themes.

Values that are **not** Tailwind-reachable must be switched at runtime instead:
`lib/stripe-appearance.ts` (iframe — and `<Elements>` needs `key={theme}` to remount),
`components/home/map-view.tsx` (Leaflet markers + popup HTML string, via a `css()` token reader),
and the Leaflet/`color-scheme`/autofill/scrollbar rules in `globals.css`.

## 1. Brand foundations

| Token | Value | Use |
| ----- | ----- | --- |
| Canvas | `canvas #0d0b0a` / `canvas-alt #131010` | Page base + alternating section bands |
| Surfaces | `surface #1a1614` → `surface-2 #221d1a` → `surface-3 #2b2521` → `surface-4 #362e29` | Cards/navbar → inputs → hover fills → pressed |
| Brand text | `brand #f0879b`, `brand-soft #e0687f` | Brand-coloured text, borders, rings, eyebrows |
| Brand fill | `maroon-900 #a32741` / `maroon-800 #b92e4b` (gradient `bg-maroon-gradient`) | Primary buttons, filled brand bands |
| Brand tint | `brand-tint #25141a` | Soft brand-tinted fills and hovers |
| Accent | `gold-500 #e0aa3e` (gradient `bg-gold-sheen`) | Premium accents, highlight text, secondary CTA |
| Text | `ink-900 #f7f3ef` / `ink-600 #c2b8ae` / `ink-500 #a89c92` / `ink-400 #8d8177` | Headings / body / muted / meta |
| Hairlines | `ink-200 #3a322c` / `ink-100 #2b2521` | Borders, dividers |
| Success | `verified #3fbd7f` | Verified badges, checkmarks |
| Light-on-dark | `ivory #fbf8f3`, `white` | **Only** on brand-filled bands and over photography |

### Reading the scales

`ink` is a **contrast scale, not a lightness scale**: `ink-900` is always the highest-contrast
foreground against the canvas (so it is a warm white here) and `ink-50` the lowest (a near-black
surface tint). The same rule applies to `gold`. This is what let every existing `text-ink-900` /
`border-ink-200` call site stay correct through the dark conversion.

`maroon` remains a **fill scale** — deep enough to carry white text. It is *not* readable as text
on the canvas, so brand-coloured foregrounds use the `brand` tokens instead. In short:
**`bg-maroon-*` for fills, `text-brand` / `border-brand` / `ring-brand` for foregrounds.**

### Rules

- Never use `bg-white` or `bg-ivory` for a surface — use `bg-surface*`. Those two are reserved for
  deliberate light-on-dark accents (a light CTA on a maroon band, glass over a photo).
- Elevation on dark comes from a **lighter surface + hairline border**, not from a drop shadow.
  The `shadow-soft/card/lift` tokens carry an inset top highlight for exactly this reason.
- Semantic colours (`red`, `blue`, `emerald`) are tuned so the mid ramp works both as text on the
  canvas *and* as a solid fill under white text. `red-700` and `gold-600+` are the **light** ends —
  use them for text on a tint, never as a fill under white text.
- Anything rendered outside Tailwind's reach needs theming by hand: Stripe Elements
  (`lib/stripe-appearance.ts`), Leaflet tiles/popups (`globals.css`), and any HTML built as a
  string. `globals.css` also sets `color-scheme: dark` plus autofill, scrollbar and date-picker
  overrides, which otherwise render as light system chrome.

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
