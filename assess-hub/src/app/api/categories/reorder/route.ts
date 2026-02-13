import { transaction } from '@/lib/sql-helpers'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  const { categoryIds } = await request.json()

  if (!Array.isArray(categoryIds)) {
    return NextResponse.json(
      { error: 'categoryIds array is required' },
      { status: 400 }
    )
  }

  // Update all in a transaction
  await transaction(async (conn) => {
    for (let i = 0; i < categoryIds.length; i++) {
      await conn.execute(
        'UPDATE Category SET `order` = ? WHERE id = ?',
        [i + 1, categoryIds[i]]
      )
    }
  })

  return NextResponse.json({ success: true })
}
