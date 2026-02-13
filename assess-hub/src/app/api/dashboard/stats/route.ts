import { query, groupBy } from '@/lib/sql-helpers'
import { NextResponse } from 'next/server'
import type { AssessmentType, Response } from '@/types/db'

// Note: Dashboard is accessed from the main page which should have auth
export async function GET() {
  try {
    // 1. Get total counts by status
    interface StatusCount {
      status: string
      cnt: number
    }

    const statusCounts = await query<StatusCount>(
      'SELECT status, COUNT(*) as cnt FROM Assessment GROUP BY status',
      []
    )

    // Convert to map for easy lookup
    const statusMap = new Map(statusCounts.map(s => [s.status, s.cnt]))

    interface TotalCount {
      total: number
    }

    const totalResult = await query<TotalCount>('SELECT COUNT(*) as total FROM Assessment', [])
    const totalAssessments = totalResult[0]?.total || 0
    const draft = statusMap.get('draft') ?? 0
    const inProgress = statusMap.get('in-progress') ?? 0
    const completed = statusMap.get('completed') ?? 0

    // 2. Get type stats with completed assessment counts
    interface TypeStat {
      typeId: string
      typeName: string
      iconColor: string
      count: number
      completedCount: number
    }

    const typeStats = await query<TypeStat>(
      `SELECT at.id as typeId, at.name as typeName, at.iconColor,
         COUNT(a.id) as count,
         SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completedCount
       FROM AssessmentType at
       LEFT JOIN Assessment a ON a.assessmentTypeId = at.id
       WHERE at.isActive = 1
       GROUP BY at.id, at.name, at.iconColor`,
      []
    )

    // Get completed assessments with responses for score calculation
    interface AssessmentWithType {
      id: string
      assessmentTypeId: string
    }

    const completedAssessments = await query<AssessmentWithType>(
      'SELECT id, assessmentTypeId FROM Assessment WHERE status = ?',
      ['completed']
    )

    // Group by type
    const assessmentsByType = groupBy(completedAssessments, a => a.assessmentTypeId)

    // Get category structures for types that have completed assessments
    const typeIdsWithCompleted = Array.from(assessmentsByType.keys())

    interface CategoryQuestion {
      assessmentTypeId: string
      categoryId: string
      questionId: string
    }

    let categoryQuestions: CategoryQuestion[] = []
    if (typeIdsWithCompleted.length > 0) {
      categoryQuestions = await query<CategoryQuestion>(
        `SELECT c.assessmentTypeId, c.id as categoryId, q.id as questionId
         FROM Category c
         JOIN Question q ON q.categoryId = c.id
         WHERE c.assessmentTypeId IN (${typeIdsWithCompleted.map(() => '?').join(',')})
         ORDER BY c.\`order\` ASC, q.\`order\` ASC`,
        typeIdsWithCompleted
      )
    }

    // Group by type and category
    const typeStructure = groupBy(categoryQuestions, cq => cq.assessmentTypeId)
    const categoryStructure: Record<string, Array<{ questions: Array<{ id: string }> }>> = {}

    for (const [typeId, items] of typeStructure.entries()) {
      const categoriesMap = groupBy(items, item => item.categoryId)
      categoryStructure[typeId] = Array.from(categoriesMap.values()).map(catItems => ({
        questions: catItems.map(item => ({ id: item.questionId }))
      }))
    }

    // Get all responses for completed assessments
    let responses: Response[] = []
    if (completedAssessments.length > 0) {
      const assessmentIds = completedAssessments.map(a => a.id)
      responses = await query<Response>(
        `SELECT assessmentId, questionId, score FROM Response WHERE assessmentId IN (${assessmentIds.map(() => '?').join(',')})`,
        assessmentIds
      )
    }

    // Group responses by assessment
    const responsesByAssessment = groupBy(responses, r => r.assessmentId)

    // Calculate avg scores per type
    const byType = typeStats.map(type => {
      let avgScore: number | null = null

      if (type.completedCount > 0) {
        const typeAssessments = assessmentsByType.get(type.typeId) || []
        const categories = categoryStructure[type.typeId] || []

        const scores = typeAssessments
          .map(assessment => {
            const assessmentResponses = responsesByAssessment.get(assessment.id) || []
            return calculateOverallScore(assessmentResponses, categories)
          })
          .filter((score): score is number => score !== null)

        if (scores.length > 0) {
          avgScore = Math.round(
            (scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10
          ) / 10
        }
      }

      return {
        typeId: type.typeId,
        typeName: type.typeName,
        iconColor: type.iconColor,
        count: type.count,
        completedCount: type.completedCount,
        avgScore
      }
    })

    // 3. Get 5 most recent assessments
    interface RecentAssessment {
      id: string
      name: string
      customerName: string
      status: string
      updatedAt: Date
      assessmentTypeId: string
      typeName: string
    }

    const recentAssessments = await query<RecentAssessment>(
      `SELECT a.id, a.name, a.customerName, a.status, a.updatedAt, a.assessmentTypeId,
         at.name as typeName
       FROM Assessment a
       JOIN AssessmentType at ON at.id = a.assessmentTypeId
       ORDER BY a.updatedAt DESC LIMIT 5`,
      []
    )

    const recentAssessmentsData = recentAssessments.map(assessment => {
      // Calculate score only for completed assessments
      let score: number | null = null
      if (assessment.status === 'completed') {
        const assessmentResponses = responsesByAssessment.get(assessment.id) || []
        const categories = categoryStructure[assessment.assessmentTypeId] || []
        score = calculateOverallScore(assessmentResponses, categories)
      }

      return {
        id: assessment.id,
        name: assessment.name,
        customerName: assessment.customerName,
        typeName: assessment.typeName,
        status: assessment.status,
        score,
        updatedAt: new Date(assessment.updatedAt).toISOString()
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
