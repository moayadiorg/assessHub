# Plan 03: Assessments & Responses API

## Overview
Implement CRUD API endpoints for Assessments (customer engagement instances) and Responses (answers to questions).

## Dependencies
- None (can start immediately)

## Files to Create

### Assessments API

#### 1. `assess-hub/src/app/api/assessments/route.ts`
```typescript
// GET /api/assessments
// - List all assessments with filters
// - Query: ?status=draft|in-progress|completed
// - Query: ?typeId=xxx
// - Query: ?search=term (searches name, customerName)

// POST /api/assessments
// - Create new assessment
// - Body: { name, customerName, assessmentTypeId, createdBy }
```

#### 2. `assess-hub/src/app/api/assessments/[id]/route.ts`
```typescript
// GET /api/assessments/[id]
// - Returns assessment with all responses
// - Includes assessment type structure for form rendering

// PUT /api/assessments/[id]
// - Update assessment metadata
// - Body: { name?, customerName?, status? }

// DELETE /api/assessments/[id]
// - Delete assessment and all responses
```

#### 3. `assess-hub/src/app/api/assessments/[id]/results/route.ts`
```typescript
// GET /api/assessments/[id]/results
// - Returns computed scores for visualization
// - Category scores, overall score, maturity level
```

### Responses API

#### 4. `assess-hub/src/app/api/responses/route.ts`
```typescript
// POST /api/responses
// - Upsert single response (create or update)
// - Body: { assessmentId, questionId, score, commentary? }
// - Used for auto-save on answer change
```

#### 5. `assess-hub/src/app/api/responses/bulk/route.ts`
```typescript
// PUT /api/responses/bulk
// - Bulk save multiple responses
// - Body: { assessmentId, responses: [{ questionId, score, commentary? }] }
```

## Implementation Details

### Assessments

#### GET /api/assessments
```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const typeId = searchParams.get('typeId')
  const search = searchParams.get('search')

  const where: any = {}

  if (status) {
    where.status = status
  }

  if (typeId) {
    where.assessmentTypeId = typeId
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { customerName: { contains: search } }
    ]
  }

  const assessments = await prisma.assessment.findMany({
    where,
    include: {
      assessmentType: {
        select: { id: true, name: true, iconColor: true }
      },
      _count: {
        select: { responses: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  // Add question count for progress calculation
  const enriched = await Promise.all(
    assessments.map(async (assessment) => {
      const totalQuestions = await prisma.question.count({
        where: {
          category: {
            assessmentTypeId: assessment.assessmentTypeId
          }
        }
      })
      return {
        ...assessment,
        totalQuestions,
        answeredQuestions: assessment._count.responses
      }
    })
  )

  return NextResponse.json(enriched)
}

export async function POST(request: Request) {
  const body = await request.json()

  // Validate required fields
  const required = ['name', 'customerName', 'assessmentTypeId', 'createdBy']
  for (const field of required) {
    if (!body[field]?.trim()) {
      return NextResponse.json(
        { error: `${field} is required` },
        { status: 400 }
      )
    }
  }

  // Verify assessment type exists
  const typeExists = await prisma.assessmentType.findUnique({
    where: { id: body.assessmentTypeId }
  })

  if (!typeExists) {
    return NextResponse.json(
      { error: 'Assessment type not found' },
      { status: 400 }
    )
  }

  const assessment = await prisma.assessment.create({
    data: {
      name: body.name.trim(),
      customerName: body.customerName.trim(),
      assessmentTypeId: body.assessmentTypeId,
      createdBy: body.createdBy.trim(),
      status: 'draft'
    },
    include: {
      assessmentType: true
    }
  })

  return NextResponse.json(assessment, { status: 201 })
}
```

#### GET /api/assessments/[id]
```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      assessmentType: {
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
      },
      responses: true
    }
  })

  if (!assessment) {
    return NextResponse.json(
      { error: 'Assessment not found' },
      { status: 404 }
    )
  }

  // Convert responses to a map for easier lookup
  const responsesMap = assessment.responses.reduce((acc, r) => {
    acc[r.questionId] = r
    return acc
  }, {} as Record<string, typeof assessment.responses[0]>)

  return NextResponse.json({
    ...assessment,
    responsesMap
  })
}
```

#### PUT /api/assessments/[id]
```typescript
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const existing = await prisma.assessment.findUnique({
    where: { id: params.id }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Assessment not found' },
      { status: 404 }
    )
  }

  // Validate status transition
  const validStatuses = ['draft', 'in-progress', 'completed']
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: 'Invalid status' },
      { status: 400 }
    )
  }

  const updated = await prisma.assessment.update({
    where: { id: params.id },
    data: {
      name: body.name?.trim() ?? existing.name,
      customerName: body.customerName?.trim() ?? existing.customerName,
      status: body.status ?? existing.status,
    },
    include: {
      assessmentType: true
    }
  })

  return NextResponse.json(updated)
}
```

#### GET /api/assessments/[id]/results
```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      responses: true,
      assessmentType: {
        include: {
          categories: {
            orderBy: { order: 'asc' },
            include: {
              questions: {
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      }
    }
  })

  if (!assessment) {
    return NextResponse.json(
      { error: 'Assessment not found' },
      { status: 404 }
    )
  }

  // Build responses map
  const responsesMap = new Map(
    assessment.responses.map(r => [r.questionId, r])
  )

  // Calculate category scores
  const categoryScores = assessment.assessmentType.categories.map(category => {
    const questionIds = category.questions.map(q => q.id)
    const responses = questionIds
      .map(id => responsesMap.get(id))
      .filter(Boolean)

    const totalScore = responses.reduce((sum, r) => sum + r!.score, 0)
    const avgScore = responses.length > 0
      ? Math.round((totalScore / responses.length) * 10) / 10
      : 0

    return {
      categoryId: category.id,
      categoryName: category.name,
      score: avgScore,
      answeredQuestions: responses.length,
      totalQuestions: questionIds.length,
      questionScores: category.questions.map(q => ({
        questionId: q.id,
        questionText: q.text,
        score: responsesMap.get(q.id)?.score ?? null,
        commentary: responsesMap.get(q.id)?.commentary ?? null
      }))
    }
  })

  // Calculate overall score
  const validCategories = categoryScores.filter(c => c.answeredQuestions > 0)
  const overallScore = validCategories.length > 0
    ? Math.round(
        (validCategories.reduce((sum, c) => sum + c.score, 0) / validCategories.length) * 10
      ) / 10
    : 0

  // Determine maturity level
  const maturityLevel = getMaturityLevel(overallScore)

  return NextResponse.json({
    assessmentId: assessment.id,
    assessmentName: assessment.name,
    customerName: assessment.customerName,
    status: assessment.status,
    overallScore,
    maturityLevel,
    categoryScores,
    totalQuestions: categoryScores.reduce((sum, c) => sum + c.totalQuestions, 0),
    answeredQuestions: categoryScores.reduce((sum, c) => sum + c.answeredQuestions, 0)
  })
}

function getMaturityLevel(score: number): { level: number; name: string } {
  if (score >= 4.5) return { level: 5, name: 'Optimizing' }
  if (score >= 3.5) return { level: 4, name: 'Quantitatively Managed' }
  if (score >= 2.5) return { level: 3, name: 'Defined' }
  if (score >= 1.5) return { level: 2, name: 'Managed' }
  return { level: 1, name: 'Initial' }
}
```

### Responses

#### POST /api/responses (Upsert)
```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()

  if (!body.assessmentId || !body.questionId || body.score === undefined) {
    return NextResponse.json(
      { error: 'assessmentId, questionId, and score are required' },
      { status: 400 }
    )
  }

  // Validate score range
  if (body.score < 1 || body.score > 5) {
    return NextResponse.json(
      { error: 'Score must be between 1 and 5' },
      { status: 400 }
    )
  }

  // Upsert response
  const response = await prisma.response.upsert({
    where: {
      assessmentId_questionId: {
        assessmentId: body.assessmentId,
        questionId: body.questionId
      }
    },
    update: {
      score: body.score,
      commentary: body.commentary ?? null
    },
    create: {
      assessmentId: body.assessmentId,
      questionId: body.questionId,
      score: body.score,
      commentary: body.commentary ?? null
    }
  })

  // Auto-update assessment status to in-progress if draft
  await prisma.assessment.updateMany({
    where: {
      id: body.assessmentId,
      status: 'draft'
    },
    data: {
      status: 'in-progress'
    }
  })

  return NextResponse.json(response)
}
```

#### PUT /api/responses/bulk
```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  const body = await request.json()

  if (!body.assessmentId || !Array.isArray(body.responses)) {
    return NextResponse.json(
      { error: 'assessmentId and responses array are required' },
      { status: 400 }
    )
  }

  // Validate all scores
  for (const r of body.responses) {
    if (r.score < 1 || r.score > 5) {
      return NextResponse.json(
        { error: `Invalid score for question ${r.questionId}` },
        { status: 400 }
      )
    }
  }

  // Bulk upsert in transaction
  const results = await prisma.$transaction(
    body.responses.map((r: any) =>
      prisma.response.upsert({
        where: {
          assessmentId_questionId: {
            assessmentId: body.assessmentId,
            questionId: r.questionId
          }
        },
        update: {
          score: r.score,
          commentary: r.commentary ?? null
        },
        create: {
          assessmentId: body.assessmentId,
          questionId: r.questionId,
          score: r.score,
          commentary: r.commentary ?? null
        }
      })
    )
  )

  // Update assessment status
  await prisma.assessment.updateMany({
    where: {
      id: body.assessmentId,
      status: 'draft'
    },
    data: {
      status: 'in-progress'
    }
  })

  return NextResponse.json({
    success: true,
    count: results.length
  })
}
```

## Response Types

```typescript
// assess-hub/src/types/api.ts

export interface AssessmentResults {
  assessmentId: string
  assessmentName: string
  customerName: string
  status: string
  overallScore: number
  maturityLevel: {
    level: number
    name: string
  }
  categoryScores: CategoryScore[]
  totalQuestions: number
  answeredQuestions: number
}

export interface CategoryScore {
  categoryId: string
  categoryName: string
  score: number
  answeredQuestions: number
  totalQuestions: number
  questionScores: {
    questionId: string
    questionText: string
    score: number | null
    commentary: string | null
  }[]
}
```

## Testing Checklist

### Assessments
- [ ] GET /api/assessments returns all assessments
- [ ] GET with status filter works correctly
- [ ] GET with search filter searches name and customerName
- [ ] POST creates assessment in draft status
- [ ] POST validates required fields
- [ ] GET /api/assessments/[id] includes full type structure
- [ ] GET /api/assessments/[id] includes responses map
- [ ] PUT updates only specified fields
- [ ] DELETE removes assessment and all responses

### Results
- [ ] GET /api/assessments/[id]/results calculates category scores
- [ ] Overall score is average of category scores
- [ ] Maturity level maps correctly to score ranges
- [ ] Handles assessments with no responses

### Responses
- [ ] POST upserts response correctly
- [ ] POST validates score range (1-5)
- [ ] POST auto-updates assessment status to in-progress
- [ ] PUT /api/responses/bulk handles multiple responses
- [ ] Bulk update is atomic (transaction)

## Completion Criteria
- All endpoints implemented with proper error handling
- Results endpoint correctly calculates all scores
- Upsert logic works for both create and update
- Assessment status transitions work correctly
