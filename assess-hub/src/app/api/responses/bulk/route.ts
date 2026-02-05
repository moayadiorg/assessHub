import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

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
  const results = await prisma.$transaction(
    body.responses.map((r: any) =>
      prisma.response.upsert({
        where: {
          assessmentId_questionId: {
            assessmentId: body.assessmentId,
            questionId: r.questionId
          }
        },
        update: {
          score: r.score,
          commentary: r.commentary ?? null
        },
        create: {
          assessmentId: body.assessmentId,
          questionId: r.questionId,
          score: r.score,
          commentary: r.commentary ?? null
        }
      })
    )
  )

  // Update assessment status
  await prisma.assessment.updateMany({
    where: {
      id: body.assessmentId,
      status: 'draft'
    },
    data: {
      status: 'in-progress'
    }
  })

  return NextResponse.json({
    success: true,
    count: results.length
  })
}
