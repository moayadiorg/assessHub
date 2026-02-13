import { query, queryOne, execute } from '@/lib/sql-helpers'
import { newId } from '@/lib/id'
import { NextResponse } from 'next/server'

interface CategoryRow {
  id: string
  assessmentTypeId: string
  name: string
  description: string | null
  order: number
  questionCount: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const typeId = searchParams.get('typeId')

  if (!typeId) {
    return NextResponse.json(
      { error: 'typeId query parameter is required' },
      { status: 400 }
    )
  }

  const rows = await query<CategoryRow>(
    `SELECT c.id, c.assessmentTypeId, c.name, c.description, c.\`order\`,
       (SELECT COUNT(*) FROM Question q WHERE q.categoryId = c.id) as questionCount
     FROM Category c
     WHERE c.assessmentTypeId = ?
     ORDER BY c.\`order\` ASC`,
    [typeId]
  )

  // Remap to match Prisma response shape with _count
  const categories = rows.map(row => ({
    id: row.id,
    assessmentTypeId: row.assessmentTypeId,
    name: row.name,
    description: row.description,
    order: row.order,
    _count: {
      questions: row.questionCount
    }
  }))

  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  const body = await request.json()

  if (!body.assessmentTypeId || !body.name?.trim()) {
    return NextResponse.json(
      { error: 'assessmentTypeId and name are required' },
      { status: 400 }
    )
  }

  // Get next order number if not provided
  let order = body.order
  if (order === undefined) {
    const maxOrderRow = await queryOne<{ m: number }>(
      'SELECT COALESCE(MAX(`order`), 0) as m FROM Category WHERE assessmentTypeId = ?',
      [body.assessmentTypeId]
    )
    order = (maxOrderRow?.m ?? 0) + 1
  }

  const id = newId()
  const name = body.name.trim()
  const description = body.description?.trim() || null

  await execute(
    'INSERT INTO Category (id, assessmentTypeId, name, description, `order`) VALUES (?, ?, ?, ?, ?)',
    [id, body.assessmentTypeId, name, description, order]
  )

  // Return the created category
  const category = {
    id,
    assessmentTypeId: body.assessmentTypeId,
    name,
    description,
    order
  }

  return NextResponse.json(category, { status: 201 })
}
