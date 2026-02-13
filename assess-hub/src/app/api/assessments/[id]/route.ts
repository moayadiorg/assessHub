import { NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/sql-helpers'
import { groupBy } from '@/lib/sql-helpers'
import type { Assessment, AssessmentType, Category, Question, QuestionOption, Response } from '@/types/db'

interface CategoryRow extends Category {}
interface QuestionRow extends Question {}
interface OptionRow extends QuestionOption {}

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

  // 2. Get assessment type
  const assessmentType = await queryOne<AssessmentType>(
    'SELECT * FROM AssessmentType WHERE id = ?',
    [assessment.assessmentTypeId]
  )

  if (!assessmentType) {
    return NextResponse.json(
      { error: 'Assessment type not found' },
      { status: 404 }
    )
  }

  // 3. Get categories
  const categories = await query<CategoryRow>(
    'SELECT * FROM Category WHERE assessmentTypeId = ? ORDER BY `order` ASC',
    [assessment.assessmentTypeId]
  )

  const categoryIds = categories.map(c => c.id)

  // 4. Get questions and options
  let questions: QuestionRow[] = []
  let options: OptionRow[] = []

  if (categoryIds.length > 0) {
    const placeholders = categoryIds.map(() => '?').join(',')
    questions = await query<QuestionRow>(
      `SELECT * FROM Question WHERE categoryId IN (${placeholders}) ORDER BY \`order\` ASC`,
      categoryIds
    )

    const questionIds = questions.map(q => q.id)
    if (questionIds.length > 0) {
      const qPlaceholders = questionIds.map(() => '?').join(',')
      options = await query<OptionRow>(
        `SELECT * FROM QuestionOption WHERE questionId IN (${qPlaceholders}) ORDER BY score ASC`,
        questionIds
      )
    }
  }

  // 5. Get responses
  const responses = await query<Response>(
    'SELECT * FROM Response WHERE assessmentId = ?',
    [id]
  )

  // Group questions by categoryId
  const questionsByCategory = groupBy(questions, q => q.categoryId)

  // Group options by questionId
  const optionsByQuestion = groupBy(options, o => o.questionId)

  // Assemble nested structure
  const categoriesWithQuestions = categories.map(category => ({
    ...category,
    questions: (questionsByCategory.get(category.id) || []).map(question => ({
      ...question,
      options: optionsByQuestion.get(question.id) || []
    }))
  }))

  // Convert responses to a map for easier lookup
  const responsesMap = responses.reduce((acc, r) => {
    acc[r.questionId] = r
    return acc
  }, {} as Record<string, Response>)

  return NextResponse.json({
    ...assessment,
    assessmentType: {
      ...assessmentType,
      categories: categoriesWithQuestions
    },
    responses,
    responsesMap
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const existing = await queryOne<Assessment>(
    'SELECT * FROM Assessment WHERE id = ?',
    [id]
  )

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

  // Update assessment
  const name = body.name?.trim() ?? existing.name
  const customerName = body.customerName?.trim() ?? existing.customerName
  const status = body.status ?? existing.status

  await execute(
    'UPDATE Assessment SET name = ?, customerName = ?, status = ?, updatedAt = NOW(3) WHERE id = ?',
    [name, customerName, status, id]
  )

  // Query back with assessmentType
  const updated = await queryOne<Assessment>(
    'SELECT * FROM Assessment WHERE id = ?',
    [id]
  )

  const assessmentType = await queryOne<AssessmentType>(
    'SELECT * FROM AssessmentType WHERE id = ?',
    [updated!.assessmentTypeId]
  )

  return NextResponse.json({
    ...updated,
    assessmentType
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = await queryOne<Assessment>(
    'SELECT * FROM Assessment WHERE id = ?',
    [id]
  )

  if (!existing) {
    return NextResponse.json(
      { error: 'Assessment not found' },
      { status: 404 }
    )
  }

  // Delete assessment (responses will cascade delete automatically due to FK constraint)
  await execute(
    'DELETE FROM Assessment WHERE id = ?',
    [id]
  )

  return NextResponse.json({ success: true })
}
