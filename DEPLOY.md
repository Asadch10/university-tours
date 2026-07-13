# Deployment — Cloudways (website + admin + backend + MySQL)

Live domain: `https://phpstack-1510285-6494046.cloudwaysapps.com`

All three apps run as Node processes managed by **PM2**; the Cloudways **Nginx
reverse proxy** serves them under one domain. The database is **MySQL** (native
to Cloudways — no external DB).

```
https://<domain>/          →  website   (127.0.0.1:3000)
https://<domain>/admin     →  admin     (127.0.0.1:3001, next basePath=/admin)
https://<domain>/api/...   →  backend   (127.0.0.1:4000, Express /api/v1)
https://<domain>/uploads/  →  backend   (uploaded images)
```

Key files in this repo:

| File | Purpose |
|---|---|
| `ecosystem.config.cjs` | PM2 process definitions (backend :4000, website :3000, admin :3001) |
| `deploy/nginx-cloudways.conf` | Reverse-proxy `location` blocks for the Nginx vhost |

---

## Prerequisites (once per server)

- A Cloudways **Custom App / Node** application. Note from the panel:
  - **Access Details** → SSH master user + password, and **DB Name / DB User / DB Password**
    (MySQL host `localhost`, port `3306`).
  - App path on the server: `~/applications/YOUR_APP/public_html`.
- SSH access (PuTTY, Windows Terminal, or WinSCP's built-in terminal — `Ctrl+P`).
- Install the toolchain on the server (first time only). No sudo on Cloudways,
  so global npm packages go into your **home directory**:

```bash
node -v && npm -v        # sanity check — Node ≥ 20.6 needed (seed uses --env-file)

mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

npm install -g pnpm@9.15.0 pm2
pnpm -v && pm2 -v        # both must print a version before continuing
```

> The `PATH` line in `~/.bashrc` only applies to interactive shells — cron jobs
> must use the full path, e.g. `@reboot $HOME/.npm-global/bin/pm2 resurrect`.

> **Application user vs master user:** if you SSH with *application* credentials
> (e.g. `vanuat`), writing `~/.bashrc` fails with "Operation not permitted" —
> the install still works, but you must run
> `export PATH=$HOME/.npm-global/bin:$PATH` at the start of **every** SSH
> session (or use full paths like `~/.npm-global/bin/pnpm`). SSH as the
> **master user** (Server → Master Credentials) to make the PATH permanent.

---

## Step 1 — Get the code onto the server

Pick **one** of the two methods. Either way the code must land in
`~/applications/YOUR_APP/public_html` (the repo root, containing `package.json`
and `pnpm-workspace.yaml`).

### Option A — WinSCP (SFTP upload from Windows)

1. Connect: protocol **SFTP**, host = server IP, port 22, the **master
   credentials** from Access Details.
2. Remote directory: `/home/master/applications/YOUR_APP/public_html`.
3. Upload the project **with this exclusion mask** (Transfer settings →
   Edit → Exclude):

   ```
   node_modules/; .next/; dist/; .git/; .turbo/; .env; .env.*; apps/mobile/; .pnpm-store/
   ```

   Why each exclusion is required:
   - `node_modules/` — **never upload it.** It is huge over SFTP and contains
     Windows-native binaries (Prisma engines, esbuild, sharp) that will not run
     on Linux. Dependencies are installed on the server in Step 3.
   - `.next/`, `dist/`, `.turbo/` — builds happen **on the server** (Step 5);
     local Windows builds bake in localhost env values.
   - `.env`, `.env.*` — protects the **production** env files on the server
     (Step 2) from being overwritten by local dev ones on every sync.
   - `apps/mobile/` — not deployed on this server; skipping saves time.
4. **Redeploys:** use **Commands → Synchronize** (target = remote, same
   exclusion mask) — only changed files are uploaded.

### Option B — Git (clone/pull on the server)

```bash
cd ~/applications/YOUR_APP/public_html
git clone https://github.com/Asadch10/university-tours.git .
# already cloned?  run instead:  git pull
```

> **All remaining commands run from this repo root** — it's a pnpm monorepo, so
> one `pnpm install` here installs every app, and `pnpm --filter @ucpt/<app>`
> targets individual packages from the root. Do **not** `cd` into `apps/*`.

---

## Step 2 — Environment files (BEFORE building)

`NEXT_PUBLIC_*` values are baked in at **build time** — these four files must
exist before Step 5. Create them **on the server** with the heredocs below (SSH
terminal), or with WinSCP's editor — if you use WinSCP, save with **LF line
endings, not CRLF** (a stray `\r` at the end of `DATABASE_URL` or a secret
causes confusing DB/auth failures).

### 2a. Backend — `apps/backend/.env`

Fill DB_USER / DB_PASS / DB_NAME from Access Details. **URL-encode special
chars in the password** (`@` → `%40`, `#` → `%23`, `/` → `%2F`). Cloudways
MySQL listens on TCP, so the host is `localhost:3306` (no socket needed).
Replace every `change-me-strong` with a long random string (`openssl rand -hex 32`).

```bash
cat > apps/backend/.env <<'EOF'
NODE_ENV=production
API_PORT=4000
DATABASE_URL=mysql://DB_USER:DB_PASS@localhost:3306/DB_NAME
APP_WEB_URL=https://phpstack-1510285-6494046.cloudwaysapps.com
CORS_ALLOWLIST=https://phpstack-1510285-6494046.cloudwaysapps.com
JWT_ACCESS_SECRET=change-me-strong
JWT_REFRESH_SECRET=change-me-strong
EMAIL_VERIFY_SECRET=change-me-strong
PASSWORD_RESET_SECRET=change-me-strong
MAIL_HOST=smtp.resend.com
MAIL_PORT=465
MAIL_USERNAME=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
MAIL_FROM_ADDRESS=no-reply@ahmadnaeem.com
MAIL_FROM_NAME=University Campus Private Tours
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
STRIPE_CURRENCY=usd
EOF
```

> **Stripe webhook:** Stripe Dashboard → Developers → Webhooks → add an
> endpoint pointing at `https://<domain>/api/v1/webhooks/stripe` (the
> `payment_intent.*` / checkout events the backend handles), then paste the
> signing secret into `STRIPE_WEBHOOK_SECRET` above.

### 2b. Prisma — `packages/db/.env`  ⚠️ required

The Prisma CLI + seed read **this** file (not the backend's), so it needs the
**same** `DATABASE_URL` or `prisma db push` / `seed` will fail.

```bash
cat > packages/db/.env <<'EOF'
DATABASE_URL=mysql://DB_USER:DB_PASS@localhost:3306/DB_NAME
EOF
```

### 2c. Website — `apps/website/.env.production`

```bash
cat > apps/website/.env.production <<'EOF'
NEXT_PUBLIC_API_URL=https://phpstack-1510285-6494046.cloudwaysapps.com
NEXT_PUBLIC_API_BASE_URL=https://phpstack-1510285-6494046.cloudwaysapps.com
EOF
```

### 2d. Admin — `apps/admin/.env.production`

```bash
cat > apps/admin/.env.production <<'EOF'
NEXT_PUBLIC_API_URL=https://phpstack-1510285-6494046.cloudwaysapps.com
EOF
```

Both frontends point at the **same domain** — the browser calls
`https://<domain>/api/v1/...` and Nginx routes it to port 4000 locally. Same
origin → no CORS pain, no ports exposed publicly.

---

## Step 3 — Install dependencies

```bash
cd ~/applications/YOUR_APP/public_html
pnpm install --frozen-lockfile
```

---

## Step 4 — Database (Prisma)

Generate the client and create/update the MySQL tables (uses `packages/db/.env`):

```bash
pnpm --filter @ucpt/db generate
pnpm --filter @ucpt/db exec prisma db push
pnpm --filter @ucpt/db seed        # optional starter data (fresh DB only)
```

> **Node < 20.6** errors with `bad option: --env-file` on the seed. Either bump
> the Node version in the Cloudways panel, or load the env manually and run
> the seed without the flag:
> ```bash
> set -a; . packages/db/.env; set +a
> pnpm --filter @ucpt/db exec tsx prisma/seed.ts
> ```

---

## Step 5 — Build the frontends

```bash
pnpm --filter @ucpt/website build
pnpm --filter @ucpt/admin build
```

The **backend needs no build** — PM2 runs it via `tsx` straight from TypeScript
source (`apps/backend/src/index.ts`), because the workspace packages
(`@ucpt/db` / `types` / `validation`) ship raw `.ts` that plain `node` cannot
import (crashes with `ERR_UNKNOWN_FILE_EXTENSION`).

---

## Step 6 — Start with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
```

`pm2 startup` needs sudo, which the Cloudways master user doesn't have.
Instead, add a Cloudways **cron job** (Application Settings → Cron Job
Management, or `crontab -e`) so the apps come back after a server reboot
(full path — cron doesn't read `~/.bashrc`):

```
@reboot $HOME/.npm-global/bin/pm2 resurrect
```

Verify the processes locally **before** touching Nginx:

```bash
curl -s  localhost:4000/health          # {"ok":true,...}
curl -sI localhost:3000       | head -1 # HTTP/1.1 200 OK
curl -sI localhost:3001/admin | head -1 # HTTP/1.1 200 OK
```

---

## Step 7 — Nginx reverse-proxy rules

The rules live in `deploy/nginx-cloudways.conf` — five `location` blocks
(`/api/`, `/uploads/`, `/admin`, `/_next/`, then the catch-all `/`).

Your Cloudways user has **no sudo**, so you cannot edit the vhost yourself.
Open a Cloudways **support ticket**, attach that file's contents, and ask for:

1. These `location` blocks added to the application's Nginx server block,
   **keeping the `^~` modifiers exactly as written** — Cloudways PHP-stack
   vhosts have a regex location that serves `.js`/`.css`/images straight from
   disk, and without `^~` it hijacks `/_next/` chunks and `/admin` assets
   (symptom: pages render but JS chunks 400/404, `ChunkLoadError` in the
   browser, `/admin` falls through to the website's 404 page).
2. **Varnish disabled** for this application (or these paths excluded) — it
   caches HTML that references build chunks deleted by the next redeploy.

The config already handles the other easy-to-miss details:
`client_max_body_size 10m` on `/api/` (photo/ID uploads) and
`Upgrade`/`Connection` headers (websockets).

---

## Step 8 — Domain + SSL

SSL terminates at Cloudways' Nginx — the Node apps never see certificates.

1. Point the domain's DNS **A record** at the server IP.
2. Cloudways → app → **Domain Management** → add the domain as primary.
3. **SSL Certificate** → Let's Encrypt → install; enable **auto-renew** and the
   **force-HTTPS redirect**.

The proxy passes `X-Forwarded-Proto`, so the apps know requests are HTTPS.
One domain = one certificate covers website, admin, and API.

> **Switching from the `*.cloudwaysapps.com` staging URL to a real domain?**
> The domain appears in **three env files** (2a: `APP_WEB_URL` +
> `CORS_ALLOWLIST`; 2c and 2d: the `NEXT_PUBLIC_*` URLs) **and** the Stripe
> webhook endpoint. Update all of them, rebuild website + admin (Step 5), and
> `pm2 restart ecosystem.config.cjs`.

---

## Step 9 — Verify the live domain

```bash
curl -sI https://phpstack-1510285-6494046.cloudwaysapps.com/        # 200 website
curl -sI https://phpstack-1510285-6494046.cloudwaysapps.com/admin   # 200 admin login
curl -s  https://phpstack-1510285-6494046.cloudwaysapps.com/api/v1/search/community-guides  # JSON
```

Then in a browser: the website at `/`, the admin login at `/admin`, and a test
booking end-to-end (Stripe checkout → webhook → booking status).

---

## Redeploy after a code change

```bash
cd ~/applications/YOUR_APP/public_html

# 1. Update the code — one of:
git pull                                     # git method
# …or WinSCP: Commands → Synchronize (remote target, same exclusion mask)

# 2. Rebuild + restart:
pnpm install --frozen-lockfile               # only if package.json / lockfile changed
pnpm --filter @ucpt/db exec prisma db push   # only if schema.prisma changed
pnpm --filter @ucpt/website build            # rebuild only the frontend(s) you changed
pnpm --filter @ucpt/admin build              # (backend has no build — tsx runs the source)
pm2 restart ecosystem.config.cjs
```

**Env-change cheat-sheet:**

| What changed | What's needed |
|---|---|
| `apps/backend/.env` | `pm2 restart ucpt-backend` only |
| any `NEXT_PUBLIC_*` value | **rebuild** that frontend, then `pm2 restart` — a restart alone is NOT enough (baked at build time) |
| `schema.prisma` | `prisma db push` + backend rebuild + restart |

---

## Day-2 operations

```bash
pm2 status                    # process list + uptime/restarts
pm2 logs ucpt-backend         # live logs (also: ucpt-website, ucpt-admin)
pm2 monit                     # CPU / memory
pm2 restart ucpt-backend      # restart a single app
pm2 install pm2-logrotate     # once — keep logs from filling the disk
```

- **Backups:** enable Cloudways scheduled server backups (Server → Backups) and
  take an on-demand backup before schema changes — `prisma db push` has no
  down-migration.
- **Uploads** are on local disk (`apps/backend/uploads/`, served at `/uploads`).
  They survive restarts but are **not in git** — never delete that directory,
  and include it in backups. Move to S3/Cloudinary later for durable storage
  (only `lib/uploads.ts` + the static mount change).

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `prisma db push` / seed fails to connect | `packages/db/.env` missing or its `DATABASE_URL` differs from the backend's (2b) |
| DB auth error with correct password | special chars in the password not URL-encoded (`@` → `%40`, `#` → `%23`, `/` → `%2F`) |
| Backend crashes with `ERR_UNKNOWN_FILE_EXTENSION ".ts"` (502 on `/api`) | Backend was started with plain `node` — the workspace packages ship raw `.ts`. PM2 must run it via `tsx` (see `ecosystem.config.cjs`); after changing the config: `pm2 delete ucpt-backend && pm2 start ecosystem.config.cjs --only ucpt-backend && pm2 save --force` |
| Backend rejects logins / odd JWT errors | env file saved with CRLF — recreate it with LF endings (or via the heredocs) |
| Frontend calls `localhost:4000` in production | `.env.production` created **after** the build — fix the file, rebuild (Step 5) |
| 502 on `/`, `/admin`, or `/api` | that PM2 process is down (`pm2 status`, `pm2 logs <name>`) or the Nginx rules aren't in place (Step 7) |
| Pages render but JS chunks 400/404 (`ChunkLoadError`), or `/admin` shows the website's 404 | Nginx rules missing or added without `^~` — the PHP-stack static-file regex intercepts `/_next/` and `/admin` assets; re-open the ticket with `deploy/nginx-cloudways.conf` as-is (Step 7). Also disable Varnish |
| Site breaks right after a redeploy, fixed by hard-refresh | Varnish (or browser) cached HTML referencing old build chunks — disable Varnish for this app |
| Apps gone after server reboot | `@reboot pm2 resurrect` cron missing, or `pm2 save` never ran |
| `EADDRINUSE` in `pm2 logs`; site serves a **stale build** (chunk 400s, old pages) | An old process still holds the port. `pm2 update && pm2 delete all`, confirm ports are free with `ss -tlnp \| grep -E ':(3000\|3001\|4000)'` (kill any orphan PID — as master user if needed), then `pm2 start ecosystem.config.cjs && pm2 save --force` |
| Stripe payments stuck in PENDING_PAYMENT | webhook endpoint not registered, or `STRIPE_WEBHOOK_SECRET` wrong (2a) |
| Prisma "engine not found" after WinSCP upload | Windows `node_modules` was uploaded — delete it on the server and re-run `pnpm install --frozen-lockfile` |
| `pnpm install` fails with `EPERM ... chmod` | pnpm's store is in the shared `/home/master` and contains files owned by another user. Fix (from `public_html`): `rm -rf node_modules && pnpm config set store-dir "$PWD/.pnpm-store" && pnpm install --frozen-lockfile` — the app user can usually only write inside `public_html`. Still failing? `pnpm config set package-import-method copy` and reinstall |
| WinSCP Synchronize wants to re-upload everything | PC/server clock drift — switch sync criteria to file size |

---

## Notes

- **Database:** MySQL is native to Cloudways — no external DB, no sudo. Get the
  connection details from the panel (Access Details).
- **Two env files hold `DATABASE_URL`** and must match: `apps/backend/.env`
  (runtime) and `packages/db/.env` (Prisma CLI + seed).
- **`prisma db push`** builds/updates tables straight from `schema.prisma` — no
  migration files needed for a fresh database.
- **Admin** lives entirely under `/admin` (Next `basePath` in
  `apps/admin/next.config.mjs`) — log in at `https://<domain>/admin`.
- **Secrets never go in git or WinSCP syncs** — all four env files are
  server-only; `ecosystem.config.cjs` deliberately contains no secrets.
