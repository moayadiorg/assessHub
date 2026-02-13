# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
# Alpine uses musl libc; provides glibc compat required by pre-built binaries (e.g. Prisma engine)
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ---- Builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN DATABASE_URL="file:/tmp/placeholder.db" npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Prisma CLI (for runtime migrations) ----
FROM base AS prisma-cli
RUN apk add --no-cache libc6-compat
COPY --from=builder /app/package.json ./
RUN npm install --no-save prisma @prisma/client dotenv

# ---- Production ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone output (includes minimal node_modules for the app)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma schema + config
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Merge in full Prisma CLI dependency tree (for migrations at startup)
# Docker COPY merges directories, so this adds to standalone's node_modules
COPY --from=prisma-cli /app/node_modules ./node_modules
# Overlay generated Prisma client runtime (from builder where prisma generate ran)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && \
    mkdir -p /app/data && chown -R nextjs:nodejs /app /app/data

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
