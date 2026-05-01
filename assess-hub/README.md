# Assess-Hub

A Next.js application for managing and conducting maturity assessments, with role-based access, scoring visualization, and PDF export.

## Prerequisites

- Node.js 20+
- Docker Desktop (for the local MySQL container)

## Local Development

The local stack runs MySQL 8.4 in a container (`docker-compose.dev.yml`) and the app via `next dev`.

1. **Install dependencies and seed the env file:**

   ```bash
   npm install
   cp .env.example .env
   ```

   `.env` is gitignored. The defaults in `.env.example` already point at the local MySQL container; no edits are required for a basic local run.

2. **Start the database, seed, and run the app — one command:**

   ```bash
   npm run dev:local
   ```

   This starts the MySQL container (waits for the healthcheck to go green), runs `db:init` (schema + base users/customers), runs `db:seed` (full sample data — assessment types, questions, sample assessments), and then `next dev` on port 3005. All seed steps are idempotent.

3. **Open the app:** [http://localhost:3005](http://localhost:3005)

   With `ENABLE_DEV_AUTH=true` set in `.env.example`, the sign-in page exposes a credentials provider — pick any seeded user (e.g. `admin@example.com`) and choose a role. Seeded users:

   | Email | Role |
   |---|---|
   | `admin@example.com` | admin |
   | `moayad.ismail@gmail.com` | admin |
   | `assessor@example.com` | sa |
   | `reader@example.com` | reader |

   Five sample customers (Acme Corp, TechStart Inc, GlobalBank, HealthFirst Solutions, RetailMax), four assessment types (Cloud Infrastructure Maturity, DevOps Practices, Data Platform Maturity, HashiCorp IaC Capability Maturity), and 11 sample assessments are also seeded.

### Stack lifecycle

| Command | What it does |
|---|---|
| `npm run dev:local` | Up + seed + `next dev` (one-shot for fresh clones). |
| `npm run db:up` | Start MySQL only (waits for healthy). |
| `npm run db:down` | Stop MySQL. Data persists in the named volume. |
| `npm run db:init` | Apply schema (if missing) and run the base SQL seed (users + customers). |
| `npm run db:seed` | Apply the full TypeScript seed (assessment types, questions, sample assessments). |
| `npm run db:reset` | **Destructive.** Wipe the volume, restart MySQL, re-run `db:init` + `db:seed`. |

> **Port conflict?** If `3306` is already in use locally, stop your other MySQL or change the published port in `docker-compose.dev.yml` (and `DATABASE_URL` in `.env`) to e.g. `3307`.

## Full local stack (containerized app + DB)

`docker-compose.dev.full.yml` brings up the dev MySQL **and** the production-style app build, wired together over a private Docker network. Use this to smoke-test the actual production image locally without deploying.

```bash
npm run dev:full        # builds the app image, starts DB + app, runs both seeds
npm run dev:full:down   # stops and removes both containers
```

- The app is at [http://localhost:3005](http://localhost:3005) (exposed only on `127.0.0.1`).
- Reuses the same volume as `dev:local`, so seeded data is shared between the two modes.
- No hot reload — every code change requires a rebuild. Use `dev:local` for iteration; use `dev:full` for verification.

## Production Deployment (Coolify)

The app is deployed via [Coolify](https://coolify.io/) using the `docker-compose.yml` in this repo. Coolify builds the Docker image and allows overriding environment variables in its UI.

### Required Environment Variables

Set these in the Coolify UI (see `.env.coolify.example` for reference):

| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | `https://assess-hub.imoayad.me` |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `DATABASE_URL` | `mysql://user:pass@host:port/db` |
| `GOOGLE_CLIENT_ID` | From [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |

Do **not** set `ENABLE_DEV_AUTH` in production — it defaults to `false`, which hides the development login form and only shows OAuth providers.

### Google OAuth Setup

In the Google Cloud Console, add these to your OAuth client's authorized redirect URIs:

```
https://assess-hub.imoayad.me/api/auth/callback/google
```

### Database Initialization

Database seeding is decoupled from the container. Before the first deployment (or after schema changes), run:

```bash
DATABASE_URL="mysql://..." node scripts/db-seed.mjs
```

Or locally with an `.env` file:

```bash
npm run db:init
```

### Build Optimizations

The Dockerfile uses BuildKit cache mounts for both npm packages and the Next.js build cache. Rebuilds where only source code changed (no dependency changes) are significantly faster due to:

- Cached `npm ci` (packages aren't re-downloaded from the registry)
- Cached `.next/cache` (enables incremental Next.js builds)
- Selective COPY (only `src/`, `public/`, `db/`, and config files — changing unrelated files doesn't invalidate layers)

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on port 3005 (assumes DB is already up) |
| `npm run dev:local` | Start MySQL container, run both seeds, then `next dev` (hot reload) |
| `npm run dev:full` | Start MySQL container + production-built app container (no hot reload) |
| `npm run dev:full:down` | Stop the full local stack |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:up` | Start the dev MySQL container (waits for healthy) |
| `npm run db:down` | Stop the dev MySQL container (volume persists) |
| `npm run db:reset` | Wipe the dev MySQL volume, restart, and re-run both seeds |
| `npm run db:init` | Apply schema (if missing) + base SQL seed against `DATABASE_URL` |
| `npm run db:seed` | Run the full TypeScript seed (types, questions, sample assessments) |

## Authentication & Roles

Users must be pre-authorized in the database before they can sign in (OAuth or dev credentials). There are three roles:

- **admin** — Full access: manage users, assessment types, and all assessments
- **sa** (solutions architect) — Create and manage own assessments
- **reader** — View-only access to assessments
