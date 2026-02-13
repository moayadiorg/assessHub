import { NextResponse } from 'next/server'
import { execute, queryOne } from '@/lib/sql-helpers'
import { newId } from '@/lib/id'
import type { Response } from '@/types/db'

export async function POST(request: Request) {
  const body = await request.json()

  if (!body.assessmentId || !body.questionId || body.score === undefined) {
    return NextResponse.json(
      { error: 'assessmentId, questionId, and score are required' },
      { status: 400 }
    )
  }

  // Validate score range
  if (body.score < 1 || body.score > 5) {
    return NextResponse.json(
      { error: 'Score must be between 1 and 5' },
      { status: 400 }
    )
  }

  // Upsert response using INSERT ... ON DUPLICATE KEY UPDATE
  const responseId = newId()
  await execute(
    `INSERT INTO Response (id, assessmentId, questionId, score, commentary, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))
     ON DUPLICATE KEY UPDATE score = VALUES(score), commentary = VALUES(commentary), updatedAt = NOW(3)`,
    [responseId, body.assessmentId, body.questionId, body.score, body.commentary ?? null]
  )

  // Auto-update assessment status to in-progress if draft
  await execute(
    `UPDATE Assessment SET status = 'in-progress', updatedAt = NOW(3) WHERE id = ? AND status = 'draft'`,
    [body.assessmentId]
  )

  // Fetch the upserted response
  const response = await queryOne<Response>(
    'SELECT * FROM Response WHERE assessmentId = ? AND questionId = ?',
    [body.assessmentId, body.questionId]
  )

  return NextResponse.json(response)
}
