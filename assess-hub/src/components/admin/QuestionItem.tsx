'use client'

import { useState } from 'react'
import { Box, Flex, Text, IconButton, Badge } from '@radix-ui/themes'
import { Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'

interface QuestionOption {
  id: string
  score: number
  label: string
  description: string
}

interface Question {
  id: string
  text: string
  description: string | null
  order: number
  options: QuestionOption[]
}

interface QuestionItemProps {
  question: Question
  onEdit: () => void
  onRefresh: () => void
}

export function QuestionItem({ question, onEdit, onRefresh }: QuestionItemProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this question?')) return

    setDeleting(true)
    try {
      await fetch(`/api/questions/${question.id}`, { method: 'DELETE' })
      onRefresh()
    } catch (error) {
      console.error('Failed to delete question:', error)
      alert('Failed to delete question')
      setDeleting(false)
    }
  }

  return (
    <Box
      p="3"
      style={{
        backgroundColor: 'var(--gray-2)',
        borderRadius: 6,
        border: '1px solid var(--gray-4)',
      }}
    >
      <Flex align="start" gap="2" justify="between">
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium">
            {question.text}
          </Text>
          {question.description && (
            <Text size="1" color="gray" style={{ display: 'block', marginTop: 4 }}>
              {question.description}
            </Text>
          )}
          <Flex gap="1" mt="2" wrap="wrap">
            {question.options.map((option) => (
              <Badge
                key={option.id}
                size="1"
                style={{
                  backgroundColor: getScoreColor(option.score),
                  color: 'white',
                }}
              >
                {option.score}: {option.label}
              </Badge>
            ))}
          </Flex>
        </Box>
        <Flex gap="1" align="center">
          <IconButton
            variant="ghost"
            size="1"
            onClick={onEdit}
            disabled={deleting}
          >
            <Pencil1Icon />
          </IconButton>
          <IconButton
            variant="ghost"
            size="1"
            color="red"
            onClick={handleDelete}
            disabled={deleting}
          >
            <TrashIcon />
          </IconButton>
        </Flex>
      </Flex>
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
