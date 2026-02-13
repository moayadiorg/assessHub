import { query, queryOne, groupBy } from '@/lib/sql-helpers'
import { NextResponse } from 'next/server'
import type { Assessment, AssessmentType, Customer, Response } from '@/types/db'

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

  // 1. Get both assessments
  const [assessment1, assessment2] = await Promise.all([
    queryOne<Assessment>('SELECT * FROM Assessment WHERE id = ?', [a1]),
    queryOne<Assessment>('SELECT * FROM Assessment WHERE id = ?', [a2])
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

  // 2. Verify same assessment type
  if (assessment1.assessmentTypeId !== assessment2.assessmentTypeId) {
    return NextResponse.json(
      { error: 'Assessments must be of the same type to compare' },
      { status: 400 }
    )
  }

  // 3. Get assessment type name
  const assessmentType = await queryOne<AssessmentType>(
    'SELECT id, name FROM AssessmentType WHERE id = ?',
    [assessment1.assessmentTypeId]
  )

  if (!assessmentType) {
    return NextResponse.json(
      { error: 'Assessment type not found' },
      { status: 404 }
    )
  }

  // 4. Get categories+questions structure
  interface CategoryQuestion {
    categoryId: string
    categoryName: string
    order: number
    questionId: string
  }

  const categoryQuestions = await query<CategoryQuestion>(
    `SELECT c.id as categoryId, c.name as categoryName, c.\`order\`,
       q.id as questionId
     FROM Category c
     JOIN Question q ON q.categoryId = c.id
     WHERE c.assessmentTypeId = ?
     ORDER BY c.\`order\` ASC, q.\`order\` ASC`,
    [assessment1.assessmentTypeId]
  )

  // Group by category
  const categoriesMap = groupBy(categoryQuestions, cq => cq.categoryId)
  const categories = Array.from(categoriesMap.entries()).map(([catId, items]) => ({
    id: catId,
    name: items[0].categoryName,
    questions: items.map(item => ({ id: item.questionId }))
  }))

  // 5. Get responses for both assessments
  const responses = await query<Response>(
    'SELECT assessmentId, questionId, score FROM Response WHERE assessmentId IN (?, ?)',
    [a1, a2]
  )

  const responsesByAssessment = groupBy(responses, r => r.assessmentId)
  const responses1 = responsesByAssessment.get(a1) || []
  const responses2 = responsesByAssessment.get(a2) || []

  // 6. Get customer names
  const customers = await query<Customer>(
    'SELECT id, name FROM Customer WHERE id IN (?, ?)',
    [assessment1.customerId, assessment2.customerId]
  )
  const customerMap = new Map(customers.map(c => [c.id, c.name]))

  // Calculate scores for both
  const scores1 = calculateScores(responses1, categories)
  const scores2 = calculateScores(responses2, categories)

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
      id: assessmentType.id,
      name: assessmentType.name
    },
    assessment1: {
      id: assessment1.id,
      name: assessment1.name,
      customerName: customerMap.get(assessment1.customerId!) || assessment1.customerName,
      completedAt: new Date(assessment1.updatedAt).toISOString(),
      overallScore: scores1.overallScore,
      maturityLevel: scores1.maturityLevel,
      categoryScores: scores1.categoryScores
    },
    assessment2: {
      id: assessment2.id,
      name: assessment2.name,
      customerName: customerMap.get(assessment2.customerId!) || assessment2.customerName,
      completedAt: new Date(assessment2.updatedAt).toISOString(),
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
