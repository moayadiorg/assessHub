# Plan 02: Categories & Questions API

## Overview
Implement CRUD API endpoints for Categories and Questions, including the nested QuestionOptions for maturity levels.

## Dependencies
- None (can start immediately)

## Files to Create

### Categories API

#### 1. `assess-hub/src/app/api/categories/route.ts`
```typescript
// GET /api/categories?typeId=xxx
// - Returns categories for a specific assessment type
// - Ordered by 'order' field

// POST /api/categories
// - Creates new category
// - Body: { assessmentTypeId, name, description?, order }
```

#### 2. `assess-hub/src/app/api/categories/[id]/route.ts`
```typescript
// GET /api/categories/[id]
// - Returns category with questions

// PUT /api/categories/[id]
// - Updates category
// - Body: { name?, description?, order? }

// DELETE /api/categories/[id]
// - Deletes category and all its questions (cascade)
```

#### 3. `assess-hub/src/app/api/categories/reorder/route.ts`
```typescript
// PUT /api/categories/reorder
// - Bulk update category order
// - Body: { categoryIds: string[] } (in new order)
```

### Questions API

#### 4. `assess-hub/src/app/api/questions/route.ts`
```typescript
// GET /api/questions?categoryId=xxx
// - Returns questions for a category with options

// POST /api/questions
// - Creates question with its 5 maturity level options
// - Body: { categoryId, text, description?, order, options: [...] }
```

#### 5. `assess-hub/src/app/api/questions/[id]/route.ts`
```typescript
// GET /api/questions/[id]
// - Returns single question with options

// PUT /api/questions/[id]
// - Updates question and/or its options
// - Body: { text?, description?, order?, options?: [...] }

// DELETE /api/questions/[id]
// - Deletes question and its options (cascade)
```

#### 6. `assess-hub/src/app/api/questions/reorder/route.ts`
```typescript
// PUT /api/questions/reorder
// - Bulk update question order within category
// - Body: { questionIds: string[] }
```

## Implementation Details

### Categories

#### GET /api/categories
```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const typeId = searchParams.get('typeId')

  if (!typeId) {
    return NextResponse.json(
      { error: 'typeId query parameter is required' },
      { status: 400 }
    )
  }

  const categories = await prisma.category.findMany({
    where: { assessmentTypeId: typeId },
    include: {
      _count: { select: { questions: true } }
    },
    orderBy: { order: 'asc' }
  })

  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  const body = await request.json()

  if (!body.assessmentTypeId || !body.name?.trim()) {
    return NextResponse.json(
      { error: 'assessmentTypeId and name are required' },
      { status: 400 }
    )
  }

  // Get next order number if not provided
  let order = body.order
  if (order === undefined) {
    const maxOrder = await prisma.category.aggregate({
      where: { assessmentTypeId: body.assessmentTypeId },
      _max: { order: true }
    })
    order = (maxOrder._max.order ?? 0) + 1
  }

  const category = await prisma.category.create({
    data: {
      assessmentTypeId: body.assessmentTypeId,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      order,
    }
  })

  return NextResponse.json(category, { status: 201 })
}
```

#### PUT /api/categories/[id]
```typescript
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const existing = await prisma.category.findUnique({
    where: { id: params.id }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Category not found' },
      { status: 404 }
    )
  }

  const updated = await prisma.category.update({
    where: { id: params.id },
    data: {
      name: body.name?.trim() ?? existing.name,
      description: body.description !== undefined
        ? body.description?.trim() || null
        : existing.description,
      order: body.order ?? existing.order,
    }
  })

  return NextResponse.json(updated)
}
```

#### PUT /api/categories/reorder
```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  const { categoryIds } = await request.json()

  if (!Array.isArray(categoryIds)) {
    return NextResponse.json(
      { error: 'categoryIds array is required' },
      { status: 400 }
    )
  }

  // Update all in a transaction
  await prisma.$transaction(
    categoryIds.map((id, index) =>
      prisma.category.update({
        where: { id },
        data: { order: index + 1 }
      })
    )
  )

  return NextResponse.json({ success: true })
}
```

### Questions

#### POST /api/questions
```typescript
export async function POST(request: Request) {
  const body = await request.json()

  if (!body.categoryId || !body.text?.trim()) {
    return NextResponse.json(
      { error: 'categoryId and text are required' },
      { status: 400 }
    )
  }

  // Validate options - must have 5 levels
  if (!body.options || body.options.length !== 5) {
    return NextResponse.json(
      { error: 'Exactly 5 options (maturity levels 1-5) are required' },
      { status: 400 }
    )
  }

  // Get next order if not provided
  let order = body.order
  if (order === undefined) {
    const maxOrder = await prisma.question.aggregate({
      where: { categoryId: body.categoryId },
      _max: { order: true }
    })
    order = (maxOrder._max.order ?? 0) + 1
  }

  const question = await prisma.question.create({
    data: {
      categoryId: body.categoryId,
      text: body.text.trim(),
      description: body.description?.trim() || null,
      order,
      options: {
        create: body.options.map((opt: any, idx: number) => ({
          score: idx + 1,
          label: opt.label || getDefaultLabel(idx + 1),
          description: opt.description || '',
        }))
      }
    },
    include: {
      options: { orderBy: { score: 'asc' } }
    }
  })

  return NextResponse.json(question, { status: 201 })
}

function getDefaultLabel(score: number): string {
  const labels: Record<number, string> = {
    1: 'Initial',
    2: 'Managed',
    3: 'Defined',
    4: 'Quantitatively Managed',
    5: 'Optimizing'
  }
  return labels[score] || `Level ${score}`
}
```

#### PUT /api/questions/[id]
```typescript
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const existing = await prisma.question.findUnique({
    where: { id: params.id },
    include: { options: true }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Question not found' },
      { status: 404 }
    )
  }

  // Update question and options in transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Update question fields
    const question = await tx.question.update({
      where: { id: params.id },
      data: {
        text: body.text?.trim() ?? existing.text,
        description: body.description !== undefined
          ? body.description?.trim() || null
          : existing.description,
        order: body.order ?? existing.order,
      }
    })

    // Update options if provided
    if (body.options && Array.isArray(body.options)) {
      for (const opt of body.options) {
        if (opt.id) {
          await tx.questionOption.update({
            where: { id: opt.id },
            data: {
              label: opt.label,
              description: opt.description,
            }
          })
        }
      }
    }

    return tx.question.findUnique({
      where: { id: params.id },
      include: { options: { orderBy: { score: 'asc' } } }
    })
  })

  return NextResponse.json(updated)
}
```

## Request/Response Types

```typescript
// assess-hub/src/types/api.ts

export interface CategoryInput {
  assessmentTypeId: string
  name: string
  description?: string
  order?: number
}

export interface QuestionInput {
  categoryId: string
  text: string
  description?: string
  order?: number
  options: {
    label?: string
    description: string
  }[]
}

export interface QuestionOptionInput {
  id?: string  // For updates
  label: string
  description: string
}
```

## Testing Checklist

### Categories
- [ ] GET /api/categories requires typeId parameter
- [ ] GET returns categories ordered by 'order' field
- [ ] POST creates category with auto-incrementing order
- [ ] PUT updates only specified fields
- [ ] DELETE removes category and cascades to questions
- [ ] PUT /api/categories/reorder updates order correctly

### Questions
- [ ] GET /api/questions requires categoryId parameter
- [ ] GET returns questions with their options
- [ ] POST requires exactly 5 options
- [ ] POST creates question with default labels if not provided
- [ ] PUT updates question text/description
- [ ] PUT updates options when provided
- [ ] DELETE removes question and its options

## Completion Criteria
- All endpoints implemented with proper error handling
- Cascade deletes working correctly
- Reorder endpoints update all affected records atomically
- Options always returned ordered by score (1-5)
