import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const assessment = await prisma.assessment.findUnique({
    where: { id },
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
