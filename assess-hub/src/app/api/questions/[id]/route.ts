import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      options: { orderBy: { score: 'asc' } }
    }
  })

  if (!question) {
    return NextResponse.json(
      { error: 'Question not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(question)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.question.findUnique({
    where: { id },
    include: { options: true }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Question not found' },
      { status: 404 }
    )
  }

  // Update question and options in transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Update question fields
    const question = await tx.question.update({
      where: { id },
      data: {
        text: body.text?.trim() ?? existing.text,
        description: body.description !== undefined
          ? body.description?.trim() || null
          : existing.description,
        order: body.order ?? existing.order,
      }
    })

    // Update options if provided
    if (body.options && Array.isArray(body.options)) {
      for (const opt of body.options) {
        if (opt.id) {
          await tx.questionOption.update({
            where: { id: opt.id },
            data: {
              label: opt.label,
              description: opt.description,
            }
          })
        }
      }
    }

    return tx.question.findUnique({
      where: { id },
      include: { options: { orderBy: { score: 'asc' } } }
    })
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = await prisma.question.findUnique({
    where: { id }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Question not found' },
      { status: 404 }
    )
  }

  // Cascade delete will remove all options
  await prisma.question.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}
