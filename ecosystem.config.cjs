// PM2 process manager — runs all three apps on one server.
//   backend  → 127.0.0.1:4000   (Express API + /uploads)
//   website  → 127.0.0.1:3000   (served at  /  )
//   admin    → 127.0.0.1:3001   (served at  /admin, via next basePath)
//
// The reverse proxy (see deploy/nginx-cloudways.conf) sends:
//   /api, /uploads → 4000 · /admin → 3001 · everything else → 3000
//
// Build first (see DEPLOY.md), then:  pm2 start ecosystem.config.cjs
// NOTE: NEXT_PUBLIC_* vars are baked at BUILD time — set them in each app's
// .env.production before building, not here.
const path = require('path');

module.exports = {
  apps: [
    {
      // Runs via tsx (package.json "start"), not plain node: the workspace
      // packages (@ucpt/db/types/validation) ship raw .ts source, so plain
      // node crashes with ERR_UNKNOWN_FILE_EXTENSION. Same pnpm-start pattern
      // as the two Next apps below (PM2 can't exec the .bin/tsx symlink).
      name: 'ucpt-backend',
      cwd: path.join(__dirname, 'apps/backend'),
      script: 'pnpm',
      args: 'start',
      interpreter: 'none',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'ucpt-website',
      cwd: path.join(__dirname, 'apps/website'),
      script: 'pnpm',
      args: 'start',
      interpreter: 'none',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'ucpt-admin',
      cwd: path.join(__dirname, 'apps/admin'),
      script: 'pnpm',
      args: 'start',
      interpreter: 'none',
      env: { NODE_ENV: 'production' },
    },
  ],
};
