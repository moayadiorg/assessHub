import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Note: Dashboard is accessed from the main page which should have auth
export async function GET() {
  try {
    // 1. Get total counts by status
    const statusCounts = await prisma.assessment.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    // Convert to map for easy lookup
    const statusMap = new Map(
      statusCounts.map(s => [s.status, s._count.id])
    )

    const totalAssessments = await prisma.assessment.count()
    const draft = statusMap.get('draft') ?? 0
    const inProgress = statusMap.get('in-progress') ?? 0
    const completed = statusMap.get('completed') ?? 0

    // 2. Get assessments by type with counts and calculate avg scores
    const typeStats = await prisma.assessmentType.findMany({
      where: { isActive: true },
      include: {
        assessments: {
          select: {
            id: true,
            status: true,
            responses: true
          }
        },
        categories: {
          orderBy: { order: 'asc' },
          include: {
            questions: {
              orderBy: { order: 'asc' },
              select: { id: true }
            }
          }
        }
      }
    })

    const byType = typeStats.map(type => {
      const count = type.assessments.length
      const completedAssessments = type.assessments.filter(
        a => a.status === 'completed'
      )
      const completedCount = completedAssessments.length

      // Calculate avg score only for completed assessments
      let avgScore: number | null = null
      if (completedCount > 0) {
        const scores = completedAssessments
          .map(assessment => calculateOverallScore(assessment.responses, type.categories))
          .filter((score): score is number => score !== null)

        if (scores.length > 0) {
          avgScore = Math.round(
            (scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10
          ) / 10
        }
      }

      return {
        typeId: type.id,
        typeName: type.name,
        iconColor: type.iconColor,
        count,
        completedCount,
        avgScore
      }
    })

    // 3. Get 5 most recent assessments
    const recentAssessments = await prisma.assessment.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        assessmentType: {
          select: {
            name: true,
            categories: {
              orderBy: { order: 'asc' },
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                  select: { id: true }
                }
              }
            }
          }
        },
        responses: true
      }
    })

    const recentAssessmentsData = recentAssessments.map(assessment => {
      // Calculate score only for completed assessments
      let score: number | null = null
      if (assessment.status === 'completed') {
        score = calculateOverallScore(
          assessment.responses,
          assessment.assessmentType.categories
        )
      }

      return {
        id: assessment.id,
        name: assessment.name,
        customerName: assessment.customerName,
        typeName: assessment.assessmentType.name,
        status: assessment.status,
        score,
        updatedAt: assessment.updatedAt.toISOString()
      }
    })

    return NextResponse.json({
      totalAssessments,
      byStatus: {
        draft,
        inProgress,
        completed
      },
      byType,
      recentAssessments: recentAssessmentsData
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}

// Calculate overall score for an assessment (matches logic from results route)
function calculateOverallScore(
  responses: Array<{ questionId: string; score: number }>,
  categories: Array<{ questions: Array<{ id: string }> }>
): number | null {
  if (responses.length === 0) return null

  const responsesMap = new Map(responses.map(r => [r.questionId, r]))

  // Calculate category scores - return 0 for empty categories (matching results route)
  const categoryScores = categories.map(category => {
    const questionIds = category.questions.map(q => q.id)
    const categoryResponses = questionIds
      .map(id => responsesMap.get(id))
      .filter((r): r is { questionId: string; score: number } => r !== undefined)

    if (categoryResponses.length === 0) return 0

    const totalScore = categoryResponses.reduce((sum, r) => sum + r.score, 0)
    return totalScore / categoryResponses.length
  })

  // Filter out categories with no responses for overall score calculation
  const validCategories = categoryScores.filter(score => score > 0)

  if (validCategories.length === 0) return null

  return Math.round(
    (validCategories.reduce((sum, s) => sum + s, 0) / validCategories.length) * 10
  ) / 10
}
