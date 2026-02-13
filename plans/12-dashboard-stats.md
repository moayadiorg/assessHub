# Plan 12: Dashboard Statistics

## Overview

Replace hardcoded dashboard stats with live data from the database. The current dashboard (`src/app/page.tsx`) displays static placeholder data. This plan converts it to a client component that fetches real statistics.

## Dependencies

- None (can be implemented in parallel with Plan 13)

## Features

1. **Total assessments by status** - Count of draft, in-progress, and completed assessments
2. **Breakdown by assessment type** - Count of assessments per type with completion rates
3. **Average score per assessment type** - Only for completed assessments
4. **Recent assessments table** - Live data, limit 5, ordered by updatedAt desc

## Files to Create

### `src/app/api/dashboard/stats/route.ts`

API endpoint that aggregates dashboard statistics.

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  // 1. Get total counts by status
  const statusCounts = await prisma.assessment.groupBy({
    by: ['status'],
    _count: { id: true }
  })

  // 2. Get assessments by type with counts
  const typeStats = await prisma.assessmentType.findMany({
    where: { isActive: true },
    include: {
      assessments: {
        select: { id: true, status: true }
      },
      categories: {
        include: {
          questions: true
        }
      }
    }
  })

  // 3. For each type, calculate avg score of completed assessments
  // Reuse scoring logic from results route

  // 4. Get 5 most recent assessments
  const recentAssessments = await prisma.assessment.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      assessmentType: {
        select: { name: true }
      },
      responses: true
    }
  })

  // Return aggregated stats
  return NextResponse.json({
    totalAssessments,
    byStatus: { draft, inProgress, completed },
    byType: [...],
    recentAssessments: [...]
  })
}
```

## Files to Modify

### `src/app/page.tsx`

Convert from server component to client component:

1. Add `'use client'` directive
2. Add state for stats data and loading state
3. Add `useEffect` to fetch `/api/dashboard/stats` on mount
4. Replace hardcoded values with live data
5. Add loading skeleton while data loads
6. Handle error states

## API Response Schema

```typescript
interface DashboardStats {
  totalAssessments: number
  byStatus: {
    draft: number
    inProgress: number
    completed: number
  }
  byType: Array<{
    typeId: string
    typeName: string
    iconColor: string
    count: number
    completedCount: number
    avgScore: number | null  // null if no completed assessments
  }>
  recentAssessments: Array<{
    id: string
    name: string
    customerName: string
    typeName: string
    status: string
    score: number | null  // null if not completed or no responses
    updatedAt: string
  }>
}
```

## Implementation Notes

### Scoring Logic

Reuse the scoring calculation from `src/app/api/assessments/[id]/results/route.ts`:

```typescript
// Calculate overall score for an assessment
function calculateOverallScore(responses: Response[], categories: Category[]): number | null {
  if (responses.length === 0) return null

  const responsesMap = new Map(responses.map(r => [r.questionId, r]))

  const categoryScores = categories.map(category => {
    const questionIds = category.questions.map(q => q.id)
    const categoryResponses = questionIds
      .map(id => responsesMap.get(id))
      .filter(Boolean)

    if (categoryResponses.length === 0) return null

    const totalScore = categoryResponses.reduce((sum, r) => sum + r!.score, 0)
    return totalScore / categoryResponses.length
  }).filter(score => score !== null)

  if (categoryScores.length === 0) return null

  return Math.round(
    (categoryScores.reduce((sum, s) => sum + s!, 0) / categoryScores.length) * 10
  ) / 10
}
```

### Average Score Calculation

For each assessment type:
1. Get all completed assessments of that type
2. Calculate overall score for each
3. Average all scores
4. Round to 1 decimal place

### Recent Assessments Score

For each recent assessment:
- If status is not 'completed', score is null
- Otherwise, calculate using the scoring logic above

## UI Updates

### Stat Cards

Current hardcoded:
```tsx
<StatCard label="Total Assessments" value="47" ... />
```

Updated to use live data:
```tsx
<StatCard label="Total Assessments" value={stats.totalAssessments.toString()} ... />
```

### Recent Assessments Table

Replace static rows with mapped data:
```tsx
{stats.recentAssessments.map(assessment => (
  <Table.Row key={assessment.id}>
    <Table.Cell>
      <Link href={`/assessments/${assessment.id}`}>
        <Text weight="medium">{assessment.name}</Text>
      </Link>
    </Table.Cell>
    <Table.Cell>{assessment.customerName}</Table.Cell>
    <Table.Cell>{assessment.typeName}</Table.Cell>
    <Table.Cell>
      <Badge color={getStatusColor(assessment.status)}>
        {formatStatus(assessment.status)}
      </Badge>
    </Table.Cell>
    <Table.Cell>{assessment.score?.toFixed(1) ?? '-'}</Table.Cell>
    <Table.Cell>{formatRelativeTime(assessment.updatedAt)}</Table.Cell>
  </Table.Row>
))}
```

### Helper Functions Needed

```typescript
function getStatusColor(status: string): 'green' | 'yellow' | 'gray' {
  switch (status) {
    case 'completed': return 'green'
    case 'in-progress': return 'yellow'
    default: return 'gray'
  }
}

function formatStatus(status: string): string {
  switch (status) {
    case 'in-progress': return 'In Progress'
    case 'completed': return 'Completed'
    default: return 'Draft'
  }
}

function formatRelativeTime(dateString: string): string {
  // Use date-fns or simple logic for relative time
  // "2 hours ago", "1 day ago", etc.
}
```

## Testing Checklist

- [ ] API returns correct total count
- [ ] Status breakdown matches database
- [ ] Type breakdown includes all active types
- [ ] Average scores are calculated only from completed assessments
- [ ] Recent assessments are ordered by updatedAt desc
- [ ] Recent assessments limited to 5
- [ ] Scores show correctly for completed assessments
- [ ] Scores show '-' for non-completed assessments
- [ ] Loading state displays while fetching
- [ ] Error state handles API failures gracefully

## Edge Cases

1. **No assessments exist** - Show 0 for all counts, empty recent table
2. **No completed assessments** - avgScore should be null for all types
3. **Assessment with no responses** - Score should be null
4. **All assessments are draft** - In Progress and Completed counts are 0
