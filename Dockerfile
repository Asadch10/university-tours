# Multi-target build for the whole monorepo. One file, three images:
#
#   docker build --target backend -t ucpt-backend .
#   docker build --target website -t ucpt-website .
#   docker build --target admin   -t ucpt-admin   .
#
# Node 22, not 20: expo-server-sdk and other deps have moved to syntax Node 20.5
# cannot parse, which previously crash-looped the API on boot.
#
# `deps` is shared by all three targets, so the (slow) pnpm install happens once
# per build context rather than three times.

# ─── Shared dependency layer ─────────────────────────────────────────────────
FROM node:22-slim AS deps
# openssl: required by Prisma's query engine. python3/make/g++: sharp falls back to
# building from source if no prebuilt binary matches.
RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl ca-certificates python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Copy only manifests first so a source-only change doesn't reinstall everything.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
# EVERY workspace member's manifest must be present, not just the ones being built:
# pnpm-workspace.yaml globs apps/* and packages/*, and --frozen-lockfile fails if the
# lockfile references an importer whose package.json is missing. (apps/mobile and
# apps/worker are installed but never built here — that's the price of a valid lockfile
# check, and it's only a one-off install cost.)
COPY apps/admin/package.json        apps/admin/
COPY apps/backend/package.json      apps/backend/
COPY apps/mobile/package.json       apps/mobile/
COPY apps/website/package.json      apps/website/
COPY apps/worker/package.json       apps/worker/
COPY packages/db/package.json       packages/db/
COPY packages/sdk/package.json      packages/sdk/
COPY packages/types/package.json    packages/types/
COPY packages/validation/package.json packages/validation/
RUN pnpm install --frozen-lockfile

COPY . .
# The Prisma client is generated code — it must exist before anything typechecks.
RUN pnpm --filter @ucpt/db exec prisma generate

# ─── Backend ─────────────────────────────────────────────────────────────────
# Deliberately NOT compiled to dist and run with plain node. The workspace packages
# (@ucpt/db, @ucpt/types, @ucpt/validation) export raw TypeScript — their package.json
# main is ./src/index.ts — so node dies with ERR_UNKNOWN_FILE_EXTENSION on the first
# `import '@ucpt/db'`, even if apps/backend itself is compiled. The repo's existing pm2
# config hit exactly this and documents the same conclusion: run the source via tsx.
FROM node:22-slim AS backend
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app
# node_modules is copied wholesale: pnpm's symlinked store means a partial copy breaks.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/backend ./apps/backend
WORKDIR /app/apps/backend
# Uploads are a mounted volume; create the dir so the app can boot before it's mounted.
RUN mkdir -p uploads
EXPOSE 4000
# tsx is a devDependency of apps/backend, so pnpm puts its bin in
# apps/backend/node_modules/.bin — NOT hoisted to the workspace root. WORKDIR is
# already /app/apps/backend, so this relative path is the correct one.
CMD ["node_modules/.bin/tsx", "src/index.ts"]

# ─── Website ─────────────────────────────────────────────────────────────────
# NEXT_PUBLIC_* is inlined into the client bundle at BUILD time, so these must be
# build args — setting them only at runtime has no effect.
FROM deps AS website-build
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production
RUN pnpm --filter @ucpt/website build

FROM node:22-slim AS website
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=website-build /app/node_modules ./node_modules
COPY --from=website-build /app/packages ./packages
COPY --from=website-build /app/apps/website ./apps/website
WORKDIR /app/apps/website
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]

# ─── Admin ───────────────────────────────────────────────────────────────────
FROM deps AS admin-build
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production
RUN pnpm --filter @ucpt/admin build

FROM node:22-slim AS admin
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=admin-build /app/node_modules ./node_modules
COPY --from=admin-build /app/packages ./packages
COPY --from=admin-build /app/apps/admin ./apps/admin
WORKDIR /app/apps/admin
EXPOSE 3001
CMD ["node_modules/.bin/next", "start", "-p", "3001"]
