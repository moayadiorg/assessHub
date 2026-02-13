'use client'

import { useState } from 'react'
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
  const [showGuide, setShowGuide] = useState(false)

  const selectedOption = options.find((o) => o.score === selectedScore)
  const selectedColor = selectedOption
    ? getScoreColor(selectedOption.score)
    : undefined

  return (
    <Box>
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

      {selectedOption && selectedColor && (
        <Box
          mt="3"
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            borderLeft: `3px solid ${selectedColor}`,
            backgroundColor: `${selectedColor}08`,
          }}
        >
          <Text
            size="1"
            weight="bold"
            style={{
              color: selectedColor,
              display: 'block',
              marginBottom: 4,
            }}
          >
            {selectedOption.score} &mdash; {selectedOption.label}
          </Text>
          <Text size="2" style={{ lineHeight: 1.5 }}>
            {selectedOption.description}
          </Text>
        </Box>
      )}

      <Box
        mt="2"
        onClick={() => setShowGuide(!showGuide)}
        style={{
          cursor: 'pointer',
          padding: '4px 0',
          userSelect: 'none',
        }}
      >
        <Text size="1" color="gray">
          <span
            style={{
              display: 'inline-block',
              fontSize: 10,
              marginRight: 6,
              transition: 'transform 0.15s ease',
              transform: showGuide ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          >
            &#9654;
          </span>
          View assessment guide
        </Text>
      </Box>

      {showGuide && (
        <Flex direction="column" gap="1" mt="1">
          {options.map((option) => {
            const isActive = selectedScore === option.score
            const color = getScoreColor(option.score)
            const activeBg = `${color}10`

            return (
              <Flex
                key={option.score}
                align="start"
                gap="3"
                onClick={() => onChange(option.score)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  backgroundColor: isActive ? activeBg : 'transparent',
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.backgroundColor = 'var(--gray-2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isActive
                    ? activeBg
                    : 'transparent'
                }}
              >
                <Box
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 'bold',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {option.score}
                </Box>
                <Box style={{ flex: 1 }}>
                  <Text size="2" weight="bold" style={{ marginRight: 8 }}>
                    {option.label}
                  </Text>
                  <Text size="2" color="gray" style={{ lineHeight: 1.5 }}>
                    {option.description}
                  </Text>
                </Box>
              </Flex>
            )
          })}
        </Flex>
      )}
    </Box>
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
