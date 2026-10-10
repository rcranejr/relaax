#!/usr/bin/env bash
# Starts ReLaax inside Replit: installs deps, prepares the databases,
# runs the API (port 4000) and the Expo web preview (port 8081).
set -euo pipefail
cd "$(dirname "$0")/.."

log() { printf '\n\033[1;36m[relaax]\033[0m %s\n' "$*"; }

# ---- 1. Tooling ----------------------------------------------------------
if ! command -v pnpm >/dev/null 2>&1; then
  log "Enabling pnpm"
  corepack enable >/dev/null 2>&1 || npm install -g pnpm@10 >/dev/null 2>&1
fi

# ---- 2. Dependencies -----------------------------------------------------
if [ ! -d node_modules ] || [ pnpm-lock.yaml -nt node_modules/.modules.yaml ]; then
  log "Installing dependencies (first run takes a couple of minutes)"
  pnpm install --frozen-lockfile --prod=false
fi

# ---- 3. Databases --------------------------------------------------------
# Replit's PostgreSQL tool sets DATABASE_URL. The health vault lives in a
# second database on the same server when we can create one; otherwise it
# shares the main database (separate tables and migration journal).
if [ -z "${DATABASE_URL:-}" ]; then
  echo
  echo "DATABASE_URL is not set. In Replit open Tools -> Database -> Create a database, then press Run again."
  exit 1
fi

if [ -z "${HEALTH_DATABASE_URL:-}" ]; then
  HEALTH_DATABASE_URL="$(node -e '
    const u = new URL(process.env.DATABASE_URL);
    u.pathname = "/relaax_health";
    console.log(u.toString());
  ')"
  if (cd packages/db && node -e '
    const postgres = require("postgres");
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });
    sql`CREATE DATABASE relaax_health`
      .then(() => { console.log("created relaax_health"); return sql.end(); })
      .catch(e => { if (e.code === "42P04") { return sql.end(); } console.error(e.message); process.exit(1); });
  ') 2>/dev/null; then
    export HEALTH_DATABASE_URL
    log "Health vault: separate database relaax_health"
  else
    export HEALTH_DATABASE_URL="$DATABASE_URL"
    log "Health vault: sharing the main database (could not create a second one)"
  fi
fi

log "Running migrations"
pnpm --filter @relaax/db migrate
log "Seeding drills and achievements"
pnpm --filter @relaax/db seed

# ---- 4. Run --------------------------------------------------------------
export PORT=4000
export NODE_ENV="${NODE_ENV:-development}"
if [ -n "${REPLIT_DEV_DOMAIN:-}" ]; then
  export EXPO_PUBLIC_API_URL="https://${REPLIT_DEV_DOMAIN}:3000"
else
  export EXPO_PUBLIC_API_URL="http://localhost:4000"
fi
log "API      -> $EXPO_PUBLIC_API_URL"
log "Web app  -> preview pane (port 8081)"

trap 'kill 0' EXIT
( cd apps/api && pnpm exec tsx src/server.ts ) &
( cd apps/mobile && pnpm exec expo start --web --port 8081 ) &
wait
