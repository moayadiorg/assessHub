# Assess-Hub

A Next.js application for managing and conducting maturity assessments, with role-based access, scoring visualization, and PDF export.

## Prerequisites

- Node.js 20+
- A MySQL 8.x database
- (Optional) Docker for containerized deployment

## Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and set at minimum:

   ```env
   DATABASE_URL=mysql://user:pass@localhost:3306/assess_hub
   NEXTAUTH_URL=http://localhost:3005
   NEXTAUTH_SECRET=any-dev-secret
   ENABLE_DEV_AUTH=true
   ```

   With `ENABLE_DEV_AUTH=true`, a credentials provider is available so you can sign in without configuring OAuth.

3. **Initialize the database:**

   ```bash
   npm run db:init
   ```

   This runs the schema migration and seeds initial data (assessment types, default admin user). It's idempotent — safe to run multiple times.

4. **Start the dev server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3005](http://localhost:3005).

## Docker (Local)

Docker Compose reads from a `.env` file in the project root. Create one:

```env
ENABLE_DEV_AUTH=true
DATABASE_URL=mysql://user:pass@host:3306/assess_hub
NEXTAUTH_URL=http://localhost:3005
NEXTAUTH_SECRET=any-dev-secret
```

Then build and run:

```bash
docker compose up --build
```

The app is available at [http://localhost:3005](http://localhost:3005).

**Note:** The container does NOT run database migrations. Run `npm run db:init` before the first deployment (or whenever the schema changes).

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
| `npm run dev` | Start development server on port 3005 |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:init` | Run schema migration + seed (reads `.env`) |
| `npm run db:seed` | Run TypeScript seed script (for development) |

## Authentication & Roles

Users must be pre-authorized in the database before they can sign in (OAuth or dev credentials). There are three roles:

- **admin** — Full access: manage users, assessment types, and all assessments
- **sa** (solutions architect) — Create and manage own assessments
- **reader** — View-only access to assessments
