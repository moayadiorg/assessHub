'use client'

import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { Flex } from '@radix-ui/themes'
import { CategoryItem } from './CategoryItem'

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
