'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Flex,
  Text,
  Button,
  Progress,
  ScrollArea,
} from '@radix-ui/themes'
import { CategoryNav } from '@/components/assessment/CategoryNav'
import { QuestionCard } from '@/components/assessment/QuestionCard'
import { useRouter, useParams } from 'next/navigation'
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

export default function AssessmentFormPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, Response>>({})
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    fetchAssessment()
  }, [id])

  async function fetchAssessment() {
    const res = await fetch(`/api/assessments/${id}`)
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
            assessmentId: id,
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
    [id]
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
            assessmentId: id,
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
    [id, responses]
  )

  async function handleComplete() {
    await fetch(`/api/assessments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })
    router.push(`/assessments/${id}/results`)
  }

  if (loading || !assessment) {
    return (
      <Box>
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
