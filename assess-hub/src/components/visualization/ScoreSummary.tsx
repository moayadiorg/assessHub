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
