# Deploying website + admin + backend on one domain

Live domain: `https://phpstack-1510285-6494046.cloudwaysapps.com`

```
https://<domain>/          →  website   (Next, 127.0.0.1:3000)
https://<domain>/admin     →  admin     (Next basePath=/admin, 127.0.0.1:3001)
https://<domain>/api/...   →  backend   (Express /api/v1, 127.0.0.1:4000)
https://<domain>/uploads/  →  backend   (uploaded images)
```

The three apps each run as their own Node process; an **Nginx reverse proxy**
routes by path. Admin already carries `basePath: '/admin'` (in
`apps/admin/next.config.mjs`), so it lives entirely under `/admin` with no code
changes elsewhere.

---

## 1. Prerequisites on the server (SSH)

```bash
# Node 20+ and pnpm (via corepack)
node -v                                   # must be >= 20
corepack enable
corepack prepare pnpm@9.15.0 --activate

# PM2 process manager
npm install -g pm2
```

> ⚠️ **Database:** the backend uses **PostgreSQL** (Prisma). Cloudways only
> offers MySQL/MariaDB, so point `DATABASE_URL` at an **external Postgres**
> (e.g. Supabase, Neon, Railway, or an RDS instance). MySQL will not work.

---

## 2. Environment files

Create these on the server (they are gitignored — never commit secrets).

**`apps/backend/.env`**
```ini
NODE_ENV=production
API_PORT=4000
DATABASE_URL=postgresql://USER:PASS@EXTERNAL_HOST:5432/campus_tours

# Same domain for all three apps
APP_WEB_URL=https://phpstack-1510285-6494046.cloudwaysapps.com
CORS_ALLOWLIST=https://phpstack-1510285-6494046.cloudwaysapps.com

# Use strong, unique secrets in production
JWT_ACCESS_SECRET=change-me-strong
JWT_REFRESH_SECRET=change-me-strong
EMAIL_VERIFY_SECRET=change-me-strong
PASSWORD_RESET_SECRET=change-me-strong

# Email (Resend over SMTP)
MAIL_HOST=smtp.resend.com
MAIL_PORT=465
MAIL_USERNAME=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
MAIL_FROM_ADDRESS=no-reply@ahmadnaeem.com
MAIL_FROM_NAME=University Campus Private Tours
```

**`apps/website/.env.production`**
```ini
NEXT_PUBLIC_API_URL=https://phpstack-1510285-6494046.cloudwaysapps.com
NEXT_PUBLIC_API_BASE_URL=https://phpstack-1510285-6494046.cloudwaysapps.com
```

**`apps/admin/.env.production`**
```ini
NEXT_PUBLIC_API_URL=https://phpstack-1510285-6494046.cloudwaysapps.com
```

> `NEXT_PUBLIC_*` values are **baked in at build time**, so these files must
> exist *before* you run the builds below. All calls are same-origin
> (`/api/...`), so no CORS headaches.

---

## 3. Install, migrate, build

From the repo root:

```bash
pnpm install --frozen-lockfile

# Prisma: generate client + apply migrations to the external Postgres
pnpm --filter @ucpt/db generate
pnpm --filter @ucpt/db exec prisma migrate deploy

# Build all three (backend first so the website's build-time fetches work)
pnpm --filter @ucpt/backend build
pnpm --filter @ucpt/website build
pnpm --filter @ucpt/admin build
```

---

## 4. Start everything with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup          # run the command it prints, to survive reboots
pm2 status           # ucpt-backend / ucpt-website / ucpt-admin should be "online"
```

Quick local sanity check (before the proxy is wired):
```bash
curl -s localhost:4000/health           # {"status":"ok"}
curl -sI localhost:3000 | head -1        # 200 (website)
curl -sI localhost:3001/admin | head -1  # 200 (admin)
```

---

## 5. Reverse proxy (the Cloudways step)

The routing rules are in **`deploy/nginx-cloudways.conf`**. They must be added to
your application's Nginx server block, with the specific paths (`/api`,
`/uploads`, `/admin`) **before** the catch-all `/`.

On Cloudways this is the one part you can't do from the app code. Do **one** of:

- **Cloudways support ticket** (simplest): paste `deploy/nginx-cloudways.conf`
  and ask them to add these reverse-proxy `location` blocks to your app's Nginx
  vhost. This is the reliable, upgrade-safe route on managed Cloudways.
- **SSH (advanced):** add the blocks to the app's Nginx include and reload:
  ```bash
  sudo nginx -t && sudo systemctl reload nginx
  ```

After the proxy is live:
```bash
curl -sI https://phpstack-1510285-6494046.cloudwaysapps.com/         # website
curl -sI https://phpstack-1510285-6494046.cloudwaysapps.com/admin    # admin
curl -s  https://phpstack-1510285-6494046.cloudwaysapps.com/api/v1/search/community-guides
```

---

## 6. Redeploying after a code change

```bash
git pull
pnpm install --frozen-lockfile
pnpm --filter @ucpt/db exec prisma migrate deploy   # if schema changed
pnpm --filter @ucpt/backend build
pnpm --filter @ucpt/website build
pnpm --filter @ucpt/admin build
pm2 restart ecosystem.config.cjs
```

---

## Notes

- **Uploads** are stored on the server's local disk (`apps/backend/uploads/`)
  and served at `/uploads`. They survive restarts but not a server rebuild —
  move to S3/Cloudinary for durable storage later (only `lib/uploads.ts` +
  the static mount change).
- **Admin URL:** the admin app now redirects/links under `/admin` automatically.
  Log in at `https://<domain>/admin`.
- If a Next build fails on a page that fetches data at build time, make sure the
  backend is running first, or that page will be built on demand at request time.
