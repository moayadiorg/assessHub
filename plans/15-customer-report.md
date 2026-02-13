# Plan 15: Customer Report

## Overview

Create an aggregated view of all assessments for a specific customer with trend analysis. This report shows assessment history grouped by type, with trend charts showing score evolution over time.

## Dependencies

- **Plan 13: Customer Model & Migration** - Required for customer data
- **Plan 14: Reports Landing Page** - Navigation entry point

## Features

1. **Customer header** - Name, total assessments, date range
2. **Summary statistics** - Overall metrics across all assessments
3. **Assessments grouped by type** - Cards showing assessments per type
4. **Trend chart per type** - Line graph showing score evolution
5. **Improvement/regression indicators** - Visual indicators for trends
6. **PDF export** - Export the entire report

## Files to Create

### `src/app/api/reports/customer/[id]/route.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      assessments: {
        where: { status: 'completed' },
        include: {
          assessmentType: {
            include: {
              categories: {
                orderBy: { order: 'asc' },
                include: {
                  questions: {
                    orderBy: { order: 'asc' }
                  }
                }
              }
            }
          },
          responses: true
        },
        orderBy: { updatedAt: 'asc' } // Chronological for trends
      }
    }
  })

  if (!customer) {
    return NextResponse.json(
      { error: 'Customer not found' },
      { status: 404 }
    )
  }

  // Group assessments by type
  const typeMap = new Map<string, {
    typeId: string
    typeName: string
    iconColor: string
    assessments: any[]
  }>()

  for (const assessment of customer.assessments) {
    const typeId = assessment.assessmentType.id

    if (!typeMap.has(typeId)) {
      typeMap.set(typeId, {
        typeId,
        typeName: assessment.assessmentType.name,
        iconColor: assessment.assessmentType.iconColor,
        assessments: []
      })
    }

    // Calculate scores for this assessment
    const { overallScore, maturityLevel, categoryScores } = calculateScores(
      assessment.responses,
      assessment.assessmentType.categories
    )

    typeMap.get(typeId)!.assessments.push({
      id: assessment.id,
      name: assessment.name,
      completedAt: assessment.updatedAt.toISOString(),
      overallScore,
      maturityLevel,
      categoryScores
    })
  }

  // Calculate trend for each type
  const assessmentsByType = Array.from(typeMap.values()).map(typeData => {
    const assessments = typeData.assessments
    let trend = null

    if (assessments.length >= 2) {
      const firstScore = assessments[0].overallScore
      const lastScore = assessments[assessments.length - 1].overallScore
      const change = lastScore - firstScore

      trend = {
        direction: change > 0.1 ? 'improving' as const :
                   change < -0.1 ? 'declining' as const :
                   'stable' as const,
        firstScore,
        lastScore,
        change: Math.round(change * 10) / 10
      }
    }

    return {
      ...typeData,
      trend
    }
  })

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name
    },
    totalAssessments: customer.assessments.length,
    assessmentsByType
  })
}

// Reuse scoring logic
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

### `src/app/reports/customer/[id]/page.tsx`

```typescript
'use client'

import { useState, useEffect, use } from 'react'
import {
  Box,
  Card,
  Flex,
  Text,
  Grid,
  Badge,
  Button,
  Table,
  Heading,
} from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { TrendChart } from '@/components/visualization/TrendChart'
import { SpiderChart } from '@/components/visualization/SpiderChart'
import { exportToPDF } from '@/lib/pdf-export'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  DownloadIcon,
  ArrowLeftIcon,
} from '@radix-ui/react-icons'
import Link from 'next/link'

interface CustomerReport {
  customer: { id: string; name: string }
  totalAssessments: number
  assessmentsByType: Array<{
    typeId: string
    typeName: string
    iconColor: string
    assessments: Array<{
      id: string
      name: string
      completedAt: string
      overallScore: number
      maturityLevel: { level: number; name: string }
      categoryScores: Array<{
        categoryId: string
        categoryName: string
        score: number
      }>
    }>
    trend: {
      direction: 'improving' | 'declining' | 'stable'
      firstScore: number
      lastScore: number
      change: number
    } | null
  }>
}

export default function CustomerReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [report, setReport] = useState<CustomerReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetch(`/api/reports/customer/${id}`)
      .then(r => r.json())
      .then(data => {
        setReport(data)
        setLoading(false)
      })
  }, [id])

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportToPDF('customer-report', {
        filename: `${report?.customer.name}-report.pdf`,
        orientation: 'portrait'
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <Box>
        <Header title="Customer Report" />
        <Box p="6"><Text>Loading report...</Text></Box>
      </Box>
    )
  }

  if (!report) {
    return (
      <Box>
        <Header title="Customer Report" />
        <Box p="6"><Text color="red">Customer not found</Text></Box>
      </Box>
    )
  }

  return (
    <Box>
      <Header title="Customer Report" />

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
        <Box id="customer-report">
          {/* Customer Header */}
          <Card mb="6">
            <Heading size="6" mb="2">{report.customer.name}</Heading>
            <Flex gap="6">
              <Box>
                <Text size="6" weight="bold">{report.totalAssessments}</Text>
                <Text size="2" color="gray"> completed assessments</Text>
              </Box>
              <Box>
                <Text size="6" weight="bold">{report.assessmentsByType.length}</Text>
                <Text size="2" color="gray"> assessment types</Text>
              </Box>
            </Flex>
          </Card>

          {/* Assessment Types */}
          {report.assessmentsByType.map(typeData => (
            <Card key={typeData.typeId} mb="6">
              {/* Type Header */}
              <Flex justify="between" align="center" mb="4">
                <Flex align="center" gap="3">
                  <Box
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: typeData.iconColor
                    }}
                  />
                  <Text size="5" weight="bold">{typeData.typeName}</Text>
                  <Badge variant="soft">
                    {typeData.assessments.length} assessment{typeData.assessments.length !== 1 ? 's' : ''}
                  </Badge>
                </Flex>

                {/* Trend Indicator */}
                {typeData.trend && (
                  <TrendIndicator trend={typeData.trend} />
                )}
              </Flex>

              {/* Trend Chart */}
              {typeData.assessments.length >= 2 && (
                <Box mb="4">
                  <TrendChart
                    data={typeData.assessments.map(a => ({
                      name: a.name,
                      date: a.completedAt,
                      score: a.overallScore
                    }))}
                    color={typeData.iconColor}
                  />
                </Box>
              )}

              {/* Assessments Table */}
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Assessment</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Completed</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Score</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Maturity Level</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {typeData.assessments.map(assessment => (
                    <Table.Row key={assessment.id}>
                      <Table.Cell>
                        <Link href={`/assessments/${assessment.id}/results`}>
                          <Text weight="medium" color="blue">
                            {assessment.name}
                          </Text>
                        </Link>
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(assessment.completedAt).toLocaleDateString()}
                      </Table.Cell>
                      <Table.Cell>
                        <Text weight="bold">{assessment.overallScore.toFixed(1)}</Text>
                        <Text color="gray"> / 5</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={getMaturityColor(assessment.maturityLevel.level)}>
                          Level {assessment.maturityLevel.level}: {assessment.maturityLevel.name}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>

              {/* Latest Assessment Spider Chart */}
              {typeData.assessments.length > 0 && (
                <Box mt="4">
                  <Text size="2" color="gray" mb="2">
                    Latest Assessment Category Scores
                  </Text>
                  <SpiderChart
                    categoryScores={typeData.assessments[typeData.assessments.length - 1].categoryScores}
                  />
                </Box>
              )}
            </Card>
          ))}

          {report.assessmentsByType.length === 0 && (
            <Card>
              <Text color="gray">
                No completed assessments found for this customer.
              </Text>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  )
}

function TrendIndicator({ trend }: { trend: { direction: string; change: number } }) {
  const config = {
    improving: { icon: ArrowUpIcon, color: 'green', label: 'Improving' },
    declining: { icon: ArrowDownIcon, color: 'red', label: 'Declining' },
    stable: { icon: MinusIcon, color: 'gray', label: 'Stable' }
  }[trend.direction] || config.stable

  const Icon = config.icon

  return (
    <Flex align="center" gap="2">
      <Badge color={config.color as any} variant="soft">
        <Icon width={12} height={12} />
        {config.label}
      </Badge>
      <Text size="2" color={config.color as any}>
        {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}
      </Text>
    </Flex>
  )
}

function getMaturityColor(level: number): 'red' | 'orange' | 'yellow' | 'blue' | 'green' {
  const colors: Record<number, 'red' | 'orange' | 'yellow' | 'blue' | 'green'> = {
    1: 'red',
    2: 'orange',
    3: 'yellow',
    4: 'blue',
    5: 'green'
  }
  return colors[level] || 'gray'
}
```

### `src/components/visualization/TrendChart.tsx`

```typescript
'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface TrendDataPoint {
  name: string
  date: string
  score: number
}

interface TrendChartProps {
  data: TrendDataPoint[]
  color?: string
}

export function TrendChart({ data, color = 'var(--accent-9)' }: TrendChartProps) {
  const chartData = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit'
    })
  }))

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-5)" />
        <XAxis
          dataKey="displayDate"
          tick={{ fill: 'var(--gray-11)', fontSize: 12 }}
          tickLine={{ stroke: 'var(--gray-6)' }}
        />
        <YAxis
          domain={[0, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fill: 'var(--gray-11)', fontSize: 12 }}
          tickLine={{ stroke: 'var(--gray-6)' }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const d = payload[0].payload
              return (
                <div
                  style={{
                    backgroundColor: 'white',
                    padding: '8px 12px',
                    border: '1px solid var(--gray-6)',
                    borderRadius: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    {d.name}
                  </div>
                  <div style={{ color: 'var(--gray-11)' }}>
                    Score: {d.score.toFixed(1)} / 5
                  </div>
                  <div style={{ color: 'var(--gray-9)', fontSize: 12 }}>
                    {new Date(d.date).toLocaleDateString()}
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        {/* Reference lines for maturity levels */}
        <ReferenceLine y={2.5} stroke="var(--gray-6)" strokeDasharray="5 5" />
        <ReferenceLine y={3.5} stroke="var(--gray-6)" strokeDasharray="5 5" />
        <Line
          type="monotone"
          dataKey="score"
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### `src/components/export/CustomerReportPDF.tsx`

This is optional if the existing `exportToPDF` function with html2canvas works well. If custom PDF generation is needed:

```typescript
// Custom PDF generation using jspdf directly
// Can be implemented if html2canvas approach has issues
```

## API Response Schema

```typescript
interface CustomerReport {
  customer: {
    id: string
    name: string
  }
  totalAssessments: number
  assessmentsByType: Array<{
    typeId: string
    typeName: string
    iconColor: string
    assessments: Array<{
      id: string
      name: string
      completedAt: string
      overallScore: number
      maturityLevel: {
        level: number
        name: string
      }
      categoryScores: Array<{
        categoryId: string
        categoryName: string
        score: number
      }>
    }>
    trend: {
      direction: 'improving' | 'declining' | 'stable'
      firstScore: number
      lastScore: number
      change: number
    } | null  // null if only 1 assessment
  }>
}
```

## Trend Calculation Logic

```typescript
// Trend is calculated when there are 2+ assessments of the same type
// Direction is determined by comparing first and last scores:
// - improving: lastScore - firstScore > 0.1
// - declining: lastScore - firstScore < -0.1
// - stable: |lastScore - firstScore| <= 0.1

// The 0.1 threshold prevents minor fluctuations from being labeled as trends
```

## Testing Checklist

- [ ] API returns 404 for non-existent customer
- [ ] API returns empty assessmentsByType for customer with no completed assessments
- [ ] Assessments are grouped correctly by type
- [ ] Scores are calculated correctly for each assessment
- [ ] Trend shows "improving" when last score > first score + 0.1
- [ ] Trend shows "declining" when last score < first score - 0.1
- [ ] Trend shows "stable" when scores are within 0.1
- [ ] Trend is null when only 1 assessment of a type
- [ ] TrendChart displays correctly with 2+ data points
- [ ] TrendChart shows assessment names on hover
- [ ] SpiderChart displays latest assessment's category scores
- [ ] PDF export captures entire report
- [ ] Navigation back to /reports works
- [ ] Links to individual assessment results work

## Edge Cases

1. **Customer not found** - Return 404
2. **No completed assessments** - Show message, no charts
3. **Only 1 assessment per type** - Show table, no trend, no trend chart
4. **All assessments same score** - Trend shows "stable"
5. **Very long customer name** - Truncate in header if needed
6. **Many assessment types** - Page scrolls, all types shown
