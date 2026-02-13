import { query, queryOne, groupBy } from '@/lib/sql-helpers'
import { NextResponse } from 'next/server'
import type { Customer, Assessment, Response } from '@/types/db'

// Note: Page-level auth is handled by middleware for /reports routes
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 1. Get customer
  const customer = await queryOne<Customer>(
    'SELECT id, name FROM Customer WHERE id = ?',
    [id]
  )

  if (!customer) {
    return NextResponse.json(
      { error: 'Customer not found' },
      { status: 404 }
    )
  }

  // 2. Get completed assessments for this customer with type info
  const assessments = await query<Assessment & { typeName: string; iconColor: string }>(
    `SELECT a.id, a.name, a.assessmentTypeId, a.updatedAt,
       at.name as typeName, at.iconColor
     FROM Assessment a
     JOIN AssessmentType at ON at.id = a.assessmentTypeId
     WHERE a.customerId = ? AND a.status = 'completed'
     ORDER BY a.updatedAt ASC`,
    [id]
  )

  if (assessments.length === 0) {
    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name
      },
      totalAssessments: 0,
      assessmentsByType: []
    })
  }

  // 3. Get unique assessment type IDs
  const typeIds = [...new Set(assessments.map(a => a.assessmentTypeId))]

  // 4. Get all category+question structure for relevant assessment types
  interface CategoryQuestion {
    assessmentTypeId: string
    categoryId: string
    categoryName: string
    order: number
    questionId: string
  }

  const categoryQuestions = await query<CategoryQuestion>(
    `SELECT c.assessmentTypeId, c.id as categoryId, c.name as categoryName, c.\`order\`,
       q.id as questionId
     FROM Category c
     JOIN Question q ON q.categoryId = c.id
     WHERE c.assessmentTypeId IN (${typeIds.map(() => '?').join(',')})
     ORDER BY c.\`order\` ASC, q.\`order\` ASC`,
    typeIds
  )

  // Group by type and category
  const typeStructure = groupBy(categoryQuestions, cq => cq.assessmentTypeId)
  const categoryStructure: Record<string, Array<{ id: string; name: string; questions: Array<{ id: string }> }>> = {}

  for (const [typeId, items] of typeStructure.entries()) {
    const categoriesMap = groupBy(items, item => item.categoryId)
    categoryStructure[typeId] = Array.from(categoriesMap.entries()).map(([catId, catItems]) => ({
      id: catId,
      name: catItems[0].categoryName,
      questions: catItems.map(item => ({ id: item.questionId }))
    }))
  }

  // 5. Get all responses for these assessments
  const assessmentIds = assessments.map(a => a.id)
  const responses = await query<Response>(
    `SELECT assessmentId, questionId, score FROM Response WHERE assessmentId IN (${assessmentIds.map(() => '?').join(',')})`,
    assessmentIds
  )

  // Group responses by assessment
  const responsesByAssessment = groupBy(responses, r => r.assessmentId)

  // 6. Group assessments by type
  const typeMap = new Map<string, {
    typeId: string
    typeName: string
    iconColor: string
    assessments: any[]
  }>()

  for (const assessment of assessments) {
    const typeId = assessment.assessmentTypeId

    if (!typeMap.has(typeId)) {
      typeMap.set(typeId, {
        typeId,
        typeName: assessment.typeName,
        iconColor: assessment.iconColor,
        assessments: []
      })
    }

    // Calculate scores for this assessment
    const assessmentResponses = responsesByAssessment.get(assessment.id) || []
    const categories = categoryStructure[typeId] || []
    const { overallScore, maturityLevel, categoryScores } = calculateScores(
      assessmentResponses,
      categories
    )

    typeMap.get(typeId)!.assessments.push({
      id: assessment.id,
      name: assessment.name,
      completedAt: new Date(assessment.updatedAt).toISOString(),
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
    totalAssessments: assessments.length,
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
