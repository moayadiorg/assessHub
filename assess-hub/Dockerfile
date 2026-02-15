# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy DATABASE_URL so Next.js build can parse the URL at module load time.
# The real value is provided at runtime via docker-compose environment.
ENV DATABASE_URL=mysql://user:pass@localhost:3306/db
RUN npm run build

# ---- Production ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# mysql2 for db-init (not traced by Next.js standalone — install with all transitive deps)
RUN npm install --no-save mysql2

# Migration SQL + Node.js init script
COPY --from=builder /app/db/schema.sql ./migration.sql
COPY --from=builder /app/db/seed.sql ./seed.sql
COPY --from=builder /app/db-init.mjs ./db-init.mjs

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && \
    chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
