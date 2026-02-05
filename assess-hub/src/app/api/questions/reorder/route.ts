import { prisma } from '@/lib/prisma'
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
  await prisma.$transaction(
    questionIds.map((id, index) =>
      prisma.question.update({
        where: { id },
        data: { order: index + 1 }
      })
    )
  )

  return NextResponse.json({ success: true })
}
