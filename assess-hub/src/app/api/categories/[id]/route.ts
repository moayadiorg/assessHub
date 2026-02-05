import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!category) {
    return NextResponse.json(
      { error: 'Category not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(category)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.category.findUnique({
    where: { id }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Category not found' },
      { status: 404 }
    )
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name: body.name?.trim() ?? existing.name,
      description: body.description !== undefined
        ? body.description?.trim() || null
        : existing.description,
      order: body.order ?? existing.order,
    }
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = await prisma.category.findUnique({
    where: { id }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Category not found' },
      { status: 404 }
    )
  }

  // Cascade delete will remove all questions and their options
  await prisma.category.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}
