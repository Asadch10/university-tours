# University Campus Private Tours — Admin Portal

The web-only **operations console** for University Campus Private Tours. From here the platform team
vets student-ambassador applications, manages universities and listings, moderates content, controls
commission and payouts, configures the mobile apps, and audits every action — all behind
**role-based access control**.

Built with **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS**, **Framer Motion**, and
**Recharts**, it shares the exact brand and design system as the [public website](../website) so the
two products feel like one. Part of the
[University Campus Private Tours monorepo](../../README.md).

> Implements **Part II — Admin Panel** of the Complete Technical Documentation (15 functional
> modules, 3 roles, RBAC matrix, CMS & remote app control).

---

## Quick start

```bash
pnpm --filter @ucpt/admin dev      # → http://localhost:3001
```

Or from this folder (`apps/admin`): `pnpm dev`. If deps aren't installed, run `pnpm install` once
from the repo root.

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
| `pnpm start`     | Serve the production build                   |
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
│   ├── login/page.tsx          # premium split-screen sign-in (dummy auth)
│   └── (console)/              # authenticated route group (guarded shell)
│       ├── layout.tsx          # AppShell (sidebar + topbar + auth guard)
│       ├── dashboard/          # KPIs, revenue/booking charts, queues
│       ├── applications/       # approve / reject / request-changes
│       ├── questionnaire/      # versioned no-code builder
│       ├── universities/  listings/
│       ├── bookings/  users/  reviews/
│       ├── transactions/  refunds/  commission/
│       ├── cms/  templates/  app-config/
│       └── roles/              # admins · permission matrix · audit log
├── components/
│   ├── ui/                     # Button, Badge, StatusBadge, Card, Table, Modal,
│   │                           # Confirm, Toast-driven, Input/Select/Field, Switch,
│   │                           # Tabs, Dropdown, SearchInput, Skeleton, states, StatCard
│   ├── auth/permission-gate.tsx # <RequirePermission> (page) + <Can> (action)
│   ├── layout/                 # AppShell, Sidebar, Topbar
│   ├── dashboard/charts.tsx    # Recharts (revenue area + bookings bar)
│   └── brand/logo.tsx          # inline crest mark
└── lib/
    ├── rbac.ts                 # Role, Permission, ROLE_PERMISSIONS matrix
    ├── auth.tsx                # dummy session + role switching + can()/canAny()
    ├── nav.ts                  # 15-module nav map (route → icon → permissions)
    ├── toast.tsx               # toast provider/hook
    ├── data.ts                 # typed mock store (mirrors the DB entity catalog)
    └── utils.ts                # cn, formatPrice (cents), dates, CSV export, simulate
```

---

## Role-based access control

Three roles, mirroring **Part II §6**. RBAC is enforced at **four layers**, deny-by-default:

| Layer          | Mechanism                                                                 |
| -------------- | ------------------------------------------------------------------------- |
| **Navigation** | `Sidebar` hides modules the role can't access (`nav.ts` permissions)      |
| **Page**       | `<RequirePermission anyOf={[…]}>` renders a Forbidden state otherwise     |
| **Component**  | `<Can perm="…">` hides action buttons the role can't perform              |
| **Action**     | each handler re-checks `can(perm)` before mutating                        |

> In production the backend re-validates every permission server-side — the client gate is the first
> of two layers. Permissions are **key-based**, so role→permission mappings change without touching UI.

| Capability (sample)        | Super Admin | Manager | Support |
| -------------------------- | :---------: | :-----: | :-----: |
| Dashboard & reports        | ✓ | ✓ | ✓ |
| Moderate listings & reviews| ✓ | ✓ | ✓ |
| Manage users               | ✓ | ✓ | ✓ |
| Decide applications        | ✓ | ✓ | — |
| Refunds & payouts          | ✓ | ✓ | — |
| Universities · CMS · config| ✓ | ✓ | — |
| Set commission %           | ✓ | — | — |
| Manage admins & roles      | ✓ | — | — |

The full matrix is browsable in-app under **Roles & Audit → Permissions**.

---

## The fifteen modules

Dashboard · Applications · Questionnaire · Universities · Listings · Bookings · Users · Reviews ·
Transactions & Payouts · Refunds · Commission · CMS · Notification Templates · App Configuration ·
Roles & Audit — each with full CRUD/workflows, filters, search, CSV export where relevant, and all
five UI states.

---

## Data & API

All content is **mock data** in [`lib/data.ts`](./lib/data.ts), shaped to match the PostgreSQL entity
catalog (Part IV) and the REST contract (Part I §7). Money is **integer cents**; timestamps are ISO
UTC. Mutations are **simulated client-side** (local state + toast) — each is marked with a
`// Wire to @ucpt/sdk …` comment showing where the real `@ucpt/sdk` call against
`/api/v1/admin/*` goes once the backend is live. Auth (`lib/auth.tsx`) is a local dummy session;
swap `signIn` for `POST /api/v1/auth/login`.

---

## Environment & deployment

Runs standalone on **port 3001**, deployed independently of the public website (separate
domain/subdomain). Recommended access hardening for production: 2FA for all admins + an IP
allowlist or SSO/VPN in front of the admin domain. The console is `noindex` and excluded from
sitemaps by design.

---

## Roadmap

- Wire `@ucpt/sdk` to the live backend (replace `lib/data.ts` mocks + simulated mutations)
- Real document viewer for encrypted enrollment proofs (presigned, admin-only)
- Server-side pagination/filtering/sorting on large tables (TanStack Query is already wired)
- TOTP 2FA enrollment + enforcement; real audit-log persistence
- Date-range report builder with scheduled CSV exports
