'use client'

import { Box, Flex, Text, Grid } from '@radix-ui/themes'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'

interface AssessmentResults {
  assessmentName: string
  customerName: string
  overallScore: number
  maturityLevel: {
    level: number
    name: string
  }
  categoryScores: {
    categoryId: string
    categoryName: string
    score: number
    questionScores: {
      questionText: string
      score: number | null
      commentary: string | null
    }[]
  }[]
}

interface PDFDocumentProps {
  results: AssessmentResults
  generatedDate?: Date
}

/**
 * PDFDocument component renders assessment results in a PDF-ready format.
 * Designed for A4 paper size (210mm width) with professional styling.
 * Includes header, overall scores, spider chart, detailed category breakdowns, and footer.
 */
export function PDFDocument({ results, generatedDate = new Date() }: PDFDocumentProps) {
  return (
    <Box
      id="pdf-content"
      style={{
        width: '210mm', // A4 width
        padding: '20mm',
        backgroundColor: 'white',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Header */}
      <Flex justify="between" align="start" mb="6">
        <Box>
          <Text size="7" weight="bold" style={{ display: 'block', marginBottom: 8 }}>
            {results.assessmentName}
          </Text>
          <Text size="4" color="gray">
            {results.customerName}
          </Text>
        </Box>
        <Box style={{ textAlign: 'right' }}>
          <Text size="2" color="gray" style={{ display: 'block' }}>
            Generated: {generatedDate.toLocaleDateString()}
          </Text>
        </Box>
      </Flex>

      {/* Overall Score */}
      <Box
        mb="6"
        p="4"
        style={{
          backgroundColor: '#f8fafc',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
        }}
      >
        <Grid columns="3" gap="4">
          <Box>
            <Text size="2" color="gray" style={{ display: 'block' }}>
              Overall Score
            </Text>
            <Text size="8" weight="bold" style={{ color: getScoreColor(results.overallScore) }}>
              {results.overallScore.toFixed(1)}
            </Text>
            <Text size="3" color="gray"> / 5</Text>
          </Box>
          <Box>
            <Text size="2" color="gray" style={{ display: 'block' }}>
              Maturity Level
            </Text>
            <Text size="5" weight="bold">
              Level {results.maturityLevel.level}
            </Text>
            <Text size="3" color="gray" style={{ display: 'block' }}>
              {results.maturityLevel.name}
            </Text>
          </Box>
          <Box>
            <Text size="2" color="gray" style={{ display: 'block' }}>
              Categories Assessed
            </Text>
            <Text size="5" weight="bold">
              {results.categoryScores.length}
            </Text>
          </Box>
        </Grid>
      </Box>

      {/* Spider Chart */}
      <Box mb="6">
        <Text size="5" weight="bold" mb="4" style={{ display: 'block' }}>
          Category Scores Overview
        </Text>
        <Box style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={results.categoryScores.map((cs) => ({
                category: cs.categoryName,
                score: cs.score,
              }))}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} />
              <Radar
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Category Details */}
      <Box>
        <Text size="5" weight="bold" mb="4" style={{ display: 'block' }}>
          Detailed Results by Category
        </Text>
        {results.categoryScores.map((category) => (
          <Box
            key={category.categoryId}
            mb="4"
            style={{
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: 16,
            }}
          >
            <Flex justify="between" align="center" mb="3">
              <Text size="4" weight="bold">
                {category.categoryName}
              </Text>
              <Box
                style={{
                  backgroundColor: getScoreColor(category.score),
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 16,
                  fontSize: 14,
                  fontWeight: 'bold',
                }}
              >
                {category.score.toFixed(1)}
              </Box>
            </Flex>

            {category.questionScores.map((q, idx) => (
              <Flex
                key={idx}
                align="start"
                gap="3"
                mb="2"
                style={{ paddingLeft: 16 }}
              >
                <Box
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: q.score ? getScoreColor(q.score) : '#e2e8f0',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  {q.score || '-'}
                </Box>
                <Box style={{ flex: 1 }}>
                  <Text size="2" style={{ display: 'block' }}>
                    {q.questionText}
                  </Text>
                  {q.commentary && (
                    <Text
                      size="1"
                      color="gray"
                      style={{
                        display: 'block',
                        fontStyle: 'italic',
                        marginTop: 4,
                      }}
                    >
                      Note: {q.commentary}
                    </Text>
                  )}
                </Box>
              </Flex>
            ))}
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box
        mt="6"
        pt="4"
        style={{
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <Text size="1" color="gray">
          Generated by Assess Hub • {generatedDate.toLocaleString()}
        </Text>
      </Box>
    </Box>
  )
}

/**
 * Returns color code based on score value for visual consistency.
 * Score >= 4: Green (excellent)
 * Score >= 3: Yellow (good)
 * Score >= 2: Orange (needs improvement)
 * Score < 2: Red (critical)
 */
function getScoreColor(score: number): string {
  if (score >= 4) return '#10b981' // green
  if (score >= 3) return '#eab308' // yellow
  if (score >= 2) return '#f97316' // orange
  return '#ef4444' // red
}
