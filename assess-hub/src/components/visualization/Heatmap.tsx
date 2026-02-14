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
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      backgroundColor: q.score
                        ? getHeatmapColor(q.score)
                        : 'var(--gray-4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: q.score && q.score >= 3 ? 'white' : 'var(--gray-11)',
                      fontSize: 13,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
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
                      width: 32,
                      height: 32,
                      borderRadius: 6,
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
                borderRadius: 4,
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
