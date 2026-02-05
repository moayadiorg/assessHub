'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Box,
  Card,
  Flex,
  Text,
  IconButton,
  Button,
} from '@radix-ui/themes'
import {
  DragHandleDots2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  Pencil1Icon,
  PlusIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { QuestionItem } from './QuestionItem'
import { QuestionDialog } from './QuestionDialog'

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

interface Category {
  id: string
  name: string
  description: string | null
  order: number
  questions: Question[]
}

interface CategoryItemProps {
  category: Category
  onEdit: () => void
  onQuestionReorder: (ids: string[]) => void
  onRefresh: () => void
}

export function CategoryItem({
  category,
  onEdit,
  onQuestionReorder,
  onRefresh,
}: CategoryItemProps) {
  const [open, setOpen] = useState(false)
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [deleting, setDeleting] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  async function handleDeleteCategory() {
    if (!confirm('Delete this category and all its questions?')) return

    setDeleting(true)
    try {
      await fetch(`/api/categories/${category.id}`, { method: 'DELETE' })
      onRefresh()
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category')
      setDeleting(false)
    }
  }

  function handleAddQuestion() {
    setEditingQuestion(null)
    setQuestionDialogOpen(true)
  }

  function handleEditQuestion(question: Question) {
    setEditingQuestion(question)
    setQuestionDialogOpen(true)
  }

  return (
    <>
      <Card ref={setNodeRef} style={style}>
        <Flex align="center" gap="2" mb={open ? '3' : '0'}>
          <IconButton
            variant="ghost"
            size="1"
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab' }}
            disabled={deleting}
          >
            <DragHandleDots2Icon />
          </IconButton>

          <IconButton
            variant="ghost"
            size="1"
            onClick={() => setOpen(!open)}
            disabled={deleting}
          >
            {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </IconButton>

          <Box
            style={{ flex: 1, cursor: 'pointer' }}
            onClick={() => setOpen(!open)}
          >
            <Flex align="center" gap="2">
              <Text weight="bold">{category.name}</Text>
              <Text size="2" color="gray">
                ({category.questions.length} question{category.questions.length !== 1 ? 's' : ''})
              </Text>
            </Flex>
          </Box>

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
            onClick={handleDeleteCategory}
            disabled={deleting}
          >
            <TrashIcon />
          </IconButton>
        </Flex>

        {open && (
          <Box pl="8">
            {category.questions.length === 0 ? (
              <Text size="2" color="gray" style={{ display: 'block', marginBottom: 12 }}>
                No questions yet
              </Text>
            ) : (
              <Flex direction="column" gap="2" mb="3">
                {category.questions.map((question) => (
                  <QuestionItem
                    key={question.id}
                    question={question}
                    onEdit={() => handleEditQuestion(question)}
                    onRefresh={onRefresh}
                  />
                ))}
              </Flex>
            )}
            <Button size="1" variant="soft" onClick={handleAddQuestion}>
              <PlusIcon /> Add Question
            </Button>
          </Box>
        )}
      </Card>

      <QuestionDialog
        open={questionDialogOpen}
        onOpenChange={setQuestionDialogOpen}
        categoryId={category.id}
        question={editingQuestion}
        onSuccess={onRefresh}
      />
    </>
  )
}
