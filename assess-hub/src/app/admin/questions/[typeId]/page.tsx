'use client'

import { useState, useEffect } from 'react'
import { Box, Flex, Text, Button, Card, Spinner } from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { CategoryList } from '@/components/admin/CategoryList'
import { CategoryDialog } from '@/components/admin/CategoryDialog'
import { PlusIcon } from '@radix-ui/react-icons'
import { useParams } from 'next/navigation'

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

interface AssessmentType {
  id: string
  name: string
  description: string | null
  version: string
  iconColor: string
  isActive: boolean
  categories: Category[]
}

export default function QuestionsEditorPage() {
  const params = useParams()
  const typeId = params.typeId as string

  const [assessmentType, setAssessmentType] = useState<AssessmentType | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    if (typeId) {
      fetchData()
    }
  }, [typeId])

  async function fetchData() {
    try {
      const res = await fetch(`/api/assessment-types/${typeId}`)
      if (!res.ok) {
        throw new Error('Failed to fetch assessment type')
      }
      const data = await res.json()
      setAssessmentType(data)
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to load assessment type')
    } finally {
      setLoading(false)
    }
  }

  async function handleCategoryReorder(categoryIds: string[]) {
    try {
      const response = await fetch('/api/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds }),
      })
      if (!response.ok) {
        throw new Error('Failed to reorder categories')
      }
      fetchData()
    } catch (error) {
      console.error('Error reordering categories:', error)
      alert('Failed to reorder categories')
    }
  }

  async function handleQuestionReorder(categoryId: string, questionIds: string[]) {
    try {
      const response = await fetch('/api/questions/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds }),
      })
      if (!response.ok) {
        throw new Error('Failed to reorder questions')
      }
      fetchData()
    } catch (error) {
      console.error('Error reordering questions:', error)
      alert('Failed to reorder questions')
    }
  }

  function handleEditCategory(category: Category) {
    setEditingCategory(category)
    setCategoryDialogOpen(true)
  }

  function handleAddCategory() {
    setEditingCategory(null)
    setCategoryDialogOpen(true)
  }

  if (loading) {
    return (
      <Box>
        <Header title="Loading..." showNewAssessment={false} />
        <Flex justify="center" p="8">
          <Spinner size="3" />
        </Flex>
      </Box>
    )
  }

  if (!assessmentType) {
    return (
      <Box>
        <Header title="Assessment Type Not Found" showNewAssessment={false} />
        <Flex justify="center" p="8">
          <Text size="4" color="red">
            Assessment type not found
          </Text>
        </Flex>
      </Box>
    )
  }

  const totalQuestions = categories.reduce((sum, c) => sum + c.questions.length, 0)

  return (
    <Box>
      <Header title={`Questions: ${assessmentType.name}`} showNewAssessment={false} />
      <Box p="6">
        <Flex justify="between" align="center" mb="6">
          <Text size="2" color="gray">
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}, {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
          </Text>
          <Button onClick={handleAddCategory}>
            <PlusIcon /> Add Category
          </Button>
        </Flex>

        {categories.length === 0 ? (
          <Card>
            <Flex direction="column" align="center" py="8">
              <Text size="4" color="gray" mb="4">
                No categories yet
              </Text>
              <Button onClick={handleAddCategory}>Add Your First Category</Button>
            </Flex>
          </Card>
        ) : (
          <CategoryList
            categories={categories}
            onReorder={handleCategoryReorder}
            onQuestionReorder={handleQuestionReorder}
            onEditCategory={handleEditCategory}
            onRefresh={fetchData}
            assessmentTypeId={typeId}
          />
        )}

        <CategoryDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          assessmentTypeId={typeId}
          category={editingCategory}
          onSuccess={fetchData}
        />
      </Box>
    </Box>
  )
}
