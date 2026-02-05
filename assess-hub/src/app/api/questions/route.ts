import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function getDefaultLabel(score: number): string {
  const labels: Record<number, string> = {
    1: 'Initial',
    2: 'Managed',
    3: 'Defined',
    4: 'Quantitatively Managed',
    5: 'Optimizing'
  }
  return labels[score] || `Level ${score}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')

  if (!categoryId) {
    return NextResponse.json(
      { error: 'categoryId query parameter is required' },
      { status: 400 }
    )
  }

  const questions = await prisma.question.findMany({
    where: { categoryId },
    include: {
      options: { orderBy: { score: 'asc' } }
    },
    orderBy: { order: 'asc' }
  })

  return NextResponse.json(questions)
}

export async function POST(request: Request) {
  const body = await request.json()

  if (!body.categoryId || !body.text?.trim()) {
    return NextResponse.json(
      { error: 'categoryId and text are required' },
      { status: 400 }
    )
  }

  // Validate options - must have 5 levels
  if (!body.options || body.options.length !== 5) {
    return NextResponse.json(
      { error: 'Exactly 5 options (maturity levels 1-5) are required' },
      { status: 400 }
    )
  }

  // Get next order if not provided
  let order = body.order
  if (order === undefined) {
    const maxOrder = await prisma.question.aggregate({
      where: { categoryId: body.categoryId },
      _max: { order: true }
    })
    order = (maxOrder._max.order ?? 0) + 1
  }

  const question = await prisma.question.create({
    data: {
      categoryId: body.categoryId,
      text: body.text.trim(),
      description: body.description?.trim() || null,
      order,
      options: {
        create: body.options.map((opt: any, idx: number) => ({
          score: idx + 1,
          label: opt.label || getDefaultLabel(idx + 1),
          description: opt.description || '',
        }))
      }
    },
    include: {
      options: { orderBy: { score: 'asc' } }
    }
  })

  return NextResponse.json(question, { status: 201 })
}
