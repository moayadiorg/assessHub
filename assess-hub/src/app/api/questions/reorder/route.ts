import { transaction } from '@/lib/sql-helpers'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  const { questionIds } = await request.json()

  if (!Array.isArray(questionIds)) {
    return NextResponse.json(
      { error: 'questionIds array is required' },
      { status: 400 }
    )
  }

  // Update all in a transaction
  await transaction(async (conn) => {
    for (let i = 0; i < questionIds.length; i++) {
      await conn.execute(
        'UPDATE Question SET `order` = ? WHERE id = ?',
        [i + 1, questionIds[i]]
      )
    }
  })

  return NextResponse.json({ success: true })
}
