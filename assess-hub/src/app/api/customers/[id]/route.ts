import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, queryOne, execute, isDuplicateEntryError } from '@/lib/sql-helpers'

const MAX_NAME_LENGTH = 200

interface DbCustomer {
  id: string
  name: string
  createdAt: Date | string
  updatedAt: Date | string
}

interface DbAssessmentWithType {
  id: string
  customerId: string
  assessmentTypeId: string
  status: string
  createdAt: Date | string
  updatedAt: Date | string
  atId: string
  atName: string
  atIconColor: string
}

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

    const customer = await queryOne<DbCustomer>(
      'SELECT id, name, createdAt, updatedAt FROM Customer WHERE id = ?',
      [id]
    )

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Fetch assessments with type information
    const assessmentsData = await query<DbAssessmentWithType>(
      `SELECT a.id, a.customerId, a.assessmentTypeId, a.status, a.createdAt, a.updatedAt,
              at.id as atId, at.name as atName, at.iconColor as atIconColor
       FROM Assessment a
       JOIN AssessmentType at ON at.id = a.assessmentTypeId
       WHERE a.customerId = ?
       ORDER BY a.updatedAt DESC`,
      [id]
    )

    // Transform assessments to match expected format
    const assessments = assessmentsData.map(a => ({
      id: a.id,
      customerId: a.customerId,
      assessmentTypeId: a.assessmentTypeId,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      assessmentType: {
        id: a.atId,
        name: a.atName,
        iconColor: a.atIconColor
      }
    }))

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      assessmentCount: assessments.length,
      assessments,
      createdAt: new Date(customer.createdAt).toISOString(),
      updatedAt: new Date(customer.updatedAt).toISOString()
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
    const name = body.name.trim()

    const result = await execute(
      'UPDATE Customer SET name = ?, updatedAt = NOW(3) WHERE id = ?',
      [name, id]
    )

    // Check if customer was found
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Fetch updated customer
    const customer = await queryOne<DbCustomer>(
      'SELECT id, name, createdAt, updatedAt FROM Customer WHERE id = ?',
      [id]
    )

    if (!customer) {
      throw new Error('Failed to retrieve updated customer')
    }

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      createdAt: new Date(customer.createdAt).toISOString(),
      updatedAt: new Date(customer.updatedAt).toISOString()
    })
  } catch (error: any) {
    // Handle race condition on unique constraint
    if (isDuplicateEntryError(error)) {
      return NextResponse.json(
        { error: 'Customer with this name already exists' },
        { status: 409 }
      )
    }
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
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

  try {
    const customer = await queryOne<DbCustomer>(
      'SELECT id FROM Customer WHERE id = ?',
      [id]
    )

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check assessment count
    const assessments = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM Assessment WHERE customerId = ?',
      [id]
    )

    const assessmentCount = assessments[0]?.count || 0

    if (assessmentCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer with existing assessments' },
        { status: 400 }
      )
    }

    const result = await execute('DELETE FROM Customer WHERE id = ?', [id])

    // Handle race condition if customer was deleted between check and delete
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
