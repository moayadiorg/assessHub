import { NextResponse } from 'next/server'
import { query, queryOne, groupBy } from '@/lib/sql-helpers'
import type { Assessment, Response } from '@/types/db'

interface CategoryQuestionRow {
  categoryId: string
  categoryName: string
  order: number
  questionId: string
  questionText: string
  qOrder: number
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 1. Get assessment
  const assessment = await queryOne<Assessment>(
    'SELECT * FROM Assessment WHERE id = ?',
    [id]
  )

  if (!assessment) {
    return NextResponse.json(
      { error: 'Assessment not found' },
      { status: 404 }
    )
  }

  // 2. Get categories with questions
  const categoryQuestions = await query<CategoryQuestionRow>(
    `SELECT c.id as categoryId, c.name as categoryName, c.\`order\`,
       q.id as questionId, q.text as questionText, q.\`order\` as qOrder
     FROM Category c
     JOIN Question q ON q.categoryId = c.id
     WHERE c.assessmentTypeId = ?
     ORDER BY c.\`order\` ASC, q.\`order\` ASC`,
    [assessment.assessmentTypeId]
  )

  // 3. Get responses
  const responses = await query<Response>(
    'SELECT questionId, score, commentary FROM Response WHERE assessmentId = ?',
    [id]
  )

  // Build responses map
  const responsesMap = new Map(
    responses.map(r => [r.questionId, r])
  )

  // Group category questions by categoryId
  const questionsByCategory = groupBy(categoryQuestions, cq => cq.categoryId)

  // Calculate category scores
  const categoryScores = Array.from(questionsByCategory.entries()).map(([categoryId, questions]) => {
    const category = questions[0] // First question has category info
    const questionIds = questions.map(q => q.questionId)
    const categoryResponses = questionIds
      .map(id => responsesMap.get(id))
      .filter(Boolean)

    const totalScore = categoryResponses.reduce((sum, r) => sum + r!.score, 0)
    const avgScore = categoryResponses.length > 0
      ? Math.round((totalScore / categoryResponses.length) * 10) / 10
      : 0

    return {
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      score: avgScore,
      answeredQuestions: categoryResponses.length,
      totalQuestions: questionIds.length,
      questionScores: questions.map(q => ({
        questionId: q.questionId,
        questionText: q.questionText,
        score: responsesMap.get(q.questionId)?.score ?? null,
        commentary: responsesMap.get(q.questionId)?.commentary ?? null
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
