# University Campus Private Tours — Public Website

The premium, SEO-critical **public website** — a two-sided education marketplace where families
discover universities and book **private campus tours**, **video chats**, and **consultations** with
verified current-student ambassadors ("guides").

Built with **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS**, **Framer Motion**,
**TanStack Query**, **Stripe** (Payment Element), and **Leaflet** (explore map). Part of the
[monorepo](../../README.md). Design spec: [`design.md`](./design.md).

> **For future Claude sessions:** this file is the map — read it before exploring. The two flows that
> matter most are the **guide-listing lifecycle** and the **Stripe booking flow** (both documented
> below). Money is always **integer cents**; render with `formatPrice()` from `lib/utils.ts`.

---

## Quick start

```bash
pnpm --filter @ucpt/website dev    # → http://localhost:3000
pnpm --filter @ucpt/backend dev    # → http://localhost:4000 (required)
```

The user runs the dev servers themselves — verify changes with `pnpm --filter @ucpt/website typecheck`,
not by starting `pnpm dev`.

| Command | Description |
| --- | --- |
| `pnpm dev` | Dev server, port **3000** |
| `pnpm build` | Production build (type-checks & lints) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | Next.js ESLint |

---

## Two-sided model (important)

- A `User.role` is **`null` until onboarding** decides `BUYER` (books tours) or `SELLER` (a guide).
  Any signed-in user can book a guide (except themselves); becoming a guide is a separate opt-in.
- **Guide listings live in `User.profileJson.guideListing`**, NOT the `Listing`/`ListingOption`
  tables. A published guide is a `User` with `profileJson.guideListing.status === 'published'`.
  Bookings against a guide therefore store **snapshots** (title, school, duration, price) rather than
  FK references — see the backend's `createGuideBooking`.
- The `Listing` table exists in the schema but the current website booking path is the **guide** path.

---

## Data layer

Two clients, by rendering context:

| File | Used by | What it is |
| --- | --- | --- |
| [`lib/client-api.ts`](./lib/client-api.ts) | **Client components** | Browser REST client to the backend. JWT access/refresh + user in `localStorage` (`ucpt_access` / `ucpt_refresh` / `ucpt_user`); a 401 transparently refreshes once and retries. Exposes `authApi`, `guidesApi`, `accountApi`, `bookingsApi`, `reviewsApi`, plus `tokenStore`, `ApiError`, `friendlyError`. `API_URL` = `NEXT_PUBLIC_API_URL` \|\| `NEXT_PUBLIC_API_BASE_URL` \|\| `http://localhost:4000`. |
| [`lib/api.ts`](./lib/api.ts) | **Server components** | `@ucpt/sdk` instance for server-side data fetching. |
| [`lib/guides.ts`](./lib/guides.ts) | both | `GuideProfile` / `Guide` / `CommunityGuideDto` types + `GuideService` union; some legacy mock guides. |
| [`lib/schools.ts`](./lib/schools.ts) | both | School/university types + data helpers. |
| [`lib/data.ts`](./lib/data.ts) | marketing pages | Static mock content (testimonials, FAQs, how-it-works, etc.). |
| [`lib/auth.ts`](./lib/auth.ts) | client | Session helpers over `tokenStore`. |
| [`lib/toast.tsx`](./lib/toast.tsx) | client | `useToast()` provider/hook. |
| [`lib/utils.ts`](./lib/utils.ts) | all | `cn()`, `formatPrice()` (cents → `$`), date helpers. |

`client-api.ts` API groups (all under `/api/v1`):
- `authApi` — login, register, refresh, me, verify-email, forgot/reset-password
- `guidesApi` — public community guides (`/search/community-guides`), guide detail
- `accountApi` — profile, onboarding role choice, `saveGuideListing` / `deleteGuideListing` (writes `profileJson.guideListing`)
- `bookingsApi` — `createGuide`, `confirmPayment`, `list('guest'|'guide')`, `accept`, `decline`, `complete`
- `reviewsApi` — reviews received by a guide

---

## Stripe booking flow (authorize-then-capture)

Payment model: the card is **authorized (held)** at booking, and only **captured when the guide
accepts**. Backend booking status gains a `PENDING_PAYMENT` state (hidden from both parties until the
hold clears). See the backend memory / `apps/backend/src/services/booking.service.ts`.

Frontend sequence (in [`components/guide/guide-detail.tsx`](./components/guide/guide-detail.tsx) →
`BookingCard`, `status: 'idle' | 'submitting' | 'paying' | 'requested'`):

1. Guest configures tour type / guests / date / time / duration → clicks **Reserve**.
2. `bookingsApi.createGuide(input)` creates the booking (`PENDING_PAYMENT`) + a manual-capture
   PaymentIntent and returns `{ id, clientSecret, publishableKey }`.
3. If `clientSecret` is present → `status: 'paying'` renders
   [`components/guide/booking-payment.tsx`](./components/guide/booking-payment.tsx) — a Stripe
   **`<Elements>` + `<PaymentElement>`** step (`@stripe/react-stripe-js`, `loadStripe` cached per
   publishable key), maroon-themed. `stripe.confirmPayment({ redirect: 'if_required' })` authorizes
   the card, then `bookingsApi.confirmPayment(bookingId)` flips the booking `PENDING_PAYMENT → PENDING`
   (a webhook is the idempotent backstop). → `status: 'requested'` ("Request sent").
4. If Stripe is disabled, `clientSecret` is `null` and the booking is live immediately.

`my-tours` (guest/guide views) never shows `PENDING_PAYMENT` — the backend filters it. When adding a
`Record<BookingStatus, …>` (e.g. `STATUS_STYLE` in `my-tours-view.tsx`), include the
`PENDING_PAYMENT` key to satisfy the type.

Guide payouts are **manual/admin-recorded** for now (Stripe Connect is a later phase).

---

## Routes

```
app/
├── page.tsx                     # Homepage (hero search, explore map, featured guides, …)
├── layout.tsx                   # fonts, Navbar, Footer, metadata, Providers
├── search/                      # guide search (filters, sort, map)
├── universities/  [slug]/       # index + university detail
├── ambassadors/[id]/            # public guide profile → GuideDetail + booking card
├── my-tours/                    # buyer + guide bookings ("as guest" / "as guide")
├── onboarding/                  # choose BUYER vs SELLER (sets role)
├── become-a-guide/              # guide conversion landing
├── manage-listing/              # guide listing builder (writes profileJson.guideListing)
├── payouts/  settings/  profile/# guide/account surfaces
├── login/ register/ forgot-password/ reset-password/ verify-email/
├── how-it-works/ for-parents/ group-tours/ virtual-tours/ about/ contact/
├── faq/ help/ resources/ blog/ [slug]/ testimonials/ partnerships/ refer/
└── terms/ privacy/ trust-safety/
```

---

## Components (by folder)

- `ui/` — `Button`, `Badge`, `Avatar`, `Accordion`, `Reveal`/`RevealGroup`, `SectionHeading`,
  `StarRating`, `Pagination`
- `guide/` — **`guide-detail.tsx`** (profile + `BookingCard`), **`booking-payment.tsx`** (Stripe
  Payment Element), `guide-application.tsx`, `guide-landing.tsx`, `become-guide-gate.tsx`
- `tours/` — `my-tours-view.tsx` (guest/guide booking lists, accept/decline/complete)
- `listing/` — `manage-listing-view.tsx`, `listing-progress.tsx` (step-by-step guide-listing builder,
  draft saves, resume, edit/delete)
- `settings/` — account, contact, college status, password, **payments**, **payouts**
- `home/` — `hero`, `explore-map` / `map-view` (Leaflet), `featured-guides`, `popular-schools`,
  `trusted-reviews`, `personal-way`, `become-guide`, `faq-section`
- `search/` — `guide-search-bar`, `search-bar`, `search-results`
- `cards/` — `ambassador-card`, `university-card`
- `layout/` — `navbar`, `footer`, `user-menu`, `newsletter-form`, `coming-soon`
- `universities/` — `university-explorer`, `explore-screen`
- `auth/`, `about/`, `blog/`, `contact/`, `onboarding/`, `parents/`, `help/`, `resources/`,
  `testimonials/`, `partnerships/`, `refer/`, `group-tours/`, `virtual-tours/`, `brand/logo.tsx`

---

## Brand & design system

Collegiate crest palette. **Maroon** primary (`maroon-900 #6b1521` / `maroon-800`), **gold** accent
(`gold-500 #cf9526`), **ivory/cream/ink** canvas, `verified #2f7d57` for success. Type: **Playfair
Display** (`font-display`) + **Inter** (`font-sans`). Motion 150–300ms, `ease-premium`. Helpers:
`.container-page`, `.eyebrow`, `.text-gold-gradient`, `.bg-grid`. Tokens in
[`tailwind.config.ts`](./tailwind.config.ts); base styles in `app/globals.css`. Full spec in
[`design.md`](./design.md). Icons: `lucide-react` only (never emoji). All motion respects
`prefers-reduced-motion`.

---

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` (or `NEXT_PUBLIC_API_BASE_URL`) | Backend base URL for `client-api.ts` |

The Stripe **publishable key is returned by the backend** in the `createGuide` response and passed to
`loadStripe` — no `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` needed on the website.

---

## Conventions for edits

- Client components that call the backend use `client-api.ts` (`'use client'`, `tokenStore` for auth).
- Money in integer cents everywhere; `formatPrice()` to render.
- Catch `ApiError` and surface `friendlyError(e)` via `useToast()`.
- Adding a booking status → update the `BookingStatus` union in `client-api.ts` **and** any
  `Record<BookingStatus, …>` (e.g. `my-tours-view.tsx`).
