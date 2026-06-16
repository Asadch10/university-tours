# University Campus Private Tours — Monorepo

A two-sided marketplace connecting prospective students and families with current student
ambassadors for **private campus tours, virtual video consultations, and university guidance**.

This repository is the pnpm + Turborepo monorepo described in the project's Complete Technical
Documentation (Parts I–V). It co-locates the backend, worker, web clients, mobile app, and shared
packages so types, validation, and the API contract are defined once and reused everywhere.

## Platform at a glance

| Component      | Technology                  | Role                                                       |
| -------------- | --------------------------- | ---------------------------------------------------------- |
| Public Website | Next.js                     | Discovery, booking, conversion (SEO-critical)              |
| Admin Panel    | Next.js                     | Web-only operations & platform control                     |
| Backend API    | Node.js (Express) + worker  | Single contract; business logic; payments; jobs; chat      |
| Database       | PostgreSQL + Prisma         | System of record; integrity & financial ledger             |
| Mobile App     | React Native (Expo)         | iOS & Android; same core flows as the web                  |

## Workspace layout

```
Campus-Tours/
├── apps/
│   ├── backend/    # Express + TypeScript REST API (the single contract)
│   ├── worker/     # BullMQ jobs/cron + Socket.IO chat gateway
│   ├── admin/      # Next.js operations console (web-only)
│   ├── website/    # Next.js public discovery/booking site (SEO)
│   └── mobile/     # Expo React Native app (buyer + ambassador)
└── packages/
    ├── db/         # Prisma schema (system of record), client, seed
    ├── types/      # Shared domain & DTO types
    ├── validation/ # Zod schemas shared by API + clients
    └── sdk/        # Typed API client used by web + mobile
```

## Prerequisites

- Node.js 20+ (LTS recommended; repo developed on Node 25 too)
- pnpm 9 (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- PostgreSQL 15+ and Redis 7+ (local or via Docker)

## Getting started

```bash
# 1. Install all workspace dependencies
pnpm install

# 2. Configure environment
cp .env.example .env   # then edit values

# 3. Generate the Prisma client (and run migrations once a DB is up)
pnpm db:generate
# pnpm db:migrate
# pnpm db:seed

# 4. Run everything in dev
pnpm dev
```

### Useful scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `pnpm dev`          | Run all apps in watch mode (Turborepo)              |
| `pnpm build`        | Build every package and app                         |
| `pnpm typecheck`    | Type-check the whole monorepo                       |
| `pnpm lint`         | Lint the whole monorepo                             |
| `pnpm db:generate`  | Regenerate the Prisma client                        |
| `pnpm db:migrate`   | Apply Prisma migrations                             |
| `pnpm db:seed`      | Seed reference data (price bounds, settings, admin) |

## Cross-cutting decisions (v1)

- Single **global commission** (default 25%), **snapshotted per booking**.
- **Admin-configurable** refund windows and booking-request expiry.
- Availability via **real-time accept/decline** (no fixed calendars).
- **Manual payouts** (no Stripe Connect in v1); balances are tracked.
- **USD / English** only in v1; architecture is string-table & multi-currency ready.
- Money stored as **integer cents**; timestamps in **UTC**.

## Status

This is a **structural scaffold**: the full workspace, configs, Prisma schema (from the Database
doc), and runnable app skeletons are in place. Routes, screens, and business logic are stubbed and
ready to be implemented module by module against the documentation.
