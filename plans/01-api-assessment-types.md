# Plan 01: Assessment Types API

## Overview
Implement CRUD API endpoints for Assessment Types - the templates that define the structure of assessments.

## Dependencies
- None (can start immediately)

## Files to Create

### 1. `assess-hub/src/app/api/assessment-types/route.ts`
Handles GET (list) and POST (create) for assessment types.

```typescript
// GET /api/assessment-types
// - Returns all assessment types
// - Query params: ?active=true (filter by isActive)
// - Include category count for each type

// POST /api/assessment-types
// - Creates new assessment type
// - Body: { name, description?, version?, iconColor? }
// - Returns created type with id
```

### 2. `assess-hub/src/app/api/assessment-types/[id]/route.ts`
Handles GET (single), PUT (update), DELETE for specific assessment type.

```typescript
// GET /api/assessment-types/[id]
// - Returns assessment type with full structure
// - Include categories with their questions and options

// PUT /api/assessment-types/[id]
// - Updates assessment type metadata
// - Body: { name?, description?, version?, iconColor?, isActive? }

// DELETE /api/assessment-types/[id]
// - Soft delete (set isActive = false) or hard delete
// - Check for existing assessments before hard delete
```

## Implementation Details

### GET /api/assessment-types
```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') === 'true'

  const types = await prisma.assessmentType.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    include: {
      _count: {
        select: { categories: true, assessments: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(types)
}
```

### POST /api/assessment-types
```typescript
export async function POST(request: Request) {
  const body = await request.json()

  // Validate required fields
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 }
    )
  }

  const type = await prisma.assessmentType.create({
    data: {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      version: body.version || '1.0',
      iconColor: body.iconColor || '#3b82f6',
    }
  })

  return NextResponse.json(type, { status: 201 })
}
```

### GET /api/assessment-types/[id]
```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const type = await prisma.assessmentType.findUnique({
    where: { id: params.id },
    include: {
      categories: {
        orderBy: { order: 'asc' },
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: {
              options: {
                orderBy: { score: 'asc' }
              }
            }
          }
        }
      }
    }
  })

  if (!type) {
    return NextResponse.json(
      { error: 'Assessment type not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(type)
}
```

### PUT /api/assessment-types/[id]
```typescript
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  // Check exists
  const existing = await prisma.assessmentType.findUnique({
    where: { id: params.id }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Assessment type not found' },
      { status: 404 }
    )
  }

  const updated = await prisma.assessmentType.update({
    where: { id: params.id },
    data: {
      name: body.name?.trim() ?? existing.name,
      description: body.description !== undefined
        ? body.description?.trim() || null
        : existing.description,
      version: body.version ?? existing.version,
      iconColor: body.iconColor ?? existing.iconColor,
      isActive: body.isActive ?? existing.isActive,
    }
  })

  return NextResponse.json(updated)
}
```

### DELETE /api/assessment-types/[id]
```typescript
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check for existing assessments
  const assessmentCount = await prisma.assessment.count({
    where: { assessmentTypeId: params.id }
  })

  if (assessmentCount > 0) {
    // Soft delete - mark as inactive
    const updated = await prisma.assessmentType.update({
      where: { id: params.id },
      data: { isActive: false }
    })
    return NextResponse.json({
      ...updated,
      _note: 'Soft deleted due to existing assessments'
    })
  }

  // Hard delete
  await prisma.assessmentType.delete({
    where: { id: params.id }
  })

  return NextResponse.json({ success: true })
}
```

## Validation Schema (optional enhancement)
Create `assess-hub/src/lib/validations/assessment-type.ts`:
```typescript
export interface CreateAssessmentTypeInput {
  name: string
  description?: string
  version?: string
  iconColor?: string
}

export interface UpdateAssessmentTypeInput {
  name?: string
  description?: string | null
  version?: string
  iconColor?: string
  isActive?: boolean
}

export function validateCreateInput(input: unknown): CreateAssessmentTypeInput {
  // Add zod or manual validation
}
```

## Testing Checklist
- [ ] GET /api/assessment-types returns array of types
- [ ] GET /api/assessment-types?active=true filters correctly
- [ ] POST creates new type with all fields
- [ ] POST returns 400 for missing name
- [ ] GET /api/assessment-types/[id] returns full nested structure
- [ ] GET /api/assessment-types/[id] returns 404 for invalid id
- [ ] PUT updates specified fields only
- [ ] DELETE soft deletes when assessments exist
- [ ] DELETE hard deletes when no assessments

## Completion Criteria
- All 5 endpoints implemented and working
- Error handling for 400, 404 cases
- Proper TypeScript types
- Prisma queries optimized (include only needed relations)
