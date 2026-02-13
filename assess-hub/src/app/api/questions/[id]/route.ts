import { query, queryOne, execute, transaction } from '@/lib/sql-helpers'
import { Question, QuestionOption } from '@/types/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const question = await queryOne<Question>(
    'SELECT id, categoryId, text, description, `order` FROM Question WHERE id = ?',
    [id]
  )

  if (!question) {
    return NextResponse.json(
      { error: 'Question not found' },
      { status: 404 }
    )
  }

  const options = await query<QuestionOption>(
    'SELECT id, questionId, score, label, description FROM QuestionOption WHERE questionId = ? ORDER BY score ASC',
    [id]
  )

  return NextResponse.json({ ...question, options })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const existing = await queryOne<Question>(
    'SELECT id, categoryId, text, description, `order` FROM Question WHERE id = ?',
    [id]
  )

  if (!existing) {
    return NextResponse.json(
      { error: 'Question not found' },
      { status: 404 }
    )
  }

  const text = body.text?.trim() ?? existing.text
  const description = body.description !== undefined
    ? body.description?.trim() || null
    : existing.description
  const order = body.order ?? existing.order

  await transaction(async (conn) => {
    // Update question fields
    await conn.execute(
      'UPDATE Question SET text = ?, description = ?, `order` = ? WHERE id = ?',
      [text, description, order, id]
    )

    // Update options if provided
    if (body.options && Array.isArray(body.options)) {
      for (const opt of body.options) {
        if (opt.id) {
          await conn.execute(
            'UPDATE QuestionOption SET label = ?, description = ? WHERE id = ?',
            [opt.label, opt.description, opt.id]
          )
        }
      }
    }
  })

  // Fetch updated question with options
  const updatedQuestion = await queryOne<Question>(
    'SELECT id, categoryId, text, description, `order` FROM Question WHERE id = ?',
    [id]
  )

  const options = await query<QuestionOption>(
    'SELECT id, questionId, score, label, description FROM QuestionOption WHERE questionId = ? ORDER BY score ASC',
    [id]
  )

  return NextResponse.json({ ...updatedQuestion, options })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = await queryOne<Question>(
    'SELECT id FROM Question WHERE id = ?',
    [id]
  )

  if (!existing) {
    return NextResponse.json(
      { error: 'Question not found' },
      { status: 404 }
    )
  }

  // Cascade delete will remove all options
  await execute('DELETE FROM Question WHERE id = ?', [id])

  return NextResponse.json({ success: true })
}
