# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---- Builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules

# Copy config files needed for the build
COPY package.json next.config.ts tsconfig.json postcss.config.mjs next-env.d.ts ./
COPY src ./src
COPY public ./public
COPY db ./db

ENV NEXT_TELEMETRY_DISABLED=1
# Dummy DATABASE_URL so Next.js build can parse the URL at module load time.
# The real value is provided at runtime via docker-compose environment.
ENV DATABASE_URL=mysql://user:pass@localhost:3306/db
RUN --mount=type=cache,target=/app/.next/cache npm run build

# ---- Production ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone output (includes traced mysql2 via serverExternalPackages)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
