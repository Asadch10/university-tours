// Side-effect module: load .env BEFORE any other import (especially @ucpt/db,
// which instantiates the Prisma client from DATABASE_URL at import time).
// Must be the very first import in the process entry point.
try {
  (process as NodeJS.Process & { loadEnvFile?: () => void }).loadEnvFile?.();
} catch {
  // .env is optional — real env vars are injected by the platform in production.
}
