import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const MAX_NAME_LENGTH = 200

// GET /api/customers - List all customers with assessment counts
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: { name?: { contains: string } } = {}
    if (search) {
      where.name = { contains: search }
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { assessments: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(customers.map(c => ({
      id: c.id,
      name: c.name,
      assessmentCount: c._count.assessments,
      createdAt: c.createdAt.toISOString()
    })))
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Customer name is required' },
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
    const customer = await prisma.customer.create({
      data: {
        name: body.name.trim()
      }
    })

    return NextResponse.json(customer, { status: 201 })
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
