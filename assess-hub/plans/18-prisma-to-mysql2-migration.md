# Plan 18: Prisma → mysql2 Migration

## Objective
Replace Prisma ORM with native `mysql2/promise` for direct SQL control, reduced bundle size, faster cold starts, and elimination of Prisma engine binary dependency.

## Motivation
- **Bundle size**: Prisma client + engine adds ~15MB to Docker image
- **Cold starts**: Prisma engine initialization adds 200-500ms on first query
- **Control**: Raw SQL gives full control over query optimization, JOIN strategies
- **Simplicity**: No schema file, no migration engine, no code generation step

## Architecture

### New Foundation Files
| File | Purpose |
|------|---------|
| `src/lib/db.ts` | MySQL connection pool (singleton) |
| `src/lib/sql-helpers.ts` | `query()`, `queryOne()`, `execute()`, `transaction()`, `isDuplicateEntryError()`, `groupBy()` |
| `src/lib/id.ts` | CUID2 ID generation via `@paralleldrive/cuid2` |
| `src/types/db.ts` | TypeScript interfaces matching MySQL column types |
| `src/lib/mysql-adapter.ts` | Custom NextAuth adapter using raw SQL |

### Key Migration Patterns
- `prisma.model.findMany()` → `query<T>('SELECT ... FROM Model', params)`
- `prisma.model.findUnique()` → `queryOne<T>('SELECT ... FROM Model WHERE id = ?', [id])`
- `prisma.model.create()` → `execute('INSERT INTO Model (...) VALUES (...)', params)`
- `prisma.model.update()` → `execute('UPDATE Model SET ... WHERE id = ?', params)`
- `prisma.model.delete()` → `execute('DELETE FROM Model WHERE id = ?', [id])`
- `prisma.model.upsert()` → `INSERT ... ON DUPLICATE KEY UPDATE`
- `prisma.$transaction()` → `transaction(async (conn) => { ... })`
- Prisma error `P2002` → `isDuplicateEntryError()`
- Prisma error `P2025` → `affectedRows === 0`
- `@updatedAt` → `NOW(3)` in UPDATE statements
- `Boolean` fields → `tinyint(1)` returning 0/1, use `!!value`
- `_count` aggregations → `COUNT(*)` with `GROUP BY` or subqueries

### Column Naming
- MySQL uses backtick escaping for reserved words: `` `order` ``
- `DateTime(3)` precision maintained via `NOW(3)`

## Phases

### Phase 1: Foundation (Complete)
- [x] `src/lib/db.ts` - Connection pool
- [x] `src/lib/sql-helpers.ts` - Query helpers
- [x] `src/lib/id.ts` - ID generation
- [x] `src/types/db.ts` - Type definitions
- [ ] `src/lib/mysql-adapter.ts` - NextAuth adapter
- [ ] `package.json` - Add mysql2, @paralleldrive/cuid2; remove prisma deps

### Phase 2: Auth + Health
- [ ] `src/lib/auth.ts` - Replace PrismaAdapter with MysqlAdapter
- [ ] `src/app/api/health/route.ts` - Replace prisma.$queryRaw with pool.execute
- [ ] Delete `src/lib/prisma.ts`

### Phase 3: CRUD Routes
- [ ] Users API (route.ts, [id]/route.ts)
- [ ] Customers API (route.ts, [id]/route.ts)
- [ ] Categories API (route.ts, [id]/route.ts, reorder/route.ts)
- [ ] Questions API (route.ts, [id]/route.ts, reorder/route.ts)
- [ ] Assessment Types API (route.ts, [id]/route.ts, import/route.ts)
- [ ] Assessments API (route.ts, [id]/route.ts, [id]/results/route.ts)
- [ ] Responses API (route.ts, bulk/route.ts)

### Phase 4: Reports + Dashboard + Server Components
- [ ] Reports customer/[id]/route.ts
- [ ] Reports compare/route.ts
- [ ] Dashboard stats/route.ts
- [ ] `app/admin/types/[id]/page.tsx` server component

### Phase 5: Seed + Docker
- [ ] Rewrite `prisma/seed.ts` with mysql2
- [ ] Update `Dockerfile` (remove Prisma stages)
- [ ] Update `docker-entrypoint.sh` (run migration SQL directly)
- [ ] Delete Prisma schema, config, and migration files

### Phase 6: Verification
- [ ] `npm run build` passes
- [ ] All API routes return identical JSON shapes
- [ ] Docker build succeeds

## Files Removed
- `src/lib/prisma.ts`
- `prisma/schema.prisma`
- `prisma.config.ts`
- `prisma/migrations/` (keep SQL as reference in docker-entrypoint.sh)

## Dependencies Added
- `mysql2` - MySQL driver
- `@paralleldrive/cuid2` - ID generation

## Dependencies Removed
- `prisma` - CLI/engine
- `@prisma/client` - Generated client
- `@auth/prisma-adapter` - NextAuth Prisma adapter
