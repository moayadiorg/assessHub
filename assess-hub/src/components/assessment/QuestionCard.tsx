'use client'

import { useState, useCallback } from 'react'
import { Box, Card, Flex, Text, TextArea } from '@radix-ui/themes'
import { MaturitySelector } from './MaturitySelector'
import { ChatBubbleIcon } from '@radix-ui/react-icons'
import debounce from 'lodash.debounce'

interface Question {
  id: string
  text: string
  description: string | null
  options: QuestionOption[]
}

interface QuestionOption {
  id: string
  score: number
  label: string
  description: string
}

interface Response {
  score: number
  commentary: string | null
}

interface QuestionCardProps {
  question: Question
  index: number
  response?: Response
  onScoreChange: (score: number) => void
  onCommentaryChange: (commentary: string) => void
}

export function QuestionCard({
  question,
  index,
  response,
  onScoreChange,
  onCommentaryChange,
}: QuestionCardProps) {
  const [showCommentary, setShowCommentary] = useState(!!response?.commentary)
  const [commentary, setCommentary] = useState(response?.commentary || '')

  // Debounce commentary saves
  const debouncedSave = useCallback(
    debounce((value: string) => {
      onCommentaryChange(value)
    }, 500),
    [onCommentaryChange]
  )

  function handleCommentaryChange(value: string) {
    setCommentary(value)
    debouncedSave(value)
  }

  return (
    <Card>
      <Flex gap="3" mb="4">
        <Box
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: response ? 'var(--accent-9)' : 'var(--gray-4)',
            color: response ? 'white' : 'var(--gray-11)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          {index}
        </Box>
        <Box>
          <Text size="3" weight="medium">
            {question.text}
          </Text>
          {question.description && (
            <Text size="2" color="gray" mt="1" style={{ display: 'block' }}>
              {question.description}
            </Text>
          )}
        </Box>
      </Flex>

      <MaturitySelector
        options={question.options}
        selectedScore={response?.score}
        onChange={onScoreChange}
      />

      {/* Commentary Toggle & Input */}
      <Box mt="4">
        {!showCommentary ? (
          <Text
            size="2"
            color="gray"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowCommentary(true)}
          >
            <ChatBubbleIcon
              style={{ verticalAlign: 'middle', marginRight: 4 }}
            />
            Add commentary
          </Text>
        ) : (
          <Box>
            <Text size="2" weight="medium" mb="2" style={{ display: 'block' }}>
              Commentary
            </Text>
            <TextArea
              value={commentary}
              onChange={(e) => handleCommentaryChange(e.target.value)}
              placeholder="Add notes or observations..."
              rows={3}
            />
          </Box>
        )}
      </Box>
    </Card>
  )
}
