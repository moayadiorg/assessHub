import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const MAX_NAME_LENGTH = 200

// GET /api/customers/[id] - Get customer details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        assessments: {
          include: {
            assessmentType: {
              select: { id: true, name: true, iconColor: true }
            }
          },
          orderBy: { updatedAt: 'desc' }
        },
        _count: {
          select: { assessments: true }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      assessmentCount: customer._count.assessments,
      assessments: customer.assessments,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString()
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

// PATCH /api/customers/[id] - Update customer
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  // Reject empty updates
  if (!body.name) {
    return NextResponse.json(
      { error: 'No fields to update' },
      { status: 400 }
    )
  }

  if (!body.name.trim()) {
    return NextResponse.json(
      { error: 'Customer name cannot be empty' },
      { status: 400 }
    )
  }

  // Validate length
  if (body.name.trim().length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: 'Customer name must be 200 characters or less' },
      { status: 400 }
    )
  }

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name.trim()
      }
    })

    return NextResponse.json(customer)
  } catch (error: any) {
    // Handle race condition on unique constraint
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Customer with this name already exists' },
        { status: 409 }
      )
    }
    throw error
  }
}

// DELETE /api/customers/[id] - Delete customer (only if no assessments)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: {
        select: { assessments: true }
      }
    }
  })

  if (!customer) {
    return NextResponse.json(
      { error: 'Customer not found' },
      { status: 404 }
    )
  }

  if (customer._count.assessments > 0) {
    return NextResponse.json(
      { error: 'Cannot delete customer with existing assessments' },
      { status: 400 }
    )
  }

  try {
    await prisma.customer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    // Handle race condition if customer was deleted between check and delete
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    throw error
  }
}
