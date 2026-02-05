'use client'

import { Box, Flex, Text, Tooltip } from '@radix-ui/themes'

interface QuestionOption {
  id: string
  score: number
  label: string
  description: string
}

interface MaturitySelectorProps {
  options: QuestionOption[]
  selectedScore?: number
  onChange: (score: number) => void
}

export function MaturitySelector({
  options,
  selectedScore,
  onChange,
}: MaturitySelectorProps) {
  return (
    <Flex gap="2">
      {options.map((option) => {
        const isSelected = selectedScore === option.score
        const color = getScoreColor(option.score)

        return (
          <Tooltip key={option.score} content={option.description}>
            <Box
              onClick={() => onChange(option.score)}
              style={{
                flex: 1,
                padding: '12px 8px',
                borderRadius: 8,
                border: `2px solid ${isSelected ? color : 'var(--gray-4)'}`,
                backgroundColor: isSelected ? `${color}15` : 'transparent',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: isSelected ? color : 'var(--gray-3)',
                  color: isSelected ? 'white' : 'var(--gray-11)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 'bold',
                  margin: '0 auto 8px',
                }}
              >
                {option.score}
              </Box>
              <Text
                size="1"
                weight={isSelected ? 'bold' : 'medium'}
                style={{ color: isSelected ? color : 'var(--gray-11)' }}
              >
                {option.label}
              </Text>
            </Box>
          </Tooltip>
        )
      })}
    </Flex>
  )
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
