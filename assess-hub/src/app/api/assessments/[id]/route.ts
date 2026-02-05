import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      assessmentType: {
        include: {
          categories: {
            orderBy: { order: 'asc' },
            include: {
              questions: {
                orderBy: { order: 'asc' },
                include: {
                  options: {
                    orderBy: { score: 'asc' }
                  }
                }
              }
            }
          }
        }
      },
      responses: true
    }
  })

  if (!assessment) {
    return NextResponse.json(
      { error: 'Assessment not found' },
      { status: 404 }
    )
  }

  // Convert responses to a map for easier lookup
  const responsesMap = assessment.responses.reduce((acc, r) => {
    acc[r.questionId] = r
    return acc
  }, {} as Record<string, typeof assessment.responses[0]>)

  return NextResponse.json({
    ...assessment,
    responsesMap
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.assessment.findUnique({
    where: { id }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Assessment not found' },
      { status: 404 }
    )
  }

  // Validate status transition
  const validStatuses = ['draft', 'in-progress', 'completed']
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: 'Invalid status' },
      { status: 400 }
    )
  }

  const updated = await prisma.assessment.update({
    where: { id },
    data: {
      name: body.name?.trim() ?? existing.name,
      customerName: body.customerName?.trim() ?? existing.customerName,
      status: body.status ?? existing.status,
    },
    include: {
      assessmentType: true
    }
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const existing = await prisma.assessment.findUnique({
    where: { id }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Assessment not found' },
      { status: 404 }
    )
  }

  // Delete assessment (responses will cascade delete automatically)
  await prisma.assessment.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}
