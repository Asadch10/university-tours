// Side-effect module: load .env BEFORE any other import (especially @ucpt/db,
// which instantiates the Prisma client from DATABASE_URL at import time).
// Must be the very first import in the process entry point.
//
// NOTE: we intentionally do NOT use `process.loadEnvFile()` — it silently skips any
// variable that already exists in the environment, so a stale `export DATABASE_URL=…`
// left in a developer's shell would shadow the project's .env and cause confusing
// auth failures. Instead we parse the .env ourselves and OVERRIDE. In production there
// is no .env file, so platform-injected env vars are used untouched.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');

if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    if (!key) continue;

    let value = line.slice(eq + 1).trim();
    // Strip surrounding single or double quotes (values with '#' inside quotes are safe).
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Override any pre-existing (possibly stale) shell value in development.
    process.env[key] = value;
  }
}
