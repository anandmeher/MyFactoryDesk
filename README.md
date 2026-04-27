# MyFactoryDesk Manufacturing & Sales

Multi-location, mobile-first business management app for a paper plates manufacturing and sales business.

## Status

🟡 **In development — V1 (Staff & Payroll) in progress.**

See [`CLAUDE.md`](./CLAUDE.md) for the full project plan and conventions.

## Tech Stack

- **Backend:** NestJS + Prisma + PostgreSQL + Redis (BullMQ)
- **Frontend:** Vite + React + TypeScript + Tailwind + shadcn/ui (PWA)
- **Shared:** Zod schemas in `packages/shared`
- **Auth:** JWT (access + refresh)
- **Money:** Prisma `Decimal` + `decimal.js` (never floats)
- **Dates:** `date-fns` + `date-fns-tz` (IST = `Asia/Kolkata`)

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- Docker + Docker Compose
- Git

## Getting Started

```bash
# 1. Clone and install
git clone <your-repo-url> myfactorydesk
cd myfactorydesk
pnpm install

# 2. Start Postgres + Redis
docker compose up -d

# 3. Set up environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Edit the .env files — generate JWT secrets with: openssl rand -hex 32

# 4. Run database migrations
pnpm --filter api prisma migrate dev

# 5. Seed (optional, creates owner user + sample employees)
pnpm --filter api prisma db seed

# 6. Start everything in dev mode
pnpm dev
```

API runs at `http://localhost:3000` — Swagger docs at `http://localhost:3000/api/docs`
Web runs at `http://localhost:5173`

## Common Commands

```bash
pnpm dev                              # run api + web in parallel
pnpm --filter api dev                 # api only
pnpm --filter web dev                 # web only

pnpm --filter api prisma migrate dev  # create new migration
pnpm --filter api prisma studio       # open DB GUI
pnpm --filter api prisma generate     # regen Prisma client after schema change

pnpm --filter api test                # run all api tests
pnpm --filter api test payroll        # run payroll tests only

pnpm lint                             # eslint everything
pnpm typecheck                        # tsc --noEmit on all packages
```

## Project Structure

```
myfactorydesk/
├── apps/
│   ├── api/                  # NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── employees/
│   │   │   ├── attendance/
│   │   │   ├── advances/
│   │   │   ├── payroll/
│   │   │   ├── common/      # guards, filters, decorators
│   │   │   └── main.ts
│   │   └── test/
│   └── web/                  # Vite + React PWA
│       ├── src/
│       │   ├── routes/
│       │   ├── features/    # employees, attendance, payroll
│       │   ├── components/  # shadcn/ui + custom
│       │   ├── hooks/
│       │   ├── lib/         # api client, utils
│       │   └── main.tsx
│       └── public/
│           └── manifest.json
├── packages/
│   └── shared/               # Zod schemas, TS types
├── docs/
│   ├── SCHEMA.md            # full Prisma schema reference
│   ├── API.md               # API endpoint reference
│   └── PAYROLL.md           # payroll calculation rules
├── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json
├── CLAUDE.md                # project context for Claude Code
└── README.md
```

## Development Workflow

1. **Pick a task** from `CLAUDE.md` §Build Order or the issue tracker.
2. **Create a branch:** `git checkout -b feat/attendance-bulk-mark`
3. **Write the Zod schema** in `packages/shared` first.
4. **Backend:** Prisma migration → service → controller → tests.
5. **Frontend:** TanStack Query hook → component → route.
6. **Test on mobile viewport** (Chrome DevTools → 360×800).
7. **Verify on Swagger** that request/response shapes match the Zod schemas.
8. **Open a PR** referencing the section of `CLAUDE.md` it implements.

## Deployment

The repo ships with deploy configs for **Render** (API + Postgres + Redis) and **Vercel** (web). Pick a staging URL on each before you start — they go in env vars.

### Backend → Render

1. Push the repo to GitHub.
2. In Render dashboard → **Blueprints → New** → point at this repo. Render reads [`render.yaml`](./render.yaml) and provisions:
   - `myfactorydesk-api` — Docker web service built from [`apps/api/Dockerfile`](./apps/api/Dockerfile) (NestJS + Puppeteer + Chromium libs).
   - `myfactorydesk-db` — managed Postgres 16.
   - `myfactorydesk-redis` — managed Redis (BullMQ).
3. After the first build, fill the secrets marked `sync: false` in `render.yaml`:
   ```
   JWT_ACCESS_SECRET   # openssl rand -hex 32
   JWT_REFRESH_SECRET  # openssl rand -hex 32
   ENCRYPTION_KEY      # openssl rand -hex 32  (must be 64 hex chars)
   CORS_ORIGIN         # https://<your-vercel-url>  (comma-separated if multiple)
   COMPANY_NAME        # appears on payslip PDF header
   COMPANY_ADDRESS     # pipe-separated lines, e.g. "Plot 7, MIDC|Pune, MH 411019"
   ```
4. Trigger a redeploy. The `preDeployCommand` runs `prisma migrate deploy` automatically.
5. Health check: `GET https://<your-render-url>/api/v1/health`.

### Frontend → Vercel

1. Vercel dashboard → **Add New Project** → import the repo.
2. **Root directory:** `apps/web`. Vercel reads [`apps/web/vercel.json`](./apps/web/vercel.json) for the build command and SPA rewrites.
3. Set env var `VITE_API_URL=https://<your-render-url>/api/v1`.
4. Deploy. Open the URL on a phone — install as PWA from the browser menu.

### Local Docker build (sanity check)

```bash
# Build the api image from the repo root
docker build -f apps/api/Dockerfile -t myfactorydesk-api .

# Run it against the local Compose Postgres/Redis (host networking)
docker run --rm --network host \
  -e DATABASE_URL=postgresql://app:app@localhost:5433/myfactorydesk \
  -e REDIS_URL=redis://localhost:6380 \
  -e JWT_ACCESS_SECRET=$(openssl rand -hex 32) \
  -e JWT_REFRESH_SECRET=$(openssl rand -hex 32) \
  -e ENCRYPTION_KEY=$(openssl rand -hex 32) \
  -e CORS_ORIGIN=http://localhost:5173 \
  myfactorydesk-api
```

CI/CD: GitHub Actions runs lint + typecheck + tests on every PR (TODO — workflow not yet committed). Render and Vercel both auto-deploy on push to `main`.

## Things to Read Before Coding

1. [`CLAUDE.md`](./CLAUDE.md) — full architecture and rules
2. [`docs/PAYROLL.md`](./docs/PAYROLL.md) — payroll math rules (the hardest part)
3. [`docs/API.md`](./docs/API.md) — API conventions

## License

Private / proprietary.
