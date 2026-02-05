import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Note: Page-level auth is handled by middleware for /reports routes
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      assessments: {
        where: { status: 'completed' },
        include: {
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
          },
          responses: true
        },
        orderBy: { updatedAt: 'asc' } // Chronological for trends
      }
    }
  })

  if (!customer) {
    return NextResponse.json(
      { error: 'Customer not found' },
      { status: 404 }
    )
  }

  // Group assessments by type
  const typeMap = new Map<string, {
    typeId: string
    typeName: string
    iconColor: string
    assessments: any[]
  }>()

  for (const assessment of customer.assessments) {
    const typeId = assessment.assessmentType.id

    if (!typeMap.has(typeId)) {
      typeMap.set(typeId, {
        typeId,
        typeName: assessment.assessmentType.name,
        iconColor: assessment.assessmentType.iconColor,
        assessments: []
      })
    }

    // Calculate scores for this assessment
    const { overallScore, maturityLevel, categoryScores } = calculateScores(
      assessment.responses,
      assessment.assessmentType.categories
    )

    typeMap.get(typeId)!.assessments.push({
      id: assessment.id,
      name: assessment.name,
      completedAt: assessment.updatedAt.toISOString(),
      overallScore,
      maturityLevel,
      categoryScores
    })
  }

  // Calculate trend for each type
  const assessmentsByType = Array.from(typeMap.values()).map(typeData => {
    const assessments = typeData.assessments
    let trend = null

    if (assessments.length >= 2) {
      const firstScore = assessments[0].overallScore
      const lastScore = assessments[assessments.length - 1].overallScore
      const change = lastScore - firstScore

      trend = {
        direction: change > 0.1 ? 'improving' as const :
                   change < -0.1 ? 'declining' as const :
                   'stable' as const,
        firstScore,
        lastScore,
        change: Math.round(change * 10) / 10
      }
    }

    return {
      ...typeData,
      trend
    }
  })

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name
    },
    totalAssessments: customer.assessments.length,
    assessmentsByType
  })
}

// Reuse scoring logic from results route
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
      score: avgScore
    }
  })

  const validCategories = categoryScores.filter(c => c.score > 0)
  const overallScore = validCategories.length > 0
    ? Math.round(
        (validCategories.reduce((sum, c) => sum + c.score, 0) / validCategories.length) * 10
      ) / 10
    : 0

  const maturityLevel = getMaturityLevel(overallScore)

  return { overallScore, maturityLevel, categoryScores }
}

function getMaturityLevel(score: number): { level: number; name: string } {
  if (score >= 4.5) return { level: 5, name: 'Optimizing' }
  if (score >= 3.5) return { level: 4, name: 'Quantitatively Managed' }
  if (score >= 2.5) return { level: 3, name: 'Defined' }
  if (score >= 1.5) return { level: 2, name: 'Managed' }
  return { level: 1, name: 'Initial' }
}
