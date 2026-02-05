import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

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

  // Upsert response
  const response = await prisma.response.upsert({
    where: {
      assessmentId_questionId: {
        assessmentId: body.assessmentId,
        questionId: body.questionId
      }
    },
    update: {
      score: body.score,
      commentary: body.commentary ?? null
    },
    create: {
      assessmentId: body.assessmentId,
      questionId: body.questionId,
      score: body.score,
      commentary: body.commentary ?? null
    }
  })

  // Auto-update assessment status to in-progress if draft
  await prisma.assessment.updateMany({
    where: {
      id: body.assessmentId,
      status: 'draft'
    },
    data: {
      status: 'in-progress'
    }
  })

  return NextResponse.json(response)
}
