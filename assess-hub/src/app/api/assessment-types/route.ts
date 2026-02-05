import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * GET /api/assessment-types
 * Returns all assessment types with optional filtering
 * Query params:
 *   - active=true: Filter to only active types
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') === 'true'

  const types = await prisma.assessmentType.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    include: {
      _count: {
        select: { categories: true, assessments: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(types)
}

/**
 * POST /api/assessment-types
 * Creates a new assessment type
 * Body: { name, description?, version?, iconColor? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const type = await prisma.assessmentType.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        version: body.version || '1.0',
        iconColor: body.iconColor || '#3b82f6',
      }
    })

    return NextResponse.json(type, { status: 201 })
  } catch (error) {
    console.error('Error creating assessment type:', error)
    return NextResponse.json(
      { error: 'Failed to create assessment type' },
      { status: 500 }
    )
  }
}
