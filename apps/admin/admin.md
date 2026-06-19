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

Shares the website's tokens verbatim — collegiate **maroon** (`maroon-800/900`) + **gold**
(`gold-500`) accent + warm **ivory/cream/ink** canvas, **Playfair Display** (`font-display`) +
**Inter** (`font-sans`) via `next/font`. The admin layer adds console-tuned status colors
(`info · warn · danger · success`), a denser shadow scale, and a maroon-gradient sidebar. Tokens
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
│       ├── universities/  listings/
│       ├── bookings/  users/  reviews/
│       ├── transactions/  refunds/  commission/
│       ├── cms/  templates/  app-config/
│       └── roles/              # admins list · audit log (single-admin mode)
├── components/
│   ├── ui/                     # Button, Badge, StatusBadge, Card, Table, Modal,
│   │                           # Confirm, Toast-driven, Input/Select/Field, Switch,
│   │                           # Tabs, Dropdown, SearchInput, Skeleton, states, StatCard
│   ├── auth/permission-gate.tsx # <RequirePermission> (page) + <Can> (action)
│   ├── layout/                 # AppShell, Sidebar, Topbar
│   ├── dashboard/charts.tsx    # Recharts (revenue area + bookings bar)
│   └── brand/logo.tsx          # inline crest mark
└── lib/
    ├── rbac.ts                 # single-admin mode — all permission checks pass
    ├── auth.tsx                # real JWT session via /api/v1/auth/login + /refresh
    ├── api.ts                  # typed fetch client (access/refresh token rotation)
    ├── queries.ts              # TanStack Query hooks (all live backend calls)
    ├── nav.ts                  # 15-module nav map (route → icon → permissions)
    ├── toast.tsx               # toast provider/hook
    ├── data.ts                 # typed mock store for modules not yet wired live
    └── utils.ts                # cn, formatPrice (cents), dates, CSV export
```

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

## Environment & deployment

Runs standalone on **port 3001**, deployed independently of the public website (separate
domain/subdomain). Requires the backend at `NEXT_PUBLIC_API_URL` (defaults to
`http://localhost:4000`).

Recommended access hardening for production: 2FA for all admins + an IP allowlist or SSO/VPN in
front of the admin domain. The console is `noindex` and excluded from sitemaps by design.

---

## Roadmap

- Real document viewer for encrypted enrollment proofs (presigned, admin-only)
- Server-side pagination/filtering/sorting on large tables (TanStack Query is already wired)
- TOTP 2FA enrollment + enforcement
- Date-range report builder with scheduled CSV exports
- Restore multi-role RBAC when the team grows beyond a single admin
