# Deploying to the Hostinger VPS

Target: `srv1746742.hstgr.cloud` (2.25.194.37), KVM 2 — Ubuntu, Docker, shared Traefik.

The box already runs **Postiz** (8 containers) and **vanuat** (4 containers) behind that
Traefik. This stack is deliberately isolated: its own MySQL, its own volumes, its own
containers. It publishes **no host ports** — Traefik discovers it via Docker labels — so
nothing about the existing apps is touched.

---

## 0. Read this first: memory

Measured on the box: 7.8 GB total, **2.8 GB available** with Postiz and the two vanuat
stacks running. Runtime is fine — the four new containers need roughly 1.2–1.5 GB. The
risk is the **build**: `next build` can peak above 2 GB, and there are two of them.

There is already 2 GB of swap. Top it up to 4 GB before building (note the distinct
filename — do not overwrite a live swap file):

```bash
[ -f /swapfile2 ] || { fallocate -l 2G /swapfile2 && chmod 600 /swapfile2 \
  && mkswap /swapfile2 && swapon /swapfile2 \
  && echo '/swapfile2 none swap sw 0 0' >> /etc/fstab; }
free -h
```

Build the images **one at a time** (step 5). Do not run a parallel build.

## 1. Get the code on the server

```bash
ssh root@2.25.194.37
mkdir -p /opt && cd /opt
git clone https://github.com/Asadch10/university-tours.git ucpt && cd ucpt
```

## 2. Traefik — nothing to configure

Verified on this VPS: Traefik runs in **host network mode**, so there is no shared proxy
network to join — it reaches containers directly on their own bridge network. The
entrypoint (`websecure`) and cert resolver (`letsencrypt`) are already hardcoded in
`docker-compose.yml`, matching the working `vanuat` stack:

```
traefik.http.routers.vanuat.entrypoints    = websecure
traefik.http.routers.vanuat.tls.certresolver = letsencrypt
```

## 3. DNS

Point A records at **2.25.194.37** and wait for propagation *before* step 5 — Traefik
requests certificates on first request, and it can only validate a domain that already
resolves to this box.

| Record | Value |
|---|---|
| `yourdomain.com` | 2.25.194.37 |
| `www` | 2.25.194.37 |
| `admin` | 2.25.194.37 |
| `api` | 2.25.194.37 |

Check with `dig +short api.yourdomain.com`.

## 4. Configuration

```bash
cp .env.deploy.example  .env.deploy
cp .env.backend.example .env.backend
nano .env.deploy    # Traefik network, cert resolver, domains, DB passwords
nano .env.backend   # DATABASE_URL password, Stripe, mail, fresh JWT secrets
chmod 600 .env.deploy .env.backend
```

Generate fresh secrets rather than copying the Cloudways ones:

```bash
for k in JWT_ACCESS_SECRET JWT_REFRESH_SECRET EMAIL_VERIFY_SECRET PASSWORD_RESET_SECRET; do
  echo "$k=$(openssl rand -hex 32)"
done
```

Rotating the JWT secrets logs everyone out once, which is the correct behaviour for a
host migration.

## 5. Build and start

```bash
cd /opt/ucpt
docker compose --env-file .env.deploy build backend    # sequential — see step 0
docker compose --env-file .env.deploy build website
docker compose --env-file .env.deploy build admin
docker compose --env-file .env.deploy up -d
docker compose --env-file .env.deploy ps
```

## 6. Database schema and seed

There are **no Prisma migration files** in this project — the schema is applied with
`db push`. Both commands run inside the backend container:

```bash
docker compose --env-file .env.deploy exec -w /app backend \
  node_modules/.bin/prisma db push --schema packages/db/prisma/schema.prisma
```

Then either **import the Cloudways data** (step 7) or seed a fresh database:

```bash
docker compose --env-file .env.deploy exec -w /app backend \
  node_modules/.bin/tsx packages/db/prisma/seed.ts
```

(The seed is TypeScript run through `tsx` — there is no compiled `dist`. `DATABASE_URL`
already comes from `.env.backend`, so no `--env-file` is needed here.)

> The seed creates the **counselor questionnaire**. Skip it on a fresh DB and
> `/become-a-counselor` renders an empty form.

## 7. Migrate data from Cloudways

Two things move: the database and the uploads directory. **`uploads/` is not in git** —
miss it and every guide photo 404s.

On Cloudways:
```bash
mysqldump -u DBUSER -p --single-transaction --no-tablespaces DBNAME > ~/ucpt.sql
tar czf ~/uploads.tar.gz -C ~/public_html/apps/backend uploads
```

From your Mac:
```bash
scp cloudways@CLOUDWAYS_IP:~/ucpt.sql ~/ucpt.sql
scp cloudways@CLOUDWAYS_IP:~/uploads.tar.gz ~/uploads.tar.gz
scp ~/ucpt.sql ~/uploads.tar.gz root@2.25.194.37:/opt/ucpt/
```

On the VPS:
```bash
cd /opt/ucpt
# Database
docker compose --env-file .env.deploy exec -T db \
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" university_tours < ucpt.sql
# Uploads into the named volume
tar xzf uploads.tar.gz
docker compose --env-file .env.deploy cp uploads/. backend:/app/apps/backend/uploads/
docker compose --env-file .env.deploy exec backend ls /app/apps/backend/uploads | wc -l
# Shrink them (safe to re-run; keeps filenames so stored URLs still resolve)
docker compose --env-file .env.deploy exec -w /app/apps/backend backend \
  node scripts/optimize-existing-uploads.mjs --apply
rm -f ucpt.sql uploads.tar.gz && rm -rf uploads
```

Then re-run `db push` (step 6) so the imported schema picks up any newer columns.

## 8. Verify before cutting over

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://api.yourdomain.com/api/v1/schools
curl -s https://api.yourdomain.com/api/v1/search/counselors | head -c 200
docker compose --env-file .env.deploy logs --tail=40 backend
```

Then by hand: admin login, a guide photo loading, and one test booking.

## 9. Post-cutover

- **Stripe webhook** — create a new endpoint for `https://api.yourdomain.com`, put its
  signing secret in `.env.backend`, restart `backend`. The old secret will not verify,
  and payments fail silently if this is missed.
- **Mobile app** — still points at the Cloudways URL. Update `EXPO_PUBLIC_API_BASE_URL`
  in `apps/mobile/eas.json` and `extra.apiBaseUrl` in `app.json`, then rebuild the APK.
- Keep Cloudways running until DNS has fully propagated and the checks above pass.

## Updating later

```bash
cd /opt/ucpt && git pull
docker compose --env-file .env.deploy build backend && \
docker compose --env-file .env.deploy build website && \
docker compose --env-file .env.deploy build admin
docker compose --env-file .env.deploy up -d
```

`NEXT_PUBLIC_*` values are inlined at build time, so changing a domain means a rebuild,
not just a restart.
