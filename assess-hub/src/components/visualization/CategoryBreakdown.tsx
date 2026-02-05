'use client'

import { Box, Flex, Text, Progress } from '@radix-ui/themes'
import * as Collapsible from '@radix-ui/react-collapsible'
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
