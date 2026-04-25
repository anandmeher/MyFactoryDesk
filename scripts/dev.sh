#!/usr/bin/env bash
# Bring up the local dev stack and start every workspace's `dev` script.
# Idempotent: safe to re-run. Leaves docker containers up between sessions.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# --- Colours ---------------------------------------------------------------
if [[ -t 1 ]]; then
  C_RESET=$'\033[0m' C_BOLD=$'\033[1m' C_DIM=$'\033[2m'
  C_GREEN=$'\033[32m' C_YELLOW=$'\033[33m' C_RED=$'\033[31m' C_CYAN=$'\033[36m'
else
  C_RESET= C_BOLD= C_DIM= C_GREEN= C_YELLOW= C_RED= C_CYAN=
fi
log()  { printf '%s[dev]%s %s\n'      "$C_CYAN"   "$C_RESET" "$*"; }
ok()   { printf '%s[dev]%s %s\n'      "$C_GREEN"  "$C_RESET" "$*"; }
warn() { printf '%s[dev]%s %s\n'      "$C_YELLOW" "$C_RESET" "$*"; }
die()  { printf '%s[dev]%s %s\n' >&2 "$C_RED"    "$C_RESET" "$*"; exit 1; }

# --- Preflight -------------------------------------------------------------
command -v docker >/dev/null 2>&1 || die "docker not found in PATH"
docker compose version >/dev/null 2>&1 || die "docker compose plugin not available"
command -v pnpm   >/dev/null 2>&1 || die "pnpm not found in PATH"
command -v openssl >/dev/null 2>&1 || die "openssl not found in PATH (needed to generate secrets)"

# --- 1. Docker stack -------------------------------------------------------
log "ensuring postgres + redis are up..."
docker compose up -d >/dev/null
ok "compose stack up"

# --- 2. Wait for Postgres --------------------------------------------------
log "waiting for postgres to accept connections..."
attempts=0
until docker exec paperplates-postgres pg_isready -U app -d paperplates >/dev/null 2>&1; do
  attempts=$((attempts + 1))
  if [[ $attempts -gt 30 ]]; then
    die "postgres did not become ready within 30 seconds"
  fi
  sleep 1
done
ok "postgres ready"

# --- 3. Ensure apps/api/.env exists ---------------------------------------
API_ENV="$ROOT/apps/api/.env"
API_ENV_EXAMPLE="$ROOT/apps/api/.env.example"

if [[ ! -f "$API_ENV" ]]; then
  if [[ ! -f "$API_ENV_EXAMPLE" ]]; then
    die "missing apps/api/.env.example — cannot bootstrap .env"
  fi
  log "creating apps/api/.env from .env.example with fresh secrets..."
  jwt_access=$(openssl rand -hex 32)
  jwt_refresh=$(openssl rand -hex 32)
  enc_key=$(openssl rand -hex 32)
  awk -v a="$jwt_access" -v r="$jwt_refresh" -v e="$enc_key" '
    /^JWT_ACCESS_SECRET=/  { print "JWT_ACCESS_SECRET=" a;  next }
    /^JWT_REFRESH_SECRET=/ { print "JWT_REFRESH_SECRET=" r; next }
    /^ENCRYPTION_KEY=/     { print "ENCRYPTION_KEY=" e;     next }
    { print }
  ' "$API_ENV_EXAMPLE" > "$API_ENV"
  chmod 600 "$API_ENV"
  ok "wrote apps/api/.env (mode 600). Edit to override if needed."
else
  printf '%s[dev]%s %sapps/api/.env exists, leaving it alone%s\n' \
    "$C_CYAN" "$C_RESET" "$C_DIM" "$C_RESET"
fi

# --- 4. Apply pending Prisma migrations -----------------------------------
log "applying any pending Prisma migrations..."
pnpm --filter @paper-plates/api exec prisma migrate deploy >/dev/null
ok "migrations up to date"

# --- 5. Start workspaces in watch mode ------------------------------------
log "starting workspaces in parallel (Ctrl+C to stop)..."
printf '%s     api      %s%s http://localhost:3000/api/v1   docs: /api/docs%s\n' \
  "$C_BOLD" "$C_RESET" "$C_DIM" "$C_RESET"
printf '%s     web      %s%s http://localhost:5173 (when scaffolded)%s\n' \
  "$C_BOLD" "$C_RESET" "$C_DIM" "$C_RESET"
echo

# Use --no-bail so a missing/failing workspace doesn't kill the others.
exec pnpm -r --parallel --stream --no-bail dev
