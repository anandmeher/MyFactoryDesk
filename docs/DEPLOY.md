# Staging deploy — laptop self-host runbook

The MyFactoryDesk staging API runs on the user's laptop and is exposed publicly via a Cloudflare Tunnel. The web app lives on Vercel (config in `apps/web/vercel.json`).

This document is the operator's checklist. The code-side wiring (`Dockerfile`, `docker-compose.prod.yml`, GitHub Actions workflows) is already in the repo — the steps below are the human / cloud-account actions needed to bring it online.

The repo also ships `render.yaml` for managed-cloud hosting on Render. That's a separate, alternative target — pick one. The laptop path documented here is cheaper and keeps everything under your control; Render is the migration path when uptime matters more than cost.

## Architecture (laptop path)

```
   Internet
      │
      ▼
  Cloudflare (DNS + TLS + Tunnel)
      │  cloudflared (outbound tunnel, runs on the host)
      ▼
  Laptop ── docker compose -f docker-compose.prod.yml ──┬── api      (NestJS, container 3000 → host 127.0.0.1:3030)
                                                        ├── migrate  (one-shot: prisma migrate deploy)
                                                        └── postgres (127.0.0.1:5433)

  GitHub push to main → CI passes → "Deploy staging (laptop)" workflow runs
  on the self-hosted runner; rebuilds + restarts containers.
```

Redis / BullMQ is deferred until the payroll job runners land — the API boots fine without `REDIS_URL`.

## One-time setup

### 1. Domain + Cloudflare

1. Buy a domain. Cloudflare itself sells domains at cost — lowest friction since you'll be on Cloudflare DNS anyway.
2. Add the domain to a free Cloudflare account. Update the registrar's nameservers to the two Cloudflare provides.
3. Wait for the zone to go active (usually minutes; up to 24h).

### 2. Cloudflare Tunnel

On the laptop:

```bash
# macOS
brew install cloudflared
# Linux: see https://pkg.cloudflare.com/

cloudflared tunnel login                                # browser → authorize zone
cloudflared tunnel create myfactorydesk-staging
```

Note the tunnel UUID it prints. Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <UUID>
credentials-file: /home/<you>/.cloudflared/<UUID>.json

ingress:
  - hostname: api.<your-domain>
    service: http://127.0.0.1:3030
  - service: http_status:404
```

Bind the hostname:

```bash
cloudflared tunnel route dns myfactorydesk-staging api.<your-domain>
```

Install as a service so it survives reboots:

```bash
# Linux
sudo cloudflared service install
sudo systemctl enable --now cloudflared

# macOS
sudo cloudflared service install
sudo launchctl load /Library/LaunchDaemons/com.cloudflare.cloudflared.plist
```

Verify: `curl https://api.<your-domain>/api/v1/health` should reach Cloudflare's edge (404 until the API is up, 200 after).

### 3. Postgres + API on the laptop

```bash
cd ~/code/MyFactoryDesk

cp apps/api/.env.production.example apps/api/.env.production
$EDITOR apps/api/.env.production
```

Fill in:
- `POSTGRES_PASSWORD` — a strong password. The same value must appear inside `DATABASE_URL` (the compose network resolves `postgres` to the service).
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY` — each generated with `openssl rand -hex 32`.
- `CORS_ORIGIN` — the Vercel preview URL (after step 5), comma-separated with any custom web domain.
- `COMPANY_NAME`, `COMPANY_ADDRESS` — printed on payslip PDFs.

Bring it up:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f api    # wait for "API listening on …"
curl http://127.0.0.1:3030/api/v1/health                 # → {"data":{"status":"ok",...}}
curl https://api.<your-domain>/api/v1/health             # → same, via Cloudflare
```

Seed the database (one time, after the migrate service has run successfully):

```bash
docker compose -f docker-compose.prod.yml exec api pnpm db:seed
```

### 4. Self-hosted GitHub Actions runner

On GitHub: repo → Settings → Actions → Runners → **New self-hosted runner** (Linux x64 or macOS to match the laptop). Follow the on-screen download + `./config.sh` commands.

When `./config.sh` prompts for runner labels, add **`myfactorydesk-laptop`** — this matches the `runs-on` in `.github/workflows/deploy-staging.yml`.

Install as a service so it auto-starts:

```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

Lock it down: repo → Settings → Actions → General → set "Fork pull request workflows from outside collaborators" to **"Require approval for all outside collaborators"**. Self-hosted runners must never auto-run untrusted forks.

### 5. Vercel placeholder

The repo already ships `apps/web/vercel.json` with the correct build command and SPA rewrites. Steps:

1. Vercel → New Project → import the GitHub repo.
2. Root Directory: **`apps/web`**.
3. Framework Preset: **Vite** (auto-detected).
4. Override the Install Command to `echo 'install handled in buildCommand'` (matches `vercel.json`).
5. Build Command: leave the default — `vercel.json` overrides it with the monorepo install + filter build.
6. Environment Variable: `VITE_API_URL = https://api.<your-domain>/api/v1`.
7. Deploy. Note the preview URL (`https://myfactorydesk-web-<hash>.vercel.app`).
8. Add the Vercel URL to `CORS_ORIGIN` in `apps/api/.env.production`, then `docker compose -f docker-compose.prod.yml up -d api` to restart with the new origin.

## Routine deploy

Once everything above is wired:

1. Push to `main` (typically via merged PR).
2. `.github/workflows/ci.yml` runs on GitHub-hosted runners (Prisma validate + typecheck + build + tests).
3. On success, `.github/workflows/deploy-staging.yml` triggers on the self-hosted runner.
4. The runner: `git checkout main` → `docker compose -f docker-compose.prod.yml up -d --build` → polls `/api/v1/health` until 200.
5. New container is live behind the tunnel.

The `migrate` compose service runs first; if migrations fail, the `api` service never starts and the workflow fails — DB is never in a half-migrated state with a stale app on top of it.

Rollback: SSH the laptop, `git checkout <good-sha>`, `docker compose -f docker-compose.prod.yml up -d --build`. A formal rollback workflow is deferred.

## Operational notes

- **Laptop must be awake** for staging to respond. Disable sleep on AC, or use `caffeinate -di` (macOS) / `systemd-inhibit` (Linux) when leaving it.
- **Tail logs**: `docker compose -f docker-compose.prod.yml logs -f api`.
- **DB shell**: `docker compose -f docker-compose.prod.yml exec postgres psql -U app -d myfactorydesk`.
- **Backups (TODO)**: nothing automated yet. Before any risky migration: `docker compose -f docker-compose.prod.yml exec postgres pg_dump -U app myfactorydesk > backup-$(date +%F).sql`. A nightly cron is a v1.1 task.
- **Secret rotation**: changing a JWT secret invalidates all live access + refresh tokens on api restart. Plan accordingly.
- **Re-running migrations**: `docker compose -f docker-compose.prod.yml run --rm migrate`. The service is idempotent — it only applies pending migrations.
- **Image cleanup**: the deploy workflow prunes dangling images. To wipe everything: `docker compose -f docker-compose.prod.yml down -v --rmi local` (the `-v` deletes the postgres volume — only do this if you have a backup).

## Switching to Render later

`render.yaml` (managed Postgres + Redis + Docker web service) is the migration path when the laptop is no longer good enough. Nothing in the app code changes:

1. Connect the repo to Render → Blueprints → New.
2. Fill in the `sync: false` env vars (JWT secrets, encryption key, CORS, company identity).
3. Point `api.<your-domain>` DNS at the Render service.
4. Disable the laptop tunnel + self-hosted runner.

That tradeoff (laptop free, must be awake; Render paid, always on) is worth picking deliberately, not by accident.
