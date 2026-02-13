import { query, queryOne, execute, transaction } from '@/lib/sql-helpers'
import { newId } from '@/lib/id'
import { Question, QuestionOption } from '@/types/db'
import { NextResponse } from 'next/server'

function getDefaultLabel(score: number): string {
  const labels: Record<number, string> = {
    1: 'Initial',
    2: 'Managed',
    3: 'Defined',
    4: 'Quantitatively Managed',
    5: 'Optimizing'
  }
  return labels[score] || `Level ${score}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')

  if (!categoryId) {
    return NextResponse.json(
      { error: 'categoryId query parameter is required' },
      { status: 400 }
    )
  }

  const questions = await query<Question>(
    'SELECT id, categoryId, text, description, `order` FROM Question WHERE categoryId = ? ORDER BY `order` ASC',
    [categoryId]
  )

  if (questions.length === 0) {
    return NextResponse.json([])
  }

  // Get all options for these questions
  const questionIds = questions.map(q => q.id)
  const options = await query<QuestionOption>(
    'SELECT id, questionId, score, label, description FROM QuestionOption WHERE questionId IN (' +
      questionIds.map(() => '?').join(',') +
      ') ORDER BY score ASC',
    questionIds
  )

  // Group options by questionId
  const optionsByQuestion = new Map<string, QuestionOption[]>()
  for (const option of options) {
    if (!optionsByQuestion.has(option.questionId)) {
      optionsByQuestion.set(option.questionId, [])
    }
    optionsByQuestion.get(option.questionId)!.push(option)
  }

  // Assemble response
  const questionsWithOptions = questions.map(question => ({
    ...question,
    options: optionsByQuestion.get(question.id) || []
  }))

  return NextResponse.json(questionsWithOptions)
}

export async function POST(request: Request) {
  const body = await request.json()

  if (!body.categoryId || !body.text?.trim()) {
    return NextResponse.json(
      { error: 'categoryId and text are required' },
      { status: 400 }
    )
  }

  // Validate options - must have 5 levels
  if (!body.options || body.options.length !== 5) {
    return NextResponse.json(
      { error: 'Exactly 5 options (maturity levels 1-5) are required' },
      { status: 400 }
    )
  }

  // Get next order if not provided
  let order = body.order
  if (order === undefined) {
    const maxOrderRow = await queryOne<{ m: number }>(
      'SELECT COALESCE(MAX(`order`), 0) as m FROM Question WHERE categoryId = ?',
      [body.categoryId]
    )
    order = (maxOrderRow?.m ?? 0) + 1
  }

  const questionId = newId()
  const text = body.text.trim()
  const description = body.description?.trim() || null

  const options: QuestionOption[] = []

  await transaction(async (conn) => {
    // Insert question
    await conn.execute(
      'INSERT INTO Question (id, categoryId, text, description, `order`) VALUES (?, ?, ?, ?, ?)',
      [questionId, body.categoryId, text, description, order]
    )

    // Insert 5 options
    for (let idx = 0; idx < 5; idx++) {
      const opt = body.options[idx]
      const optionId = newId()
      const score = idx + 1
      const label = opt.label || getDefaultLabel(score)
      const optDescription = opt.description || ''

      await conn.execute(
        'INSERT INTO QuestionOption (id, questionId, score, label, description) VALUES (?, ?, ?, ?, ?)',
        [optionId, questionId, score, label, optDescription]
      )

      options.push({
        id: optionId,
        questionId,
        score,
        label,
        description: optDescription
      })
    }
  })

  const question = {
    id: questionId,
    categoryId: body.categoryId,
    text,
    description,
    order,
    options
  }

  return NextResponse.json(question, { status: 201 })
}
