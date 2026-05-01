# Getting Started — Assess-Hub Test Environment

A short walkthrough to get the app running locally and try it end-to-end. About 10 minutes the first time.

## Prerequisites

- **Docker Desktop** running.
- **Node.js 20+** installed (`node --version`).
- Port `3005` (app) and `3306` (MySQL) free on your machine.

## 1 — Start the stack

```bash
cd assess-hub
cp .env.example .env
npm install
npm run dev:local
```

That single command does all of this:

1. Starts a MySQL 8.4 container (`assess-hub-db`) on `127.0.0.1:3306`.
2. Applies the schema and runs both seed steps (5 customers, 4 users, 5 assessment types, 12 sample assessments).
3. Starts `next dev` on `http://localhost:3005` with hot reload.

Wait until you see `✓ Ready in <ms>` in the terminal. The app is now live.

> **Want the production-built image instead of `next dev`?** Use `npm run dev:full`. Same data, no hot reload, slower iteration. Stop with `npm run dev:full:down`. Run only one mode at a time — both want port 3005.

## 2 — Sign in

Open [http://localhost:3005](http://localhost:3005). You'll be redirected to a sign-in page with a "Development Only" form (enabled by `ENABLE_DEV_AUTH=true` in `.env`).

| Email | Role | What you can do |
|---|---|---|
| `admin@example.com` | **admin** | Everything — manage users, assessment types, every assessment |
| `moayad.ismail@gmail.com` | admin | Same |
| `assessor@example.com` | sa | Create and edit your own assessments |
| `reader@example.com` | reader | View only |

**Recommended:** sign in as `admin@example.com` with role `Administrator`. Leave password blank. Click **Sign In (Dev)**.

## 3 — Tour the seeded data

Once signed in:

- **Dashboard** (`/`) — summary cards and recent activity.
- **Assessments** (`/assessments`) — 12 pre-seeded assessments across the 5 customers. Filter by status, search by name.
- **Reports** (`/reports`) — pick a customer to see their aggregated maturity report, or use the comparison tool.
- **Admin → Assessment Types** (`/admin/types`) — 5 templates available:
  - Cloud Infrastructure Maturity (12 questions)
  - DevOps Practices (5 questions)
  - Data Platform Maturity (3 questions)
  - HashiCorp IaC Capability Maturity (17 questions)
  - **Agentic AI Security (ETOM)** (12 questions, purple icon) — the newest one

## 4 — Walk through an assessment

The fastest way to see the app's full lifecycle:

1. Go to **Reports → Acme Corp**. You'll see a maturity report aggregating Acme's assessments — including the seeded **Agentic AI Security Baseline Q2 2026** (overall score 2.17, "Managed"). Skim the radar chart and per-category breakdown.
2. Open that assessment from the report (or via `/assessments`) to see the 12 questions, answers, and per-question commentary.
3. Click **Compare** in the reports area, pick two assessments **of the same type** (e.g. Acme Corp's two Cloud Infrastructure Reviews), and view the side-by-side delta.

## 5 — Run a fresh assessment yourself

1. Click **New Assessment** (or go to `/assessments/new`).
2. Fill in:
   - **Name** — anything, e.g. `My ETOM Test Run`.
   - **Customer** — pick `TechStart Inc` (it has no ETOM assessment yet).
   - **Type** — `Agentic AI Security (ETOM)`.
3. Submit. You'll land on the questionnaire.
4. Answer the 12 questions. Each option describes a concrete operational practice — pick the one that matches the org's reality. Add commentary on any question you want to explain.
5. Mark **Completed** when done.
6. View the report from `/assessments/<your-id>/results`.

## 6 — Reset / tear down

| Command | What it does |
|---|---|
| `Ctrl+C` in the terminal | Stops `next dev`. The DB container keeps running. |
| `npm run db:down` | Stops the DB container. Data persists. |
| `npm run db:reset` | **Wipes the DB volume** and re-seeds from scratch. Use this if your data drifts and you want a known starting point. |
| `npm run dev:full:down` | If you used `dev:full`, stops both containers. |

## Troubleshooting

**Sign-in says "Authentication Error"** — make sure no production `assess-hub` container is hogging port 3005. `docker ps` should show only `assess-hub-db` and (if using `dev:full`) `assess-hub-app`. If a leftover prod container exists, stop it with `docker stop assess-hub`.

**Port 3306 already in use** — you have another MySQL running. Stop it, or edit `docker-compose.dev.yml` and `.env` to use `3307` instead.

**Assessment types missing** — run `npm run db:seed` to re-apply the full seed. It's idempotent.

**Want to start over completely** — `npm run db:reset` wipes and reseeds.

## What's next

- Read the full developer docs in [`README.md`](./README.md) for the architecture, role model, and production deployment notes.
- The existing QA test scenarios live in [`TESTING_GUIDE.md`](./TESTING_GUIDE.md).
