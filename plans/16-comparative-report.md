# Plan 16: Comparative Report

## Overview

Create a side-by-side comparison of two assessments of the same type. This report shows overlaid spider charts, score comparison tables, and delta analysis to highlight differences between assessments.

## Dependencies

- **Plan 14: Reports Landing Page** - Navigation entry point and assessment selection

## Features

1. **Assessment headers** - Name, customer, date for both assessments
2. **Overlaid spider chart** - Both assessments on same radar with different colors
3. **Score comparison table** - Category-by-category with delta column
4. **Overall comparison summary** - Winner indication, total delta
5. **PDF export** - Export the comparison report

## Files to Create

### `src/app/api/reports/compare/route.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const a1 = searchParams.get('a1')
  const a2 = searchParams.get('a2')

  if (!a1 || !a2) {
    return NextResponse.json(
      { error: 'Both a1 and a2 query parameters are required' },
      { status: 400 }
    )
  }

  if (a1 === a2) {
    return NextResponse.json(
      { error: 'Cannot compare an assessment with itself' },
      { status: 400 }
    )
  }

  // Fetch both assessments with full data
  const [assessment1, assessment2] = await Promise.all([
    prisma.assessment.findUnique({
      where: { id: a1 },
      include: {
        assessmentType: {
          include: {
            categories: {
              orderBy: { order: 'asc' },
              include: {
                questions: { orderBy: { order: 'asc' } }
              }
            }
          }
        },
        responses: true,
        customer: true
      }
    }),
    prisma.assessment.findUnique({
      where: { id: a2 },
      include: {
        assessmentType: {
          include: {
            categories: {
              orderBy: { order: 'asc' },
              include: {
                questions: { orderBy: { order: 'asc' } }
              }
            }
          }
        },
        responses: true,
        customer: true
      }
    })
  ])

  if (!assessment1) {
    return NextResponse.json(
      { error: `Assessment ${a1} not found` },
      { status: 404 }
    )
  }

  if (!assessment2) {
    return NextResponse.json(
      { error: `Assessment ${a2} not found` },
      { status: 404 }
    )
  }

  // Verify same assessment type
  if (assessment1.assessmentTypeId !== assessment2.assessmentTypeId) {
    return NextResponse.json(
      { error: 'Assessments must be of the same type to compare' },
      { status: 400 }
    )
  }

  // Calculate scores for both
  const scores1 = calculateScores(
    assessment1.responses,
    assessment1.assessmentType.categories
  )
  const scores2 = calculateScores(
    assessment2.responses,
    assessment2.assessmentType.categories
  )

  // Build comparison
  const categoryDeltas = scores1.categoryScores.map((cat1, index) => {
    const cat2 = scores2.categoryScores[index]
    const delta = Math.round((cat1.score - cat2.score) * 10) / 10
    return {
      categoryId: cat1.categoryId,
      categoryName: cat1.categoryName,
      score1: cat1.score,
      score2: cat2.score,
      delta,
      winner: delta > 0 ? 1 : delta < 0 ? 2 : 'tie'
    }
  })

  const overallDelta = Math.round((scores1.overallScore - scores2.overallScore) * 10) / 10

  return NextResponse.json({
    assessmentType: {
      id: assessment1.assessmentType.id,
      name: assessment1.assessmentType.name
    },
    assessment1: {
      id: assessment1.id,
      name: assessment1.name,
      customerName: assessment1.customer?.name || assessment1.customerName,
      completedAt: assessment1.updatedAt.toISOString(),
      overallScore: scores1.overallScore,
      maturityLevel: scores1.maturityLevel,
      categoryScores: scores1.categoryScores
    },
    assessment2: {
      id: assessment2.id,
      name: assessment2.name,
      customerName: assessment2.customer?.name || assessment2.customerName,
      completedAt: assessment2.updatedAt.toISOString(),
      overallScore: scores2.overallScore,
      maturityLevel: scores2.maturityLevel,
      categoryScores: scores2.categoryScores
    },
    comparison: {
      overallDelta,
      winner: overallDelta > 0 ? 1 : overallDelta < 0 ? 2 : 'tie',
      categoryDeltas
    }
  })
}

function calculateScores(responses: any[], categories: any[]) {
  const responsesMap = new Map(responses.map(r => [r.questionId, r]))

  const categoryScores = categories.map(category => {
    const questionIds = category.questions.map((q: any) => q.id)
    const categoryResponses = questionIds
      .map((id: string) => responsesMap.get(id))
      .filter(Boolean)

    const totalScore = categoryResponses.reduce((sum: number, r: any) => sum + r.score, 0)
    const avgScore = categoryResponses.length > 0
      ? Math.round((totalScore / categoryResponses.length) * 10) / 10
      : 0

    return {
      categoryId: category.id,
      categoryName: category.name,
      score: avgScore
    }
  })

  const validCategories = categoryScores.filter(c => c.score > 0)
  const overallScore = validCategories.length > 0
    ? Math.round(
        (validCategories.reduce((sum, c) => sum + c.score, 0) / validCategories.length) * 10
      ) / 10
    : 0

  const maturityLevel = getMaturityLevel(overallScore)

  return { overallScore, maturityLevel, categoryScores }
}

function getMaturityLevel(score: number): { level: number; name: string } {
  if (score >= 4.5) return { level: 5, name: 'Optimizing' }
  if (score >= 3.5) return { level: 4, name: 'Quantitatively Managed' }
  if (score >= 2.5) return { level: 3, name: 'Defined' }
  if (score >= 1.5) return { level: 2, name: 'Managed' }
  return { level: 1, name: 'Initial' }
}
```

### `src/app/reports/compare/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Box,
  Card,
  Flex,
  Text,
  Grid,
  Badge,
  Button,
  Heading,
} from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { ComparisonSpiderChart } from '@/components/visualization/ComparisonSpiderChart'
import { ComparisonTable } from '@/components/visualization/ComparisonTable'
import { exportToPDF } from '@/lib/pdf-export'
import {
  DownloadIcon,
  ArrowLeftIcon,
  CheckCircledIcon,
} from '@radix-ui/react-icons'
import Link from 'next/link'

interface ComparisonReport {
  assessmentType: { id: string; name: string }
  assessment1: AssessmentData
  assessment2: AssessmentData
  comparison: {
    overallDelta: number
    winner: 1 | 2 | 'tie'
    categoryDeltas: CategoryDelta[]
  }
}

interface AssessmentData {
  id: string
  name: string
  customerName: string
  completedAt: string
  overallScore: number
  maturityLevel: { level: number; name: string }
  categoryScores: Array<{
    categoryId: string
    categoryName: string
    score: number
  }>
}

interface CategoryDelta {
  categoryId: string
  categoryName: string
  score1: number
  score2: number
  delta: number
  winner: 1 | 2 | 'tie'
}

export default function CompareReportPage() {
  const searchParams = useSearchParams()
  const a1 = searchParams.get('a1')
  const a2 = searchParams.get('a2')

  const [report, setReport] = useState<ComparisonReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!a1 || !a2) {
      setError('Missing assessment IDs')
      setLoading(false)
      return
    }

    fetch(`/api/reports/compare?a1=${a1}&a2=${a2}`)
      .then(r => {
        if (!r.ok) return r.json().then(d => Promise.reject(d))
        return r.json()
      })
      .then(data => {
        setReport(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.error || 'Failed to load comparison')
        setLoading(false)
      })
  }, [a1, a2])

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportToPDF('comparison-report', {
        filename: `comparison-${report?.assessment1.name}-vs-${report?.assessment2.name}.pdf`,
        orientation: 'landscape'
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <Box>
        <Header title="Comparison Report" />
        <Box p="6"><Text>Loading comparison...</Text></Box>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Header title="Comparison Report" />
        <Box p="6">
          <Card>
            <Text color="red">{error}</Text>
            <Button variant="soft" mt="4" asChild>
              <Link href="/reports">Back to Reports</Link>
            </Button>
          </Card>
        </Box>
      </Box>
    )
  }

  if (!report) return null

  return (
    <Box>
      <Header title="Comparison Report" />

      <Box p="6">
        {/* Actions Bar */}
        <Flex justify="between" align="center" mb="6">
          <Button variant="ghost" asChild>
            <Link href="/reports">
              <ArrowLeftIcon />
              Back to Reports
            </Link>
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            <DownloadIcon />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </Flex>

        {/* Report Content */}
        <Box id="comparison-report">
          {/* Header */}
          <Card mb="6">
            <Flex justify="center" align="center" gap="2" mb="4">
              <Badge size="2" variant="soft">
                {report.assessmentType.name}
              </Badge>
            </Flex>
            <Heading size="5" align="center">Assessment Comparison</Heading>
          </Card>

          {/* Assessment Headers */}
          <Grid columns="2" gap="4" mb="6">
            <AssessmentHeader
              assessment={report.assessment1}
              color="blue"
              label="Assessment 1"
              isWinner={report.comparison.winner === 1}
            />
            <AssessmentHeader
              assessment={report.assessment2}
              color="green"
              label="Assessment 2"
              isWinner={report.comparison.winner === 2}
            />
          </Grid>

          {/* Overall Comparison */}
          <Card mb="6">
            <Flex justify="center" align="center" gap="4">
              <Box style={{ textAlign: 'center' }}>
                <Text size="7" weight="bold" color="blue">
                  {report.assessment1.overallScore.toFixed(1)}
                </Text>
                <Text size="2" color="gray" style={{ display: 'block' }}>
                  {report.assessment1.maturityLevel.name}
                </Text>
              </Box>

              <Box style={{ textAlign: 'center', padding: '0 20px' }}>
                <Text size="2" color="gray">Difference</Text>
                <Text
                  size="5"
                  weight="bold"
                  color={report.comparison.overallDelta > 0 ? 'blue' :
                         report.comparison.overallDelta < 0 ? 'green' : 'gray'}
                >
                  {report.comparison.overallDelta > 0 ? '+' : ''}
                  {report.comparison.overallDelta.toFixed(1)}
                </Text>
              </Box>

              <Box style={{ textAlign: 'center' }}>
                <Text size="7" weight="bold" color="green">
                  {report.assessment2.overallScore.toFixed(1)}
                </Text>
                <Text size="2" color="gray" style={{ display: 'block' }}>
                  {report.assessment2.maturityLevel.name}
                </Text>
              </Box>
            </Flex>
          </Card>

          {/* Spider Chart */}
          <Card mb="6">
            <Text size="4" weight="bold" mb="4">Category Comparison</Text>
            <ComparisonSpiderChart
              data1={report.assessment1.categoryScores}
              data2={report.assessment2.categoryScores}
              label1={report.assessment1.name}
              label2={report.assessment2.name}
            />
          </Card>

          {/* Comparison Table */}
          <Card>
            <Text size="4" weight="bold" mb="4">Detailed Comparison</Text>
            <ComparisonTable
              categoryDeltas={report.comparison.categoryDeltas}
              assessment1Name={report.assessment1.name}
              assessment2Name={report.assessment2.name}
            />
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

function AssessmentHeader({
  assessment,
  color,
  label,
  isWinner
}: {
  assessment: AssessmentData
  color: 'blue' | 'green'
  label: string
  isWinner: boolean
}) {
  return (
    <Card style={{ borderLeft: `4px solid var(--${color}-9)` }}>
      <Flex justify="between" align="start">
        <Box>
          <Flex align="center" gap="2" mb="2">
            <Badge color={color} variant="soft">{label}</Badge>
            {isWinner && (
              <Badge color="yellow" variant="soft">
                <CheckCircledIcon width={12} height={12} />
                Higher Score
              </Badge>
            )}
          </Flex>
          <Text size="4" weight="bold" style={{ display: 'block' }}>
            {assessment.name}
          </Text>
          <Text size="2" color="gray">{assessment.customerName}</Text>
        </Box>
        <Box style={{ textAlign: 'right' }}>
          <Text size="2" color="gray">Completed</Text>
          <Text size="2" style={{ display: 'block' }}>
            {new Date(assessment.completedAt).toLocaleDateString()}
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}
```

### `src/components/visualization/ComparisonSpiderChart.tsx`

```typescript
'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

interface CategoryScore {
  categoryId: string
  categoryName: string
  score: number
}

interface ComparisonSpiderChartProps {
  data1: CategoryScore[]
  data2: CategoryScore[]
  label1: string
  label2: string
}

export function ComparisonSpiderChart({
  data1,
  data2,
  label1,
  label2
}: ComparisonSpiderChartProps) {
  // Merge data for the chart
  const chartData = data1.map((cat1, index) => ({
    category: cat1.categoryName,
    score1: cat1.score,
    score2: data2[index]?.score || 0,
    fullMark: 5
  }))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={chartData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
        <PolarGrid stroke="var(--gray-6)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: 'var(--gray-11)', fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          tick={{ fill: 'var(--gray-9)', fontSize: 10 }}
          tickCount={6}
        />

        {/* Assessment 1 - Blue */}
        <Radar
          name={label1}
          dataKey="score1"
          stroke="var(--blue-9)"
          fill="var(--blue-9)"
          fillOpacity={0.2}
          strokeWidth={2}
        />

        {/* Assessment 2 - Green */}
        <Radar
          name={label2}
          dataKey="score2"
          stroke="var(--green-9)"
          fill="var(--green-9)"
          fillOpacity={0.2}
          strokeWidth={2}
        />

        <Legend
          wrapperStyle={{ paddingTop: 20 }}
          formatter={(value) => (
            <span style={{ color: 'var(--gray-12)', fontSize: 12 }}>{value}</span>
          )}
        />

        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div
                  style={{
                    backgroundColor: 'white',
                    padding: '12px 16px',
                    border: '1px solid var(--gray-6)',
                    borderRadius: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                    {label}
                  </div>
                  {payload.map((entry: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        color: entry.color,
                        marginBottom: 4
                      }}
                    >
                      {entry.name}: {entry.value.toFixed(1)} / 5
                    </div>
                  ))}
                </div>
              )
            }
            return null
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
```

### `src/components/visualization/ComparisonTable.tsx`

```typescript
'use client'

import { Table, Text, Flex, Badge } from '@radix-ui/themes'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
} from '@radix-ui/react-icons'

interface CategoryDelta {
  categoryId: string
  categoryName: string
  score1: number
  score2: number
  delta: number
  winner: 1 | 2 | 'tie'
}

interface ComparisonTableProps {
  categoryDeltas: CategoryDelta[]
  assessment1Name: string
  assessment2Name: string
}

export function ComparisonTable({
  categoryDeltas,
  assessment1Name,
  assessment2Name
}: ComparisonTableProps) {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Category</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell style={{ textAlign: 'center' }}>
            <Flex align="center" justify="center" gap="2">
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--blue-9)'
                }}
              />
              {assessment1Name}
            </Flex>
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell style={{ textAlign: 'center' }}>
            <Flex align="center" justify="center" gap="2">
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--green-9)'
                }}
              />
              {assessment2Name}
            </Flex>
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell style={{ textAlign: 'center' }}>
            Difference
          </Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {categoryDeltas.map(cat => (
          <Table.Row key={cat.categoryId}>
            <Table.Cell>
              <Text weight="medium">{cat.categoryName}</Text>
            </Table.Cell>
            <Table.Cell style={{ textAlign: 'center' }}>
              <Text
                weight={cat.winner === 1 ? 'bold' : 'regular'}
                color={cat.winner === 1 ? 'blue' : undefined}
              >
                {cat.score1.toFixed(1)}
              </Text>
            </Table.Cell>
            <Table.Cell style={{ textAlign: 'center' }}>
              <Text
                weight={cat.winner === 2 ? 'bold' : 'regular'}
                color={cat.winner === 2 ? 'green' : undefined}
              >
                {cat.score2.toFixed(1)}
              </Text>
            </Table.Cell>
            <Table.Cell style={{ textAlign: 'center' }}>
              <DeltaBadge delta={cat.delta} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <Badge color="gray" variant="soft">
        <MinusIcon width={10} height={10} />
        0.0
      </Badge>
    )
  }

  const isPositive = delta > 0
  const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon
  const color = isPositive ? 'blue' : 'green'

  return (
    <Badge color={color} variant="soft">
      <Icon width={10} height={10} />
      {isPositive ? '+' : ''}{delta.toFixed(1)}
    </Badge>
  )
}
```

### `src/components/export/ComparisonReportPDF.tsx`

Optional custom PDF generation if needed:

```typescript
// Can be implemented if html2canvas approach doesn't work well for comparison layout
```

## API Response Schema

```typescript
interface ComparisonReport {
  assessmentType: {
    id: string
    name: string
  }
  assessment1: {
    id: string
    name: string
    customerName: string
    completedAt: string
    overallScore: number
    maturityLevel: { level: number; name: string }
    categoryScores: Array<{
      categoryId: string
      categoryName: string
      score: number
    }>
  }
  assessment2: {
    // Same structure as assessment1
  }
  comparison: {
    overallDelta: number  // assessment1.score - assessment2.score
    winner: 1 | 2 | 'tie'
    categoryDeltas: Array<{
      categoryId: string
      categoryName: string
      score1: number
      score2: number
      delta: number  // score1 - score2
      winner: 1 | 2 | 'tie'
    }>
  }
}
```

## Query Parameters

- `a1` - ID of the first assessment (required)
- `a2` - ID of the second assessment (required)

Example: `/reports/compare?a1=abc123&a2=def456`

## Error Responses

| Status | Error | Condition |
|--------|-------|-----------|
| 400 | Missing a1 or a2 | Query params not provided |
| 400 | Same assessment | a1 === a2 |
| 400 | Different types | Assessments are of different types |
| 404 | Assessment not found | a1 or a2 doesn't exist |

## Testing Checklist

- [ ] API returns 400 when a1 missing
- [ ] API returns 400 when a2 missing
- [ ] API returns 400 when a1 === a2
- [ ] API returns 400 when types don't match
- [ ] API returns 404 when assessment doesn't exist
- [ ] Scores calculated correctly for both assessments
- [ ] Delta is score1 - score2 (positive means assessment1 higher)
- [ ] Winner correctly identified for overall and each category
- [ ] ComparisonSpiderChart renders both datasets
- [ ] ComparisonSpiderChart has correct colors (blue/green)
- [ ] Legend displays both assessment names
- [ ] ComparisonTable shows all categories
- [ ] Delta badges show correct colors and arrows
- [ ] PDF export captures entire comparison
- [ ] Navigation back to /reports works
- [ ] Error states display appropriately

## Edge Cases

1. **Same scores** - Winner is 'tie', delta is 0
2. **One assessment has missing responses** - Calculate with available data
3. **Very long assessment names** - Truncate in headers/legend
4. **Many categories** - Spider chart handles gracefully, table scrolls
5. **API error** - Show error message with back button
