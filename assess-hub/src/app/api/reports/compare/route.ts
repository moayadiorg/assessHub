import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Note: Page-level auth is handled by middleware for /reports routes
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const a1 = searchParams.get('a1')
  const a2 = searchParams.get('a2')

  if (!a1 || !a2) {
    return NextResponse.json(
      { error: 'Both a1 and a2 query parameters are required' },
      { status: 400 }
    )
  }

  if (a1 === a2) {
    return NextResponse.json(
      { error: 'Cannot compare an assessment with itself' },
      { status: 400 }
    )
  }

  // Fetch both assessments with full data
  const [assessment1, assessment2] = await Promise.all([
    prisma.assessment.findUnique({
      where: { id: a1 },
      include: {
        assessmentType: {
          include: {
            categories: {
              orderBy: { order: 'asc' },
              include: {
                questions: { orderBy: { order: 'asc' } }
              }
            }
          }
        },
        responses: true,
        customer: true
      }
    }),
    prisma.assessment.findUnique({
      where: { id: a2 },
      include: {
        assessmentType: {
          include: {
            categories: {
              orderBy: { order: 'asc' },
              include: {
                questions: { orderBy: { order: 'asc' } }
              }
            }
          }
        },
        responses: true,
        customer: true
      }
    })
  ])

  if (!assessment1) {
    return NextResponse.json(
      { error: `Assessment ${a1} not found` },
      { status: 404 }
    )
  }

  if (!assessment2) {
    return NextResponse.json(
      { error: `Assessment ${a2} not found` },
      { status: 404 }
    )
  }

  // Verify same assessment type
  if (assessment1.assessmentTypeId !== assessment2.assessmentTypeId) {
    return NextResponse.json(
      { error: 'Assessments must be of the same type to compare' },
      { status: 400 }
    )
  }

  // Calculate scores for both
  const scores1 = calculateScores(
    assessment1.responses,
    assessment1.assessmentType.categories
  )
  const scores2 = calculateScores(
    assessment2.responses,
    assessment2.assessmentType.categories
  )

  // Build comparison
  const categoryDeltas = scores1.categoryScores.map((cat1, index) => {
    const cat2 = scores2.categoryScores[index]
    const delta = Math.round((cat1.score - cat2.score) * 10) / 10
    return {
      categoryId: cat1.categoryId,
      categoryName: cat1.categoryName,
      score1: cat1.score,
      score2: cat2.score,
      delta,
      winner: delta > 0 ? 1 : delta < 0 ? 2 : 'tie'
    }
  })

  const overallDelta = Math.round((scores1.overallScore - scores2.overallScore) * 10) / 10

  return NextResponse.json({
    assessmentType: {
      id: assessment1.assessmentType.id,
      name: assessment1.assessmentType.name
    },
    assessment1: {
      id: assessment1.id,
      name: assessment1.name,
      customerName: assessment1.customer?.name || assessment1.customerName,
      completedAt: assessment1.updatedAt.toISOString(),
      overallScore: scores1.overallScore,
      maturityLevel: scores1.maturityLevel,
      categoryScores: scores1.categoryScores
    },
    assessment2: {
      id: assessment2.id,
      name: assessment2.name,
      customerName: assessment2.customer?.name || assessment2.customerName,
      completedAt: assessment2.updatedAt.toISOString(),
      overallScore: scores2.overallScore,
      maturityLevel: scores2.maturityLevel,
      categoryScores: scores2.categoryScores
    },
    comparison: {
      overallDelta,
      winner: overallDelta > 0 ? 1 : overallDelta < 0 ? 2 : 'tie',
      categoryDeltas
    }
  })
}

function calculateScores(responses: any[], categories: any[]) {
  const responsesMap = new Map(responses.map(r => [r.questionId, r]))

  const categoryScores = categories.map(category => {
    const questionIds = category.questions.map((q: any) => q.id)
    const categoryResponses = questionIds
      .map((id: string) => responsesMap.get(id))
      .filter(Boolean)

    const totalScore = categoryResponses.reduce((sum: number, r: any) => sum + r.score, 0)
    const avgScore = categoryResponses.length > 0
      ? Math.round((totalScore / categoryResponses.length) * 10) / 10
      : 0

    return {
      categoryId: category.id,
      categoryName: category.name,
      score: avgScore,
      answeredQuestions: categoryResponses.length
    }
  })

  // Filter by answered questions > 0 to match results route pattern
  const validCategories = categoryScores.filter(c => c.answeredQuestions > 0)
  const overallScore = validCategories.length > 0
    ? Math.round(
        (validCategories.reduce((sum, c) => sum + c.score, 0) / validCategories.length) * 10
      ) / 10
    : 0

  const maturityLevel = getMaturityLevel(overallScore)

  return {
    overallScore,
    maturityLevel,
    categoryScores: categoryScores.map(({ answeredQuestions, ...rest }) => rest)
  }
}

function getMaturityLevel(score: number): { level: number; name: string } {
  if (score >= 4.5) return { level: 5, name: 'Optimizing' }
  if (score >= 3.5) return { level: 4, name: 'Quantitatively Managed' }
  if (score >= 2.5) return { level: 3, name: 'Defined' }
  if (score >= 1.5) return { level: 2, name: 'Managed' }
  return { level: 1, name: 'Initial' }
}
