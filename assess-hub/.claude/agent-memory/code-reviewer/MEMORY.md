# Code Review Memory: Assess Hub Project

## Project Context
- **Stack**: Next.js 14+, Prisma ORM, SQLite, Radix UI, TypeScript
- **Architecture**: API routes follow Next.js 13+ App Router conventions with async params
- **Auth**: NextAuth.js integration (role-based access control)

## Database Patterns Observed

### Prisma Schema Conventions
- Using `cuid()` for primary keys
- Timestamps with `@default(now())` and `@updatedAt`
- Cascade deletes on child entities (`onDelete: Cascade`)
- Unique constraints properly defined (`@unique`)

### Migration Strategy
- Additive migrations preferred (add optional fields first, require later)
- Data migration scripts in `prisma/migrations/` directory
- Foreign key constraint: `ON DELETE SET NULL` for optional Customer relation

## API Route Patterns

### Error Response Standards
- **400**: Bad request (validation failures, missing required fields)
- **404**: Resource not found
- **409**: Conflict (duplicate unique constraint violations)
- **201**: Successful resource creation

### Parameter Handling (Next.js 14+)
- Route params are **async Promises** and must be awaited
- Pattern: `const { id } = await params`

### Input Validation
- All user inputs are trimmed before validation
- Empty string checks: `!body.field?.trim()`
- Duplicate checks performed before database operations

## Security Observations

### Input Sanitization
- ✓ Trimming user inputs consistently
- ✓ Validating required fields before DB operations
- ✓ Length limits enforced (MAX_NAME_LENGTH = 200) in customer/assessment APIs
- ⚠ No sanitization for SQL injection (Prisma provides protection via parameterized queries)

### Authentication Patterns
- ✓ Most APIs use `getServerSession(authOptions)` for auth checks
- ⚠ **RECURRING ISSUE**: Inconsistent authentication - some APIs missing session checks
  - Example: `/api/assessment-types` GET endpoint has no auth (Plan 14 review)
  - **RESOLVED**: `/api/reports/compare` DOES have authentication (Plan 16)
  - Always verify ALL API endpoints have authentication when reviewing
- ✓ Middleware protects routes: `/admin/*`, `/assessments/*`
- ⚠ **RECURRING ISSUE**: New pages not added to middleware matcher
  - Example: `/reports` page missing from middleware (Plan 14 review)
  - **UNRESOLVED**: `/reports/compare` page likely missing from middleware matcher
  - Always check `src/middleware.ts` when reviewing new pages

### Race Conditions
- ✓ Proper handling of P2002 Prisma errors with retry logic (customers/assessments)
- ⚠ Check-then-create pattern used for duplicate detection (minor TOCTOU risk)

## Common Anti-Patterns to Watch

### What Was Done Right
1. **Backward compatibility**: Kept `customerName` field during migration
2. **Graceful degradation**: Accept both `customerId` and `customerName`
3. **Proper cascades**: Delete protection for entities with dependencies
4. **Idempotent migrations**: Using `upsert` in migration scripts

### Potential Issues in Other Code
1. ~~Missing error handling for Prisma constraint violations (P2002 unique constraint)~~ - RESOLVED in newer APIs
2. No pagination on list endpoints (could cause performance issues at scale)
3. No rate limiting on POST endpoints
4. Hardcoded user in UI (`createdBy: 'current-user'`) - TODO not resolved
5. **N+1 Query Pattern**: Watch for Promise.all + map loops that fetch per-item data
   - Example: `/api/assessments` counts questions for each assessment individually (Plan 14 review)
   - Consider denormalization or groupBy aggregations for performance

## Assessment Types & Domain Logic
- Assessment types have categories, categories have questions
- Questions have maturity level options (1-5 scoring)
- Responses link assessments to questions with scores

## Testing Checklist Patterns
- API CRUD operations (GET, POST, PATCH, DELETE)
- Unique constraint violations
- Foreign key integrity
- Cascade delete behavior
- Edge cases: empty strings, nulls, non-existent IDs
- **Client-side state management tests**:
  - Empty data arrays (no customers, no assessments)
  - Loading states and error states
  - Dependent dropdowns (selection cascades)
  - Disabled button states (when should actions be unavailable?)

## UI/UX Patterns Observed

### Client-Side Pages (Next.js)
- Use `useSession()` from next-auth/react for auth state
- Handle three states: `loading`, `authenticated`, `unauthenticated`
- Redirect pattern: `useEffect` watching status, `router.push()` to signin
- Show loading UI while checking auth: `if (status === 'loading') return <Loading/>`
- Return `null` if redirecting to prevent flash of content

### Empty States & Error Handling
- ✓ Proper empty state messages in UI (Plan 14: "No customers found", "Need at least 2 assessments")
- ✓ Error state with retry button pattern (Plan 14)
- ⚠ **RECURRING GAP**: Error handling on secondary data fetches often just logs to console
  - Always provide user-visible error messages for all async operations

### Form Controls & Validation
- Disabled buttons when required selections missing
- Filter dropdown options to prevent invalid selections (e.g., same assessment in both dropdowns)
- Visual feedback: loading states, disabled states, error messages near controls

## Scoring Logic Patterns

### Standard Scoring Algorithm
**Category Score Calculation**:
```typescript
// 1. Get all responses for questions in category
// 2. Calculate average: sum(scores) / count(responses)
// 3. Round to 1 decimal: Math.round(avg * 10) / 10
// 4. Return 0 if no responses
```

**Overall Score Calculation**:
```typescript
// 1. Filter categories that have at least one response (validCategories)
// 2. Calculate average of valid category scores
// 3. Round to 1 decimal: Math.round(avg * 10) / 10
// 4. Return 0 if no valid categories
```

**Maturity Level Mapping**:
- Score >= 4.5 → Level 5: "Optimizing"
- Score >= 3.5 → Level 4: "Quantitatively Managed"
- Score >= 2.5 → Level 3: "Defined"
- Score >= 1.5 → Level 2: "Managed"
- Score < 1.5 → Level 1: "Initial"

**IMPORTANT**: This scoring logic MUST be consistent across:
- `/api/assessments/[id]/results/route.ts` - Single assessment results
- `/api/reports/compare/route.ts` - Comparison report (both assessments)
- Any future reporting endpoints

**Observed Discrepancy in Results API**:
- Results API filters by `c.answeredQuestions > 0` for validCategories
- Compare API filters by `c.score > 0` for validCategories
- ⚠ **Potential Edge Case**: Category with responses all scoring 0 would be excluded in compare API but included in results API

## Visualization Patterns (Recharts)

### Radar/Spider Charts
- Domain: `[0, 5]` for maturity scoring (1-5 scale)
- Tick count: 6 (includes 0)
- Radix UI color variables: `var(--blue-9)`, `var(--green-9)`, etc.
- Fill opacity: 0.2 for overlapping areas
- Stroke width: 2 for clear lines
- Custom tooltips with white background, border, shadow
- Legend formatter to apply Radix colors

### Color Conventions for Comparisons
- **Assessment 1**: Blue (`var(--blue-9)`)
- **Assessment 2**: Green (`var(--green-9)`)
- **Winner badge**: Yellow (`var(--yellow-9)`)
- **Positive delta**: Blue (Assessment 1 wins)
- **Negative delta**: Green (Assessment 2 wins)
- **Tie delta**: Gray

### Table Formatting
- Color indicators (8x8px circles) in column headers
- Bold text for winning scores
- Delta badges with icons (ArrowUpIcon, ArrowDownIcon, MinusIcon)
- Center-aligned numeric columns

## PDF Export Patterns

### Export Function Usage
```typescript
await exportToPDF('element-id', {
  filename: 'custom-name.pdf',
  orientation: 'landscape' // or 'portrait'
})
```

### Element Preparation
- Wrap exportable content in `<Box id="unique-id">`
- Exclude action buttons/navigation from export container
- Use landscape orientation for wide comparison tables
- Multi-page support automatic (html2canvas + jsPDF)

### Filename Conventions
- Results: `assessment-results-{name}.pdf`
- Comparison: `comparison-{name1}-vs-{name2}.pdf`
- Sanitize filenames (spaces in assessment names)
