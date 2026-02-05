# Plan 08: Assessment Form

## Overview
Build the assessment conduct page where users answer questions with maturity level selections and optional commentary. Features category navigation, progress tracking, and auto-save.

## Dependencies
- **Plan 01**: Assessment Types API
- **Plan 02**: Categories & Questions API
- **Plan 03**: Assessments & Responses API

## Files to Create

### 1. `assess-hub/src/app/assessments/[id]/page.tsx`
Main assessment form page.

### 2. `assess-hub/src/components/assessment/CategoryNav.tsx`
Category navigation sidebar/tabs.

### 3. `assess-hub/src/components/assessment/QuestionCard.tsx`
Individual question with maturity level options.

### 4. `assess-hub/src/components/assessment/MaturitySelector.tsx`
Radio button group for 1-5 selection.

### 5. `assess-hub/src/components/assessment/ProgressBar.tsx`
Overall progress indicator.

### 6. `assess-hub/src/hooks/useAutoSave.ts`
Custom hook for auto-saving responses.

## Implementation Details

### Assessment Form Page
```tsx
// assess-hub/src/app/assessments/[id]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Flex,
  Text,
  Button,
  Card,
  Progress,
  Badge,
  ScrollArea,
} from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { CategoryNav } from '@/components/assessment/CategoryNav'
import { QuestionCard } from '@/components/assessment/QuestionCard'
import { useRouter } from 'next/navigation'
import { CheckIcon, ReloadIcon } from '@radix-ui/react-icons'

interface Assessment {
  id: string
  name: string
  customerName: string
  status: string
  assessmentType: {
    id: string
    name: string
    categories: Category[]
  }
  responsesMap: Record<string, Response>
}

interface Category {
  id: string
  name: string
  description: string | null
  order: number
  questions: Question[]
}

interface Question {
  id: string
  text: string
  description: string | null
  order: number
  options: QuestionOption[]
}

interface QuestionOption {
  id: string
  score: number
  label: string
  description: string
}

interface Response {
  id: string
  questionId: string
  score: number
  commentary: string | null
}

export default function AssessmentFormPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, Response>>({})
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    fetchAssessment()
  }, [params.id])

  async function fetchAssessment() {
    const res = await fetch(`/api/assessments/${params.id}`)
    const data = await res.json()
    setAssessment(data)
    setResponses(data.responsesMap || {})
    if (data.assessmentType.categories.length > 0) {
      setActiveCategoryId(data.assessmentType.categories[0].id)
    }
    setLoading(false)
  }

  const saveResponse = useCallback(
    async (questionId: string, score: number, commentary?: string) => {
      setSaving(true)

      // Optimistic update
      setResponses((prev) => ({
        ...prev,
        [questionId]: {
          id: prev[questionId]?.id || `temp-${questionId}`,
          questionId,
          score,
          commentary: commentary ?? prev[questionId]?.commentary ?? null,
        },
      }))

      try {
        await fetch('/api/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId: params.id,
            questionId,
            score,
            commentary,
          }),
        })
        setLastSaved(new Date())
      } catch (err) {
        console.error('Failed to save response:', err)
      } finally {
        setSaving(false)
      }
    },
    [params.id]
  )

  const saveCommentary = useCallback(
    async (questionId: string, commentary: string) => {
      const existing = responses[questionId]
      if (!existing) return // Must have a score first

      setSaving(true)
      setResponses((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], commentary },
      }))

      try {
        await fetch('/api/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId: params.id,
            questionId,
            score: existing.score,
            commentary,
          }),
        })
        setLastSaved(new Date())
      } catch (err) {
        console.error('Failed to save commentary:', err)
      } finally {
        setSaving(false)
      }
    },
    [params.id, responses]
  )

  async function handleComplete() {
    await fetch(`/api/assessments/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })
    router.push(`/assessments/${params.id}/results`)
  }

  if (loading || !assessment) {
    return (
      <Box>
        <Header title="Loading..." />
        <Flex justify="center" p="8">
          <Text>Loading assessment...</Text>
        </Flex>
      </Box>
    )
  }

  const categories = assessment.assessmentType.categories
  const activeCategory = categories.find((c) => c.id === activeCategoryId)
  const totalQuestions = categories.reduce((sum, c) => sum + c.questions.length, 0)
  const answeredQuestions = Object.keys(responses).length
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

  return (
    <Box style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        style={{
          borderBottom: '1px solid var(--gray-5)',
          backgroundColor: 'white',
        }}
      >
        <Flex justify="between" align="center" p="4">
          <Box>
            <Text size="5" weight="bold">
              {assessment.name}
            </Text>
            <Text size="2" color="gray">
              {assessment.customerName} • {assessment.assessmentType.name}
            </Text>
          </Box>

          <Flex align="center" gap="4">
            {/* Save Status */}
            <Flex align="center" gap="2">
              {saving ? (
                <>
                  <ReloadIcon className="animate-spin" />
                  <Text size="2" color="gray">Saving...</Text>
                </>
              ) : lastSaved ? (
                <>
                  <CheckIcon color="green" />
                  <Text size="2" color="gray">
                    Saved {lastSaved.toLocaleTimeString()}
                  </Text>
                </>
              ) : null}
            </Flex>

            {/* Progress */}
            <Flex align="center" gap="2" style={{ minWidth: 150 }}>
              <Progress value={progress} style={{ flex: 1 }} />
              <Text size="2" weight="medium">
                {answeredQuestions}/{totalQuestions}
              </Text>
            </Flex>

            {/* Actions */}
            <Button
              variant="soft"
              onClick={() => router.push('/assessments')}
            >
              Save & Exit
            </Button>
            <Button
              onClick={handleComplete}
              disabled={answeredQuestions < totalQuestions}
            >
              Complete Assessment
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Main Content */}
      <Flex style={{ flex: 1, overflow: 'hidden' }}>
        {/* Category Navigation */}
        <Box
          style={{
            width: 280,
            borderRight: '1px solid var(--gray-5)',
            backgroundColor: 'var(--gray-1)',
          }}
        >
          <CategoryNav
            categories={categories}
            activeCategoryId={activeCategoryId}
            onCategorySelect={setActiveCategoryId}
            responses={responses}
          />
        </Box>

        {/* Questions */}
        <ScrollArea style={{ flex: 1 }}>
          <Box p="6">
            {activeCategory && (
              <>
                <Box mb="6">
                  <Text size="6" weight="bold">
                    {activeCategory.name}
                  </Text>
                  {activeCategory.description && (
                    <Text size="3" color="gray" mt="2">
                      {activeCategory.description}
                    </Text>
                  )}
                </Box>

                <Flex direction="column" gap="4">
                  {activeCategory.questions.map((question, index) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      index={index + 1}
                      response={responses[question.id]}
                      onScoreChange={(score) =>
                        saveResponse(question.id, score)
                      }
                      onCommentaryChange={(commentary) =>
                        saveCommentary(question.id, commentary)
                      }
                    />
                  ))}
                </Flex>

                {/* Category Navigation */}
                <Flex justify="between" mt="6">
                  <Button
                    variant="soft"
                    disabled={categories.indexOf(activeCategory) === 0}
                    onClick={() => {
                      const idx = categories.indexOf(activeCategory)
                      if (idx > 0) setActiveCategoryId(categories[idx - 1].id)
                    }}
                  >
                    Previous Category
                  </Button>
                  <Button
                    variant="soft"
                    disabled={
                      categories.indexOf(activeCategory) === categories.length - 1
                    }
                    onClick={() => {
                      const idx = categories.indexOf(activeCategory)
                      if (idx < categories.length - 1)
                        setActiveCategoryId(categories[idx + 1].id)
                    }}
                  >
                    Next Category
                  </Button>
                </Flex>
              </>
            )}
          </Box>
        </ScrollArea>
      </Flex>
    </Box>
  )
}
```

### Category Navigation
```tsx
// assess-hub/src/components/assessment/CategoryNav.tsx
'use client'

import { Box, Flex, Text, ScrollArea } from '@radix-ui/themes'
import { CheckCircledIcon, CircleIcon } from '@radix-ui/react-icons'

interface Category {
  id: string
  name: string
  questions: { id: string }[]
}

interface CategoryNavProps {
  categories: Category[]
  activeCategoryId: string | null
  onCategorySelect: (id: string) => void
  responses: Record<string, any>
}

export function CategoryNav({
  categories,
  activeCategoryId,
  onCategorySelect,
  responses,
}: CategoryNavProps) {
  return (
    <ScrollArea>
      <Box p="3">
        {categories.map((category, index) => {
          const questionIds = category.questions.map((q) => q.id)
          const answeredCount = questionIds.filter((id) => responses[id]).length
          const isComplete = answeredCount === questionIds.length
          const isActive = category.id === activeCategoryId

          return (
            <Box
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              style={{
                padding: '12px',
                borderRadius: 6,
                cursor: 'pointer',
                backgroundColor: isActive ? 'var(--accent-3)' : 'transparent',
                marginBottom: 4,
              }}
            >
              <Flex align="center" gap="3">
                <Box
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: isComplete
                      ? 'var(--green-9)'
                      : isActive
                      ? 'var(--accent-9)'
                      : 'var(--gray-5)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}
                >
                  {isComplete ? <CheckCircledIcon /> : index + 1}
                </Box>
                <Box style={{ flex: 1 }}>
                  <Text
                    size="2"
                    weight={isActive ? 'bold' : 'medium'}
                    style={{ display: 'block' }}
                  >
                    {category.name}
                  </Text>
                  <Text size="1" color="gray">
                    {answeredCount}/{questionIds.length} answered
                  </Text>
                </Box>
              </Flex>
            </Box>
          )
        })}
      </Box>
    </ScrollArea>
  )
}
```

### Question Card
```tsx
// assess-hub/src/components/assessment/QuestionCard.tsx
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
```

### Maturity Selector
```tsx
// assess-hub/src/components/assessment/MaturitySelector.tsx
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
```

## Package Installation
```bash
npm install lodash.debounce
npm install -D @types/lodash.debounce
```

## Testing Checklist
- [ ] Assessment loads with all categories and questions
- [ ] Category navigation shows completion status
- [ ] Clicking category scrolls to that section
- [ ] Maturity selector shows all 5 options
- [ ] Clicking option saves response
- [ ] Tooltip shows maturity level description
- [ ] Commentary toggle shows textarea
- [ ] Commentary saves with debounce
- [ ] Progress bar updates on answer
- [ ] Save status shows saving/saved state
- [ ] Previous/Next category buttons work
- [ ] Complete button disabled until all answered
- [ ] Complete button redirects to results

## Completion Criteria
- Full assessment form with all questions
- Category navigation with progress
- Maturity level selection with descriptions
- Commentary input with auto-save
- Visual feedback for saving
- Responsive design
