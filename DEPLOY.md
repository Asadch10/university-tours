# Deployment — Cloudways (website + admin + backend + MySQL)

Live domain: `https://phpstack-1510285-6494046.cloudwaysapps.com`

All three apps run as Node processes; an **Nginx reverse proxy** serves them under
one domain. The database is **MySQL** (native to Cloudways — no external DB).

```
https://<domain>/          →  website   (127.0.0.1:3000)
https://<domain>/admin     →  admin     (127.0.0.1:3001, next basePath=/admin)
https://<domain>/api/...   →  backend   (127.0.0.1:4000, Express /api/v1)
https://<domain>/uploads/  →  backend   (uploaded images)
```

---

## Commands in sequence

### 1. Get the MySQL credentials (Cloudways panel — no command)
Cloudways → your app → **Access Details** → note **DB Name, DB User, DB Password**
(host `localhost`, port `3306`).

### 2. SSH in
```bash
ssh master_user@server_ip
```

### 3. Install pnpm + PM2
```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
npm install -g pm2
```

### 4. Get the code
```bash
cd ~/applications/YOUR_APP/public_html
git clone https://github.com/Asadch10/university-tours.git .
# already cloned?  run instead:  git pull
```

### 5. Backend env — `apps/backend/.env`
(fill DB_USER / DB_PASS / DB_NAME from step 1; URL-encode special chars in the password)
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
EOF
```

### 6. Website env — `apps/website/.env.production`
```bash
cat > apps/website/.env.production <<'EOF'
NEXT_PUBLIC_API_URL=https://phpstack-1510285-6494046.cloudwaysapps.com
NEXT_PUBLIC_API_BASE_URL=https://phpstack-1510285-6494046.cloudwaysapps.com
EOF
```

### 7. Admin env — `apps/admin/.env.production`
```bash
cat > apps/admin/.env.production <<'EOF'
NEXT_PUBLIC_API_URL=https://phpstack-1510285-6494046.cloudwaysapps.com
EOF
```

### 8. Install dependencies
```bash
pnpm install --frozen-lockfile
```

### 9. Prisma: generate client + create the MySQL tables
```bash
pnpm --filter @ucpt/db generate
pnpm --filter @ucpt/db exec prisma db push
```

### 10. (optional) Seed starter data
```bash
pnpm --filter @ucpt/db seed
```

### 11. Build all three apps
```bash
pnpm --filter @ucpt/backend build
pnpm --filter @ucpt/website build
pnpm --filter @ucpt/admin build
```

### 12. Start with PM2
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup          # run the command it prints (skip if it needs sudo — see Notes)
pm2 status
```

### 13. Verify the processes locally
```bash
curl -s localhost:4000/health
curl -sI localhost:3000 | head -1
curl -sI localhost:3001/admin | head -1
```

### 14. Add the reverse-proxy rules
Paste `deploy/nginx-cloudways.conf` into the app's Nginx vhost. Your Cloudways
user has **no sudo**, so open a Cloudways **support ticket** with that file and
ask them to add the reverse-proxy `location` blocks (`/api`, `/uploads`,
`/admin` before the catch-all `/`); they reload Nginx for you.

### 15. Verify the live domain
```bash
curl -sI https://phpstack-1510285-6494046.cloudwaysapps.com/
curl -sI https://phpstack-1510285-6494046.cloudwaysapps.com/admin
curl -s  https://phpstack-1510285-6494046.cloudwaysapps.com/api/v1/search/community-guides
```

---

## Redeploy after a code change
```bash
cd ~/applications/YOUR_APP/public_html
git pull
pnpm install --frozen-lockfile
pnpm --filter @ucpt/db exec prisma db push   # only if the schema changed
pnpm --filter @ucpt/backend build
pnpm --filter @ucpt/website build
pnpm --filter @ucpt/admin build
pm2 restart ecosystem.config.cjs
```

---

## Notes
- **Database:** MySQL is native to Cloudways — no external DB, no sudo. Get the
  connection details from the panel (Access Details).
- **`prisma db push`** builds/updates tables straight from `schema.prisma` — no
  migration files needed for a fresh database.
- **`pm2 startup`** needs sudo (blocked on Cloudways). Instead, add a Cloudways
  **cron** with `@reboot pm2 resurrect` so the apps come back after a reboot.
- **Uploads** are stored on local disk (`apps/backend/uploads/`, served at
  `/uploads`). They survive restarts; move to S3/Cloudinary for durable storage
  later (only `lib/uploads.ts` + the static mount change).
- **Admin** lives entirely under `/admin` (Next `basePath`) — log in at
  `https://<domain>/admin`.
- The proxy rules live in **`deploy/nginx-cloudways.conf`**; the PM2 process
  definitions live in **`ecosystem.config.cjs`**.
