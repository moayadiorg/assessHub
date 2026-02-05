import { prisma } from '@/lib/prisma'
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
  await prisma.$transaction(
    categoryIds.map((id, index) =>
      prisma.category.update({
        where: { id },
        data: { order: index + 1 }
      })
    )
  )

  return NextResponse.json({ success: true })
}
