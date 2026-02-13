import { query, queryOne, execute } from '@/lib/sql-helpers'
import { Category, Question } from '@/types/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const category = await queryOne<Category>(
    'SELECT id, assessmentTypeId, name, description, `order` FROM Category WHERE id = ?',
    [id]
  )

  if (!category) {
    return NextResponse.json(
      { error: 'Category not found' },
      { status: 404 }
    )
  }

  const questions = await query<Question>(
    'SELECT id, categoryId, text, description, `order` FROM Question WHERE categoryId = ? ORDER BY `order` ASC',
    [id]
  )

  return NextResponse.json({ ...category, questions })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const existing = await queryOne<Category>(
    'SELECT id, assessmentTypeId, name, description, `order` FROM Category WHERE id = ?',
    [id]
  )

  if (!existing) {
    return NextResponse.json(
      { error: 'Category not found' },
      { status: 404 }
    )
  }

  const name = body.name?.trim() ?? existing.name
  const description = body.description !== undefined
    ? body.description?.trim() || null
    : existing.description
  const order = body.order ?? existing.order

  await execute(
    'UPDATE Category SET name = ?, description = ?, `order` = ? WHERE id = ?',
    [name, description, order, id]
  )

  const updated = {
    id: existing.id,
    assessmentTypeId: existing.assessmentTypeId,
    name,
    description,
    order
  }

  return NextResponse.json(updated)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = await queryOne<Category>(
    'SELECT id FROM Category WHERE id = ?',
    [id]
  )

  if (!existing) {
    return NextResponse.json(
      { error: 'Category not found' },
      { status: 404 }
    )
  }

  // Cascade delete will remove all questions and their options
  await execute('DELETE FROM Category WHERE id = ?', [id])

  return NextResponse.json({ success: true })
}
