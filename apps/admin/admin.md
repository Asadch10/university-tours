# University Campus Private Tours — Admin Portal

The web-only **operations console** for University Campus Private Tours. From here the platform team
vets student-ambassador applications, manages universities and listings, moderates content, controls
commission and payouts, configures the mobile apps, and audits every action.

Built with **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS**, **Framer Motion**, and
**Recharts**, it shares the exact brand and design system as the [public website](../website) so the
two products feel like one. Part of the
[University Campus Private Tours monorepo](../../README.md).

---

## Quick start

```bash
pnpm --filter @ucpt/admin dev      # → http://localhost:3001
```

Backend must also be running:

```bash
pnpm --filter @ucpt/backend dev    # → http://localhost:4000
```

Or from the repo root: `pnpm dev` (starts both via Turborepo).

### Credentials

```
Email:    asadnaeem8@gmail.com
Password: Test@123
```

---

## Scripts

| Command          | Description                                 |
| ---------------- | ------------------------------------------- |
| `pnpm dev`       | Dev server with hot reload (port **3001**)  |
| `pnpm build`     | Production build (type-checks & prerenders) |
| `pnpm start`     | Serve the production build                  |
| `pnpm typecheck` | `tsc --noEmit`                              |
| `pnpm lint`      | Next.js ESLint                              |

---

## Design system

A classic professional **blue** `brand` scale (`brand-600/800/900`) — familiar and highly readable —
with a warm **gold** (`gold-500`) accent kept for charts, progress bars, and highlights, over a warm
**ivory/cream/ink** canvas. Type is **Playfair Display** (`font-display`) +
**Inter** (`font-sans`) via `next/font`. The admin layer adds console-tuned status colors
(`info · warn · danger · success`), a denser shadow scale, and a blue-gradient sidebar. Tokens
live in [`tailwind.config.ts`](./tailwind.config.ts); base styles in [`app/globals.css`](./app/globals.css).

Every interactive surface implements the full set of states: **loading** (skeletons), **empty**,
**error**, **success** (toasts), and **confirmation** (modal with optional reason capture).

---

## Architecture

```
apps/admin/
├── app/
│   ├── layout.tsx              # fonts + Providers, never-indexed metadata
│   ├── providers.tsx           # React Query · Auth · Toast · Confirm
│   ├── globals.css             # tokens, skeleton shimmer, branded scrollbars
│   ├── login/page.tsx          # split-screen sign-in (real JWT auth)
│   └── (console)/              # authenticated route group (guarded shell)
│       ├── layout.tsx          # AppShell (sidebar + topbar + auth guard)
│       ├── dashboard/          # KPIs, revenue/booking charts, queues
│       ├── applications/       # approve / reject / request-changes
│       ├── questionnaire/      # versioned no-code builder (fully live)
│       ├── universities/
│       ├── listings/  [id]/    # list + listing detail (listing-details.tsx)
│       ├── bookings/  [id]/    # list + booking detail (read-only money breakdown)
│       ├── users/  reviews/
│       ├── transactions/  [bookingId]/   # payments list + INVOICE DETAIL (Stripe)
│       ├── refunds/  commission/
│       ├── cms/  templates/  app-config/
│       └── roles/              # admins list · audit log (single-admin mode)
├── components/
│   ├── ui/                     # Button, Badge, StatusBadge, Card, Table, Modal,
│   │                           # Confirm, Toast-driven, Input/Select/Field, Switch,
│   │                           # Tabs, Dropdown, SearchInput, Skeleton, states, StatCard
│   ├── auth/permission-gate.tsx # <RequirePermission> (page) + <Can> (action)
│   ├── layout/                 # AppShell, Sidebar, Topbar
│   ├── listings/listing-details.tsx
│   ├── dashboard/charts.tsx    # Recharts (revenue area + bookings bar)
│   └── brand/logo.tsx          # inline crest mark
└── lib/
    ├── rbac.ts                 # single-admin mode — all permission checks pass
    ├── auth.tsx                # real JWT session via /api/v1/auth/login + /refresh
    ├── api.ts                  # typed fetch client (token rotation) + all DTOs
    ├── queries.ts              # TanStack Query hooks (all live backend calls)
    ├── nav.ts                  # nav map (route → icon → permissions)
    ├── toast.tsx               # toast provider/hook
    ├── data.ts                 # UI-facing types (+ a few legacy mock shapes)
    └── utils.ts                # cn, formatPrice (cents), dates, humanize, CSV export
```

Data flow per module: page → `queries.ts` hook (`useX`) → `adminApi.x()` in `api.ts` (typed fetch,
returns a `…Dto`) → hook maps the DTO into the UI shape declared in `data.ts`. To add/change a field
end-to-end you touch the backend service/route, then `api.ts` (DTO), `queries.ts` (mapping), and the
page. `data.ts` is now mostly **types** — the modules below are all live.

---

## Auth & access control

**Single-admin mode** — there is one admin account (`asadnaeem8@gmail.com`). All permission checks
pass automatically; no role matrix is enforced on the frontend. The backend validates only that the
caller holds the `ADMIN` role (JWT `role` claim).

Auth flow:

1. `POST /api/v1/auth/login` → `{ accessToken, refreshToken, user }`
2. Tokens stored in `localStorage`; `api.ts` attaches `Authorization: Bearer <access>` on every request
3. On 401, `api.ts` transparently calls `POST /api/v1/auth/refresh` once and retries
4. `<RequirePermission>` and `<Can>` are wired but pass unconditionally in single-admin mode

---

## Live vs mock data

| Module | Status |
| ------ | ------ |
| Auth (login / refresh / me) | **Live** |
| Dashboard | **Live** |
| Applications | **Live** |
| Questionnaire (list, add/edit/delete/reorder/publish) | **Live** |
| Universities (schools) | **Live** |
| Users | **Live** |
| Listings | **Live** |
| Bookings | **Live** |
| Reviews | **Live** |
| Transactions / Payouts | **Live** |
| Refunds | **Live** |
| Commission | **Live** |
| CMS | **Live** |
| Notification Templates | **Live** |
| App Configuration | **Live** |
| Audit Logs | **Live** |

Money is **integer cents** throughout; timestamps are ISO UTC.

---

## Questionnaire module

The questionnaire page is **fully dynamic** — all operations call the real backend API:

| Operation | Method | Endpoint |
| --------- | ------ | -------- |
| List versions | `GET` | `/api/v1/admin/questionnaires` |
| Add question | `POST` | `/api/v1/admin/questionnaires/:id/questions` |
| Edit question | `PUT` | `/api/v1/admin/questionnaires/:id/questions/:qid` |
| Delete question | `DELETE` | `/api/v1/admin/questionnaires/:id/questions/:qid` |
| Reorder questions | `PUT` | `/api/v1/admin/questionnaires/:id/questions/reorder` |
| Publish new version | `POST` | `/api/v1/admin/questionnaires` |
| Publish (activate) | `POST` | `/api/v1/admin/questionnaires/:id/publish` |

After every mutation, TanStack Query invalidates the `['questionnaires']` cache and refetches —
no local state needed for the question list.

**Question type mapping** (frontend ↔ backend DB):

| Frontend | DB enum |
| -------- | ------- |
| `SHORT_TEXT` | `TEXT` |
| `LONG_TEXT` | `LONG_TEXT` |
| `SINGLE_SELECT` | `SINGLE_CHOICE` |
| `MULTI_SELECT` | `MULTI_CHOICE` |
| `FILE` | `FILE` |

**Status mapping**: `ACTIVE` (DB) = `PUBLISHED` (frontend); `DRAFT` and `ARCHIVED` unchanged.

---

## Transactions, invoices & Stripe (money)

The platform uses **authorize-then-capture** Stripe payments (see the backend). What the admin needs
to know:

- **`Payment` model** (backend/DB): one per booking. Stores the full Stripe PaymentIntent payload
  (`rawJson`) plus extracted invoice fields — card brand/last4/exp, billing name/email, receipt URL,
  status, amount, amount refunded, authorized/captured timestamps. Written when the card is authorized,
  updated on capture and refund.
- **Transactions list** (`/transactions`, "Payments" tab) is **payment-based**: `GET /admin/transactions`
  returns one row per `Payment` (so a transaction appears the moment the card is **authorized**, not
  only after capture). Rows show **Invoice #** (`INV-<last8 of bookingId>`, via `invoiceNo()` in
  `queries.ts`), a **payment-status badge** (Authorized / Captured / Refunded / …), **Guest**,
  **Guide**, **Card** (`Visa ···· 4242`), gross / commission / net. Abandoned carts
  (`requires_payment_method`, etc.) are filtered out server-side. Rows are **clickable** → invoice.
- **Invoice detail** (`/transactions/[bookingId]`): `GET /admin/transactions/:bookingId`
  (`getInvoice`) → billed-to/paid-to, booking details, money breakdown, ledger, refunds, a
  payment-method sidebar (card, receipt link, "View in Stripe"), and a collapsible **raw Stripe
  payload** viewer.
- **Refunds** (`/refunds` + invoice) call Stripe `refunds.create` and store `stripeRefundId`; a
  compensating REFUND ledger entry keeps balances correct.
- **Guide balances / Payouts** tabs still derive from the append-only **`LedgerEntry`** (CAPTURE on
  accept, REFUND on refund). Payouts are **manually recorded** by admins (Stripe Connect is a later
  phase). Commission % lives in `Settings.commissionPct`, snapshotted per booking.
- **Backfill**: `apps/backend/src/scripts/backfill-payments.ts` re-creates `Payment` rows from Stripe
  for bookings that predate the model — `pnpm exec tsx src/scripts/backfill-payments.ts` from `apps/backend`.

Booking status includes **`PENDING_PAYMENT`** (card not yet authorized). It's added to the admin
`BookingStatus` union (`data.ts`) and `StatusBadge`; unpaid bookings are generally hidden from lists.

---

## Environment & deployment

Runs standalone on **port 3001**, deployed independently of the public website (separate
domain/subdomain). Requires the backend at `NEXT_PUBLIC_API_URL` (defaults to
`http://localhost:4000`).

Recommended access hardening for production: 2FA for all admins + an IP allowlist or SSO/VPN in
front of the admin domain. The console is `noindex` and excluded from sitemaps by design.

---

## Roadmap

- Stripe Connect for automatic guide payouts (replaces manual payout recording)
- Real document viewer for encrypted enrollment proofs (presigned, admin-only)
- Server-side pagination/filtering/sorting on large tables (TanStack Query is already wired)
- TOTP 2FA enrollment + enforcement
- Date-range report builder with scheduled CSV exports
- Restore multi-role RBAC when the team grows beyond a single admin
