import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const typeId = searchParams.get('typeId')

  if (!typeId) {
    return NextResponse.json(
      { error: 'typeId query parameter is required' },
      { status: 400 }
    )
  }

  const categories = await prisma.category.findMany({
    where: { assessmentTypeId: typeId },
    include: {
      _count: { select: { questions: true } }
    },
    orderBy: { order: 'asc' }
  })

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
    const maxOrder = await prisma.category.aggregate({
      where: { assessmentTypeId: body.assessmentTypeId },
      _max: { order: true }
    })
    order = (maxOrder._max.order ?? 0) + 1
  }

  const category = await prisma.category.create({
    data: {
      assessmentTypeId: body.assessmentTypeId,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      order,
    }
  })

  return NextResponse.json(category, { status: 201 })
}
