# syntax=docker/dockerfile:1.7
# Multi-stage build for the MyFactoryDesk API (NestJS + Prisma + Puppeteer).
# Stage 1: install workspace deps. Stage 2: build the api. Stage 3: slim runtime.

ARG NODE_VERSION=20.18.0
ARG PNPM_VERSION=9.12.0

# ---------- deps ----------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS deps
ARG PNPM_VERSION
ENV PNPM_HOME="/pnpm" PATH="/pnpm:${PATH}"
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Fetch every workspace's deps once. Skip Puppeteer's Chromium download here —
# the runtime stage installs it against the system Chromium libs.
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---------- build ---------------------------------------------------------------
FROM deps AS build
WORKDIR /repo
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @myfactorydesk/shared build || true \
 && pnpm --filter @myfactorydesk/api prisma:generate \
 && pnpm --filter @myfactorydesk/api build

# ---------- runtime -------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ARG PNPM_VERSION
ENV NODE_ENV=production \
    PNPM_HOME="/pnpm" \
    PATH="/pnpm:${PATH}" \
    PORT=3000

# Chromium / Puppeteer system dependencies for Debian Bookworm.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      fonts-liberation \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libcairo2 \
      libcups2 \
      libdrm2 \
      libgbm1 \
      libnss3 \
      libpango-1.0-0 \
      libxcomposite1 \
      libxdamage1 \
      libxfixes3 \
      libxkbcommon0 \
      libxrandr2 \
      tini \
      wget \
 && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

# Copy production artefacts from the build stage. Only what the api needs.
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /repo/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build /repo/packages/shared ./packages/shared

# Production install — restores the right node_modules layout for the workspace
# and downloads Puppeteer's bundled Chromium against the libs above.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter @myfactorydesk/api...

# Run as an unprivileged user.
RUN useradd --system --uid 1001 --create-home --home-dir /home/app app \
 && chown -R app:app /app /home/app
USER app

EXPOSE 3000

# tini handles PID 1 + zombie reaping (puppeteer spawns chromium subprocesses).
ENTRYPOINT ["/usr/bin/tini", "--"]
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
