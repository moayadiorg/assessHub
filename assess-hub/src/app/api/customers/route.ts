import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, execute, isDuplicateEntryError } from '@/lib/sql-helpers'
import { newId } from '@/lib/id'

const MAX_NAME_LENGTH = 200

interface CustomerWithCount {
  id: string
  name: string
  createdAt: Date | string
  assessmentCount: number
}

// GET /api/customers - List all customers with assessment counts
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const params: any[] = []
    let whereClause = ''

    if (search) {
      whereClause = 'WHERE c.name LIKE CONCAT(\'%\', ?, \'%\')'
      params.push(search)
    }

    const customers = await query<CustomerWithCount>(
      `SELECT c.id, c.name, c.createdAt, COUNT(a.id) as assessmentCount
       FROM Customer c
       LEFT JOIN Assessment a ON a.customerId = c.id
       ${whereClause}
       GROUP BY c.id
       ORDER BY c.name ASC`,
      params
    )

    return NextResponse.json(customers.map(c => ({
      id: c.id,
      name: c.name,
      assessmentCount: c.assessmentCount,
      createdAt: new Date(c.createdAt).toISOString()
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
    const customerId = newId()
    const name = body.name.trim()

    await execute(
      `INSERT INTO Customer (id, name, createdAt, updatedAt)
       VALUES (?, ?, NOW(3), NOW(3))`,
      [customerId, name]
    )

    // Fetch the created customer
    const customers = await query<{ id: string; name: string; createdAt: Date | string; updatedAt: Date | string }>(
      'SELECT id, name, createdAt, updatedAt FROM Customer WHERE id = ?',
      [customerId]
    )

    const customer = customers[0]
    if (!customer) {
      throw new Error('Failed to retrieve created customer')
    }

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      createdAt: new Date(customer.createdAt).toISOString(),
      updatedAt: new Date(customer.updatedAt).toISOString()
    }, { status: 201 })
  } catch (error: any) {
    // Handle race condition on unique constraint
    if (isDuplicateEntryError(error)) {
      return NextResponse.json(
        { error: 'Customer with this name already exists' },
        { status: 409 }
      )
    }
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
