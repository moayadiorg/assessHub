# Plan 09: Results & Visualization

## Overview
Build the results dashboard with spider/radar charts, heatmaps, and score summaries for completed assessments.

## Dependencies
- **Plan 08**: Assessment Form (needs completed assessments)

## Package Installation
```bash
npm install recharts
```

## Files to Create

### 1. `assess-hub/src/app/assessments/[id]/results/page.tsx`
Results dashboard page.

### 2. `assess-hub/src/components/visualization/SpiderChart.tsx`
Radar/spider chart for category scores.

### 3. `assess-hub/src/components/visualization/Heatmap.tsx`
Heatmap grid for all questions.

### 4. `assess-hub/src/components/visualization/ScoreSummary.tsx`
Summary cards with overall scores.

### 5. `assess-hub/src/components/visualization/MaturityBadge.tsx`
Badge showing maturity level.

### 6. `assess-hub/src/components/visualization/CategoryBreakdown.tsx`
Detailed breakdown by category.

## Implementation Details

### Results Page
```tsx
// assess-hub/src/app/assessments/[id]/results/page.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  Flex,
  Grid,
  Text,
  Button,
  Tabs,
  Badge,
} from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { SpiderChart } from '@/components/visualization/SpiderChart'
import { Heatmap } from '@/components/visualization/Heatmap'
import { ScoreSummary } from '@/components/visualization/ScoreSummary'
import { CategoryBreakdown } from '@/components/visualization/CategoryBreakdown'
import { MaturityBadge } from '@/components/visualization/MaturityBadge'
import Link from 'next/link'
import { DownloadIcon, Share1Icon, ArrowLeftIcon } from '@radix-ui/react-icons'

interface AssessmentResults {
  assessmentId: string
  assessmentName: string
  customerName: string
  status: string
  overallScore: number
  maturityLevel: {
    level: number
    name: string
  }
  categoryScores: CategoryScore[]
  totalQuestions: number
  answeredQuestions: number
}

interface CategoryScore {
  categoryId: string
  categoryName: string
  score: number
  answeredQuestions: number
  totalQuestions: number
  questionScores: {
    questionId: string
    questionText: string
    score: number | null
    commentary: string | null
  }[]
}

export default function ResultsPage({ params }: { params: { id: string } }) {
  const [results, setResults] = useState<AssessmentResults | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [params.id])

  async function fetchResults() {
    const res = await fetch(`/api/assessments/${params.id}/results`)
    const data = await res.json()
    setResults(data)
    setLoading(false)
  }

  if (loading || !results) {
    return (
      <Box>
        <Header title="Loading..." />
        <Flex justify="center" p="8">
          <Text>Loading results...</Text>
        </Flex>
      </Box>
    )
  }

  return (
    <Box>
      <Header title="Assessment Results" />
      <Box p="6">
        {/* Header */}
        <Flex justify="between" align="start" mb="6">
          <Box>
            <Button variant="ghost" asChild mb="2">
              <Link href="/assessments">
                <ArrowLeftIcon /> Back to Assessments
              </Link>
            </Button>
            <Text size="6" weight="bold" style={{ display: 'block' }}>
              {results.assessmentName}
            </Text>
            <Text size="3" color="gray">
              {results.customerName}
            </Text>
          </Box>

          <Flex gap="2">
            <Button variant="soft">
              <Share1Icon /> Share
            </Button>
            <Button>
              <DownloadIcon /> Export PDF
            </Button>
          </Flex>
        </Flex>

        {/* Summary Cards */}
        <ScoreSummary results={results} />

        {/* Charts */}
        <Grid columns={{ initial: '1', lg: '2' }} gap="6" mt="6">
          {/* Spider Chart */}
          <Card>
            <Text size="4" weight="bold" mb="4">
              Category Scores
            </Text>
            <SpiderChart categoryScores={results.categoryScores} />
          </Card>

          {/* Heatmap */}
          <Card>
            <Text size="4" weight="bold" mb="4">
              Question Heatmap
            </Text>
            <Heatmap categoryScores={results.categoryScores} />
          </Card>
        </Grid>

        {/* Category Breakdown */}
        <Card mt="6">
          <Text size="4" weight="bold" mb="4">
            Detailed Breakdown
          </Text>
          <CategoryBreakdown categoryScores={results.categoryScores} />
        </Card>
      </Box>
    </Box>
  )
}
```

### Spider Chart Component
```tsx
// assess-hub/src/components/visualization/SpiderChart.tsx
'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface CategoryScore {
  categoryId: string
  categoryName: string
  score: number
}

interface SpiderChartProps {
  categoryScores: CategoryScore[]
}

export function SpiderChart({ categoryScores }: SpiderChartProps) {
  const data = categoryScores.map((cs) => ({
    category: cs.categoryName,
    score: cs.score,
    fullMark: 5,
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid stroke="var(--gray-6)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: 'var(--gray-11)', fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          tick={{ fill: 'var(--gray-9)', fontSize: 10 }}
          tickCount={6}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="var(--accent-9)"
          fill="var(--accent-9)"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div
                  style={{
                    backgroundColor: 'white',
                    padding: '8px 12px',
                    border: '1px solid var(--gray-6)',
                    borderRadius: 6,
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{data.category}</div>
                  <div>Score: {data.score.toFixed(1)} / 5</div>
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

### Heatmap Component
```tsx
// assess-hub/src/components/visualization/Heatmap.tsx
'use client'

import { Box, Flex, Text, Tooltip } from '@radix-ui/themes'

interface CategoryScore {
  categoryId: string
  categoryName: string
  questionScores: {
    questionId: string
    questionText: string
    score: number | null
  }[]
}

interface HeatmapProps {
  categoryScores: CategoryScore[]
}

export function Heatmap({ categoryScores }: HeatmapProps) {
  const maxQuestions = Math.max(...categoryScores.map((c) => c.questionScores.length))

  return (
    <Box style={{ overflowX: 'auto' }}>
      <Flex direction="column" gap="2">
        {categoryScores.map((category) => (
          <Flex key={category.categoryId} align="center" gap="2">
            <Text
              size="2"
              style={{
                width: 120,
                flexShrink: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {category.categoryName}
            </Text>
            <Flex gap="1">
              {category.questionScores.map((q, idx) => (
                <Tooltip key={q.questionId} content={`Q${idx + 1}: ${q.questionText}`}>
                  <Box
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      backgroundColor: q.score
                        ? getHeatmapColor(q.score)
                        : 'var(--gray-4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: q.score && q.score >= 3 ? 'white' : 'var(--gray-11)',
                      fontSize: 12,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    {q.score || '-'}
                  </Box>
                </Tooltip>
              ))}
              {/* Fill empty slots */}
              {Array.from({ length: maxQuestions - category.questionScores.length }).map(
                (_, i) => (
                  <Box
                    key={`empty-${i}`}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      backgroundColor: 'var(--gray-2)',
                    }}
                  />
                )
              )}
            </Flex>
          </Flex>
        ))}
      </Flex>

      {/* Legend */}
      <Flex gap="3" mt="4" align="center">
        <Text size="2" color="gray">Legend:</Text>
        {[1, 2, 3, 4, 5].map((score) => (
          <Flex key={score} align="center" gap="1">
            <Box
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                backgroundColor: getHeatmapColor(score),
              }}
            />
            <Text size="1">{score}</Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  )
}

function getHeatmapColor(score: number): string {
  const colors: Record<number, string> = {
    1: '#ef4444', // Red
    2: '#f97316', // Orange
    3: '#eab308', // Yellow
    4: '#22c55e', // Light green
    5: '#10b981', // Green
  }
  return colors[score] || '#6b7280'
}
```

### Score Summary Component
```tsx
// assess-hub/src/components/visualization/ScoreSummary.tsx
'use client'

import { Box, Card, Flex, Grid, Text } from '@radix-ui/themes'
import { MaturityBadge } from './MaturityBadge'

interface AssessmentResults {
  overallScore: number
  maturityLevel: {
    level: number
    name: string
  }
  categoryScores: {
    score: number
    categoryName: string
  }[]
  totalQuestions: number
  answeredQuestions: number
}

interface ScoreSummaryProps {
  results: AssessmentResults
}

export function ScoreSummary({ results }: ScoreSummaryProps) {
  const lowestCategory = [...results.categoryScores].sort(
    (a, b) => a.score - b.score
  )[0]
  const highestCategory = [...results.categoryScores].sort(
    (a, b) => b.score - a.score
  )[0]

  return (
    <Grid columns={{ initial: '1', sm: '2', lg: '4' }} gap="4">
      {/* Overall Score */}
      <Card>
        <Text size="2" color="gray" mb="2" style={{ display: 'block' }}>
          Overall Maturity Score
        </Text>
        <Flex align="baseline" gap="2">
          <Text size="8" weight="bold" style={{ color: getScoreColor(results.overallScore) }}>
            {results.overallScore.toFixed(1)}
          </Text>
          <Text size="4" color="gray">/ 5</Text>
        </Flex>
        <Box mt="2">
          <MaturityBadge level={results.maturityLevel.level} name={results.maturityLevel.name} />
        </Box>
      </Card>

      {/* Completion */}
      <Card>
        <Text size="2" color="gray" mb="2" style={{ display: 'block' }}>
          Completion
        </Text>
        <Text size="8" weight="bold">
          {Math.round((results.answeredQuestions / results.totalQuestions) * 100)}%
        </Text>
        <Text size="2" color="gray" mt="2" style={{ display: 'block' }}>
          {results.answeredQuestions} of {results.totalQuestions} questions
        </Text>
      </Card>

      {/* Highest Category */}
      <Card>
        <Text size="2" color="gray" mb="2" style={{ display: 'block' }}>
          Strongest Area
        </Text>
        <Text size="5" weight="bold" style={{ color: 'var(--green-11)' }}>
          {highestCategory.categoryName}
        </Text>
        <Text size="4" color="gray" mt="1" style={{ display: 'block' }}>
          Score: {highestCategory.score.toFixed(1)}
        </Text>
      </Card>

      {/* Lowest Category */}
      <Card>
        <Text size="2" color="gray" mb="2" style={{ display: 'block' }}>
          Area for Improvement
        </Text>
        <Text size="5" weight="bold" style={{ color: 'var(--red-11)' }}>
          {lowestCategory.categoryName}
        </Text>
        <Text size="4" color="gray" mt="1" style={{ display: 'block' }}>
          Score: {lowestCategory.score.toFixed(1)}
        </Text>
      </Card>
    </Grid>
  )
}

function getScoreColor(score: number): string {
  if (score >= 4) return 'var(--green-11)'
  if (score >= 3) return 'var(--yellow-11)'
  if (score >= 2) return 'var(--orange-11)'
  return 'var(--red-11)'
}
```

### Maturity Badge Component
```tsx
// assess-hub/src/components/visualization/MaturityBadge.tsx
'use client'

import { Badge } from '@radix-ui/themes'

interface MaturityBadgeProps {
  level: number
  name: string
}

export function MaturityBadge({ level, name }: MaturityBadgeProps) {
  const colorMap: Record<number, 'red' | 'orange' | 'yellow' | 'green' | 'teal'> = {
    1: 'red',
    2: 'orange',
    3: 'yellow',
    4: 'green',
    5: 'teal',
  }

  return (
    <Badge size="2" color={colorMap[level] || 'gray'}>
      Level {level}: {name}
    </Badge>
  )
}
```

### Category Breakdown Component
```tsx
// assess-hub/src/components/visualization/CategoryBreakdown.tsx
'use client'

import { Box, Flex, Text, Progress, Collapsible } from '@radix-ui/themes'
import { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons'

interface CategoryScore {
  categoryId: string
  categoryName: string
  score: number
  answeredQuestions: number
  totalQuestions: number
  questionScores: {
    questionId: string
    questionText: string
    score: number | null
    commentary: string | null
  }[]
}

interface CategoryBreakdownProps {
  categoryScores: CategoryScore[]
}

export function CategoryBreakdown({ categoryScores }: CategoryBreakdownProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  function toggleCategory(id: string) {
    const next = new Set(expandedCategories)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setExpandedCategories(next)
  }

  return (
    <Flex direction="column" gap="3">
      {categoryScores.map((category) => {
        const isExpanded = expandedCategories.has(category.categoryId)

        return (
          <Box
            key={category.categoryId}
            style={{
              border: '1px solid var(--gray-5)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {/* Category Header */}
            <Flex
              align="center"
              gap="3"
              p="3"
              style={{
                cursor: 'pointer',
                backgroundColor: 'var(--gray-2)',
              }}
              onClick={() => toggleCategory(category.categoryId)}
            >
              {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
              <Text weight="bold" style={{ flex: 1 }}>
                {category.categoryName}
              </Text>
              <Flex align="center" gap="3" style={{ minWidth: 200 }}>
                <Progress
                  value={(category.score / 5) * 100}
                  style={{ flex: 1 }}
                  color={getProgressColor(category.score)}
                />
                <Text size="3" weight="bold" style={{ width: 40, textAlign: 'right' }}>
                  {category.score.toFixed(1)}
                </Text>
              </Flex>
            </Flex>

            {/* Questions */}
            <Collapsible.Root open={isExpanded}>
              <Collapsible.Content>
                <Box p="3">
                  {category.questionScores.map((q, idx) => (
                    <Flex
                      key={q.questionId}
                      align="start"
                      gap="3"
                      py="2"
                      style={{
                        borderBottom:
                          idx < category.questionScores.length - 1
                            ? '1px solid var(--gray-4)'
                            : 'none',
                      }}
                    >
                      <Box
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: q.score
                            ? getScoreColor(q.score)
                            : 'var(--gray-4)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 'bold',
                          flexShrink: 0,
                        }}
                      >
                        {q.score || '-'}
                      </Box>
                      <Box style={{ flex: 1 }}>
                        <Text size="2">{q.questionText}</Text>
                        {q.commentary && (
                          <Text
                            size="2"
                            color="gray"
                            mt="1"
                            style={{
                              display: 'block',
                              fontStyle: 'italic',
                            }}
                          >
                            "{q.commentary}"
                          </Text>
                        )}
                      </Box>
                    </Flex>
                  ))}
                </Box>
              </Collapsible.Content>
            </Collapsible.Root>
          </Box>
        )
      })}
    </Flex>
  )
}

function getProgressColor(score: number): 'red' | 'orange' | 'yellow' | 'green' {
  if (score >= 4) return 'green'
  if (score >= 3) return 'yellow'
  if (score >= 2) return 'orange'
  return 'red'
}

function getScoreColor(score: number): string {
  const colors: Record<number, string> = {
    1: '#ef4444',
    2: '#f97316',
    3: '#eab308',
    4: '#22c55e',
    5: '#10b981',
  }
  return colors[score] || '#6b7280'
}
```

## Testing Checklist
- [ ] Results page loads with assessment data
- [ ] Spider chart renders all categories
- [ ] Spider chart tooltips show scores
- [ ] Heatmap renders all questions
- [ ] Heatmap colors match scores
- [ ] Heatmap tooltips show question text
- [ ] Summary cards show correct values
- [ ] Strongest/weakest areas correct
- [ ] Maturity badge shows correct level
- [ ] Category breakdown expandable
- [ ] Commentary displays in breakdown
- [ ] Share button (placeholder)
- [ ] Export PDF button (placeholder for Plan 10)

## Completion Criteria
- Spider/radar chart with all category scores
- Heatmap grid with color-coded questions
- Summary cards with key metrics
- Detailed breakdown with expandable categories
- Responsive layout
- Proper color coding for scores
