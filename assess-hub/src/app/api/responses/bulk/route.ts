import { NextResponse } from 'next/server'
import { transaction, execute } from '@/lib/sql-helpers'
import { newId } from '@/lib/id'

export async function PUT(request: Request) {
  const body = await request.json()

  if (!body.assessmentId || !Array.isArray(body.responses)) {
    return NextResponse.json(
      { error: 'assessmentId and responses array are required' },
      { status: 400 }
    )
  }

  // Validate all scores
  for (const r of body.responses) {
    if (r.score < 1 || r.score > 5) {
      return NextResponse.json(
        { error: `Invalid score for question ${r.questionId}` },
        { status: 400 }
      )
    }
  }

  // Bulk upsert in transaction
  await transaction(async (conn) => {
    for (const r of body.responses) {
      await conn.execute(
        `INSERT INTO Response (id, assessmentId, questionId, score, commentary, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))
         ON DUPLICATE KEY UPDATE score = VALUES(score), commentary = VALUES(commentary), updatedAt = NOW(3)`,
        [newId(), body.assessmentId, r.questionId, r.score, r.commentary ?? null]
      )
    }
  })

  // Update assessment status to in-progress if draft
  await execute(
    `UPDATE Assessment SET status = 'in-progress', updatedAt = NOW(3) WHERE id = ? AND status = 'draft'`,
    [body.assessmentId]
  )

  return NextResponse.json({
    success: true,
    count: body.responses.length
  })
}
