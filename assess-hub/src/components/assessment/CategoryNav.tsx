'use client'

import { Box, Flex, Text, ScrollArea } from '@radix-ui/themes'
import { CheckCircledIcon } from '@radix-ui/react-icons'

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
