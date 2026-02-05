'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  Flex,
  Box,
  Text,
  TextField,
  TextArea,
  Button,
  Tabs,
} from '@radix-ui/themes'

interface QuestionOption {
  id?: string
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

interface QuestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId: string
  question: Question | null
  onSuccess: () => void
}

const DEFAULT_OPTIONS: QuestionOption[] = [
  { score: 1, label: 'Initial', description: '' },
  { score: 2, label: 'Managed', description: '' },
  { score: 3, label: 'Defined', description: '' },
  { score: 4, label: 'Quantitatively Managed', description: '' },
  { score: 5, label: 'Optimizing', description: '' },
]

export function QuestionDialog({
  open,
  onOpenChange,
  categoryId,
  question,
  onSuccess,
}: QuestionDialogProps) {
  const [text, setText] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState<QuestionOption[]>(DEFAULT_OPTIONS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (question) {
      setText(question.text)
      setDescription(question.description || '')
      setOptions(question.options.length > 0 ? question.options : DEFAULT_OPTIONS)
    } else {
      setText('')
      setDescription('')
      setOptions(DEFAULT_OPTIONS.map(o => ({ ...o })))
    }
  }, [question, open])

  function updateOption(index: number, field: keyof QuestionOption, value: string) {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const url = question
        ? `/api/questions/${question.id}`
        : '/api/questions'
      const method = question ? 'PUT' : 'POST'

      const body = {
        categoryId,
        text,
        description,
        options: options.map(o => ({
          id: o.id,
          label: o.label,
          description: o.description,
        })),
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error('Failed to save question')
      }

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error saving question:', error)
      alert('Failed to save question')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 600 }}>
        <Dialog.Title>
          {question ? 'Edit Question' : 'Add Question'}
        </Dialog.Title>

        <form onSubmit={handleSubmit}>
          <Tabs.Root defaultValue="question">
            <Tabs.List>
              <Tabs.Trigger value="question">Question</Tabs.Trigger>
              <Tabs.Trigger value="levels">Maturity Levels</Tabs.Trigger>
            </Tabs.List>

            <Box pt="4">
              <Tabs.Content value="question">
                <Flex direction="column" gap="4">
                  <Box>
                    <Text as="label" size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                      Question Text *
                    </Text>
                    <TextField.Root
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="e.g., How automated is your infrastructure?"
                      required
                    />
                  </Box>
                  <Box>
                    <Text as="label" size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                      Description (optional)
                    </Text>
                    <TextArea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Additional context for this question"
                      rows={2}
                    />
                  </Box>
                </Flex>
              </Tabs.Content>

              <Tabs.Content value="levels">
                <Flex direction="column" gap="3">
                  {options.map((option, index) => (
                    <Box
                      key={option.score}
                      p="3"
                      style={{
                        backgroundColor: 'var(--gray-2)',
                        borderRadius: 6,
                      }}
                    >
                      <Flex gap="2" align="center" mb="2">
                        <Box
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: getScoreColor(option.score),
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 'bold',
                          }}
                        >
                          {option.score}
                        </Box>
                        <TextField.Root
                          value={option.label}
                          onChange={(e) => updateOption(index, 'label', e.target.value)}
                          placeholder="Level name"
                          style={{ flex: 1 }}
                        />
                      </Flex>
                      <TextArea
                        value={option.description}
                        onChange={(e) => updateOption(index, 'description', e.target.value)}
                        placeholder={`What does level ${option.score} look like for this question?`}
                        rows={2}
                      />
                    </Box>
                  ))}
                </Flex>
              </Tabs.Content>
            </Box>
          </Tabs.Root>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : question ? 'Update' : 'Create'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
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
