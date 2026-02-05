import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * GET /api/assessment-types/[id]
 * Returns a single assessment type with full nested structure
 * Includes categories, questions, and options
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const type = await prisma.assessmentType.findUnique({
      where: { id },
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
    })

    if (!type) {
      return NextResponse.json(
        { error: 'Assessment type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(type)
  } catch (error) {
    console.error('Error fetching assessment type:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessment type' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/assessment-types/[id]
 * Updates assessment type metadata
 * Body: { name?, description?, version?, iconColor?, isActive? }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if assessment type exists
    const existing = await prisma.assessmentType.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Assessment type not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.assessmentType.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? existing.name,
        description: body.description !== undefined
          ? body.description?.trim() || null
          : existing.description,
        version: body.version ?? existing.version,
        iconColor: body.iconColor ?? existing.iconColor,
        isActive: body.isActive ?? existing.isActive,
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating assessment type:', error)
    return NextResponse.json(
      { error: 'Failed to update assessment type' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/assessment-types/[id]
 * Deletes an assessment type
 * - Soft delete (isActive = false) if assessments exist
 * - Hard delete if no assessments exist
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check for existing assessments
    const assessmentCount = await prisma.assessment.count({
      where: { assessmentTypeId: id }
    })

    if (assessmentCount > 0) {
      // Soft delete - mark as inactive
      const updated = await prisma.assessmentType.update({
        where: { id },
        data: { isActive: false }
      })
      return NextResponse.json({
        ...updated,
        _note: 'Soft deleted due to existing assessments'
      })
    }

    // Hard delete - no assessments exist
    await prisma.assessmentType.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting assessment type:', error)

    // Handle case where type doesn't exist
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Assessment type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete assessment type' },
      { status: 500 }
    )
  }
}
