# Assessment Seed Scripts

This directory contains TypeScript scripts for creating sample assessments and managing test data in the AssessHub application.

## Available Scripts

### 1. seed-iac-assessment-v2.ts
**Purpose**: Create a sample Infrastructure as Code Maturity assessment for Acme Corporation

**What it creates**:
- Customer: "Acme Corporation" (if not exists)
- Assessment: "IaC Maturity Assessment - Q1 2026"
- 15 completed responses with realistic scores and commentary
- Target maturity: ~65% (Defined stage)

**Usage**:
```bash
npx tsx scripts/seed-iac-assessment-v2.ts
```

**Output**:
- Creates a new assessment each time it runs
- Displays assessment ID and access URLs
- Shows category scores and overall maturity level

**Idempotency**:
- Customer creation is idempotent (uses upsert)
- Assessment creation is NOT idempotent (creates new assessment each run)
- Use cleanup script to remove old assessments

---

### 2. view-acme-assessment.ts
**Purpose**: Display detailed information about the most recent Acme Corporation assessment

**What it shows**:
- Assessment metadata (name, customer, status, dates)
- Overall maturity score and percentage
- Category-by-category breakdown with progress bars
- Individual questions with scores and commentary
- Strengths and weaknesses analysis
- Access URLs for viewing in browser

**Usage**:
```bash
npx tsx scripts/view-acme-assessment.ts
```

---

### 3. cleanup-acme-assessment.ts
**Purpose**: Delete all assessments for Acme Corporation

**What it deletes**:
- All assessments for Acme Corporation
- All responses (via CASCADE)

**What it keeps**:
- Customer record (for referential integrity)
- Assessment type and questions (shared across customers)

**Usage**:
```bash
npx tsx scripts/cleanup-acme-assessment.ts
```

**Warning**: This operation cannot be undone. Assessment and response data will be permanently deleted.

---

## Workflow Examples

### Create a Fresh Assessment

```bash
# 1. Clean up any existing assessments (optional)
npx tsx scripts/cleanup-acme-assessment.ts

# 2. Create new assessment
npx tsx scripts/seed-iac-assessment-v2.ts

# 3. View the assessment details
npx tsx scripts/view-acme-assessment.ts
```

### Create Multiple Assessments for Trend Analysis

```bash
# Run the seed script multiple times to create multiple assessments
npx tsx scripts/seed-iac-assessment-v2.ts
# Wait a moment for timestamp difference
npx tsx scripts/seed-iac-assessment-v2.ts
# Wait a moment for timestamp difference
npx tsx scripts/seed-iac-assessment-v2.ts

# View customer report to see trends
# Visit: http://localhost:3005/reports/customer/{customer-id}
```

### Customize Maturity Level

To create assessments with different maturity levels, edit `seed-iac-assessment-v2.ts`:

**For Lower Maturity (~40%)**:
```typescript
// Change scores to mostly 2s with some 3s
{ score: 2, commentary: '...' },
{ score: 2, commentary: '...' },
{ score: 3, commentary: '...' },
```

**For Higher Maturity (~80%)**:
```typescript
// Change scores to mostly 4s with some 5s
{ score: 4, commentary: '...' },
{ score: 5, commentary: '...' },
{ score: 4, commentary: '...' },
```

---

## Prerequisites

### Required Setup
1. Database must be initialized with migrations:
   ```bash
   npx prisma migrate dev
   ```

2. Assessment type "Infrastructure as Code Maturity" must exist with questions
   - Can be imported via CSV import feature
   - Or created through the admin UI

3. Development server should be running to view results:
   ```bash
   npm run dev
   ```

---

## Score Interpretation

- **Score 1.0-2.0**: Initial (0-40%)
- **Score 2.0-3.0**: Managed (40-60%)
- **Score 3.0-4.0**: Defined (60-80%)
- **Score 4.0-5.0**: Quantitatively Managed/Optimized (80-100%)

---

## Additional Resources

- **Main Documentation**: `/assess-hub/ACME_ASSESSMENT_CREATED.md`
- **Seed Summary**: `/assess-hub/scripts/SEED_SUMMARY.md`
- **Prisma Schema**: `/assess-hub/prisma/schema.prisma`
