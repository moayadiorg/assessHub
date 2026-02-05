# Plan 05: Admin Questions Editor UI

## Overview
Build the admin interface for managing Categories and Questions within an Assessment Type. Features a tree view with drag-and-drop reordering and inline editing.

## Dependencies
- **Plan 01**: Assessment Types API
- **Plan 02**: Categories & Questions API

## Files to Create

### 1. `assess-hub/src/app/admin/questions/[typeId]/page.tsx`
Main questions editor page with category/question tree.

### 2. `assess-hub/src/components/admin/CategoryList.tsx`
List of categories with drag handles.

### 3. `assess-hub/src/components/admin/CategoryItem.tsx`
Single category accordion with questions.

### 4. `assess-hub/src/components/admin/QuestionItem.tsx`
Question row with maturity level editing.

### 5. `assess-hub/src/components/admin/CategoryDialog.tsx`
Dialog for creating/editing category.

### 6. `assess-hub/src/components/admin/QuestionDialog.tsx`
Dialog for creating/editing question with options.

### 7. `assess-hub/src/components/admin/MaturityLevelEditor.tsx`
Form for editing the 5 maturity level descriptions.

## UI Components Required

From Radix UI:
- Accordion (for category expansion)
- Dialog (for create/edit modals)
- AlertDialog (for delete confirmations)
- TextField, TextArea
- IconButton, Button
- DropdownMenu

Additional:
- @dnd-kit/core and @dnd-kit/sortable for drag-and-drop

## Package Installation
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Implementation Details

### Questions Editor Page
```tsx
// assess-hub/src/app/admin/questions/[typeId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Box, Flex, Text, Button, Card, Spinner } from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { CategoryList } from '@/components/admin/CategoryList'
import { CategoryDialog } from '@/components/admin/CategoryDialog'
import { PlusIcon } from '@radix-ui/react-icons'

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

export default function QuestionsEditorPage({
  params,
}: {
  params: { typeId: string }
}) {
  const [assessmentType, setAssessmentType] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    fetchData()
  }, [params.typeId])

  async function fetchData() {
    const res = await fetch(`/api/assessment-types/${params.typeId}`)
    const data = await res.json()
    setAssessmentType(data)
    setCategories(data.categories || [])
    setLoading(false)
  }

  async function handleCategoryReorder(categoryIds: string[]) {
    await fetch('/api/categories/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryIds }),
    })
    fetchData()
  }

  async function handleQuestionReorder(categoryId: string, questionIds: string[]) {
    await fetch('/api/questions/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionIds }),
    })
    fetchData()
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
        <Header title="Loading..." />
        <Flex justify="center" p="8">
          <Spinner size="3" />
        </Flex>
      </Box>
    )
  }

  return (
    <Box>
      <Header title={`Questions: ${assessmentType?.name}`} />
      <Box p="6">
        <Flex justify="between" align="center" mb="6">
          <Text size="2" color="gray">
            {categories.length} categories,{' '}
            {categories.reduce((sum, c) => sum + c.questions.length, 0)} questions
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
            assessmentTypeId={params.typeId}
          />
        )}

        <CategoryDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          assessmentTypeId={params.typeId}
          category={editingCategory}
          onSuccess={fetchData}
        />
      </Box>
    </Box>
  )
}
```

### Category List with Drag-and-Drop
```tsx
// assess-hub/src/components/admin/CategoryList.tsx
'use client'

import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CategoryItem } from './CategoryItem'

interface CategoryListProps {
  categories: Category[]
  onReorder: (ids: string[]) => void
  onQuestionReorder: (categoryId: string, ids: string[]) => void
  onEditCategory: (category: Category) => void
  onRefresh: () => void
  assessmentTypeId: string
}

export function CategoryList({
  categories,
  onReorder,
  onQuestionReorder,
  onEditCategory,
  onRefresh,
  assessmentTypeId,
}: CategoryListProps) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)
    const newOrder = arrayMove(categories, oldIndex, newIndex)
    onReorder(newOrder.map((c) => c.id))
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={categories.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <Flex direction="column" gap="3">
          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              onEdit={() => onEditCategory(category)}
              onQuestionReorder={(ids) => onQuestionReorder(category.id, ids)}
              onRefresh={onRefresh}
            />
          ))}
        </Flex>
      </SortableContext>
    </DndContext>
  )
}
```

### Category Item (Accordion)
```tsx
// assess-hub/src/components/admin/CategoryItem.tsx
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
  Collapsible,
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

export function CategoryItem({
  category,
  onEdit,
  onQuestionReorder,
  onRefresh,
}) {
  const [open, setOpen] = useState(false)
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)

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
    await fetch(`/api/categories/${category.id}`, { method: 'DELETE' })
    onRefresh()
  }

  function handleAddQuestion() {
    setEditingQuestion(null)
    setQuestionDialogOpen(true)
  }

  function handleEditQuestion(question) {
    setEditingQuestion(question)
    setQuestionDialogOpen(true)
  }

  return (
    <Card ref={setNodeRef} style={style}>
      <Flex align="center" gap="2" mb={open ? '3' : '0'}>
        <IconButton
          variant="ghost"
          size="1"
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab' }}
        >
          <DragHandleDots2Icon />
        </IconButton>

        <IconButton variant="ghost" size="1" onClick={() => setOpen(!open)}>
          {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </IconButton>

        <Box style={{ flex: 1 }} onClick={() => setOpen(!open)}>
          <Text weight="bold">{category.name}</Text>
          <Text size="2" color="gray" ml="2">
            ({category.questions.length} questions)
          </Text>
        </Box>

        <IconButton variant="ghost" size="1" onClick={onEdit}>
          <Pencil1Icon />
        </IconButton>
        <IconButton variant="ghost" size="1" color="red" onClick={handleDeleteCategory}>
          <TrashIcon />
        </IconButton>
      </Flex>

      <Collapsible.Root open={open}>
        <Collapsible.Content>
          <Box pl="8">
            {category.questions.length === 0 ? (
              <Text size="2" color="gray">No questions yet</Text>
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
        </Collapsible.Content>
      </Collapsible.Root>

      <QuestionDialog
        open={questionDialogOpen}
        onOpenChange={setQuestionDialogOpen}
        categoryId={category.id}
        question={editingQuestion}
        onSuccess={onRefresh}
      />
    </Card>
  )
}
```

### Question Dialog with Maturity Levels
```tsx
// assess-hub/src/components/admin/QuestionDialog.tsx
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

const DEFAULT_OPTIONS = [
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
}) {
  const [text, setText] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(DEFAULT_OPTIONS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (question) {
      setText(question.text)
      setDescription(question.description || '')
      setOptions(question.options)
    } else {
      setText('')
      setDescription('')
      setOptions(DEFAULT_OPTIONS.map(o => ({ ...o })))
    }
  }, [question, open])

  function updateOption(index: number, field: string, value: string) {
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

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      onOpenChange(false)
      onSuccess()
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
                    <Text as="label" size="2" weight="bold">
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
                    <Text as="label" size="2" weight="bold">
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
                    <Box key={option.score} p="3" style={{ backgroundColor: 'var(--gray-2)', borderRadius: 6 }}>
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
              <Button variant="soft" color="gray">Cancel</Button>
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
```

### Category Dialog
```tsx
// assess-hub/src/components/admin/CategoryDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog, Flex, Box, Text, TextField, TextArea, Button } from '@radix-ui/themes'

export function CategoryDialog({
  open,
  onOpenChange,
  assessmentTypeId,
  category,
  onSuccess,
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (category) {
      setName(category.name)
      setDescription(category.description || '')
    } else {
      setName('')
      setDescription('')
    }
  }, [category, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const url = category
        ? `/api/categories/${category.id}`
        : '/api/categories'
      const method = category ? 'PUT' : 'POST'

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentTypeId,
          name,
          description,
        }),
      })

      onOpenChange(false)
      onSuccess()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>
          {category ? 'Edit Category' : 'Add Category'}
        </Dialog.Title>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <Box>
              <Text as="label" size="2" weight="bold">Name *</Text>
              <TextField.Root
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Infrastructure"
                required
              />
            </Box>
            <Box>
              <Text as="label" size="2" weight="bold">Description</Text>
              <TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this category"
                rows={2}
              />
            </Box>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">Cancel</Button>
            </Dialog.Close>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : category ? 'Update' : 'Create'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
```

## Testing Checklist
- [ ] Questions editor loads with assessment type name
- [ ] Categories display in correct order
- [ ] Drag-and-drop reorders categories
- [ ] Category accordion expands/collapses
- [ ] Add category dialog creates new category
- [ ] Edit category dialog pre-fills data
- [ ] Delete category removes it and questions
- [ ] Questions display within categories
- [ ] Add question dialog with maturity levels
- [ ] Edit question updates text and options
- [ ] Delete question removes it
- [ ] Maturity level tabs work correctly

## Completion Criteria
- Full tree view of categories → questions
- Drag-and-drop reordering works
- All CRUD operations for categories
- All CRUD operations for questions
- Maturity level descriptions editable
- Responsive on mobile (possibly simplified)
