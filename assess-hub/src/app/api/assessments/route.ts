import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, queryOne, execute, isDuplicateEntryError } from '@/lib/sql-helpers'
import { newId } from '@/lib/id'
import type { Assessment, AssessmentType, Customer } from '@/types/db'

const MAX_NAME_LENGTH = 200

interface AssessmentRow extends Assessment {
  atId: string
  atName: string
  atIconColor: string
  responseCount: number
  totalQuestions: number
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const typeId = searchParams.get('typeId')
  const search = searchParams.get('search')

  // Build WHERE conditions
  const conditions: string[] = ['1=1']
  const params: unknown[] = []

  if (status) {
    conditions.push('a.status = ?')
    params.push(status)
  }

  if (typeId) {
    conditions.push('a.assessmentTypeId = ?')
    params.push(typeId)
  }

  if (search) {
    conditions.push('(a.name LIKE CONCAT(\'%\',?,\'%\') OR a.customerName LIKE CONCAT(\'%\',?,\'%\'))')
    params.push(search, search)
  }

  const sql = `
    SELECT a.*,
      at.id as atId, at.name as atName, at.iconColor as atIconColor,
      (SELECT COUNT(*) FROM Response r WHERE r.assessmentId = a.id) as responseCount,
      (SELECT COUNT(*) FROM Question q JOIN Category c ON c.id = q.categoryId WHERE c.assessmentTypeId = a.assessmentTypeId) as totalQuestions
    FROM Assessment a
    JOIN AssessmentType at ON at.id = a.assessmentTypeId
    WHERE ${conditions.join(' AND ')}
    ORDER BY a.updatedAt DESC
  `

  const rows = await query<AssessmentRow>(sql, params)

  // Transform to match expected API shape
  const enriched = rows.map(row => ({
    id: row.id,
    name: row.name,
    customerName: row.customerName,
    customerId: row.customerId,
    assessmentTypeId: row.assessmentTypeId,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    status: row.status,
    assessmentType: {
      id: row.atId,
      name: row.atName,
      iconColor: row.atIconColor
    },
    _count: {
      responses: row.responseCount
    },
    totalQuestions: row.totalQuestions,
    answeredQuestions: row.responseCount
  }))

  return NextResponse.json(enriched)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Validate required fields - now accepts customerId OR customerName
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!body.assessmentTypeId) {
    return NextResponse.json({ error: 'assessmentTypeId is required' }, { status: 400 })
  }
  if (!body.createdBy?.trim()) {
    return NextResponse.json({ error: 'createdBy is required' }, { status: 400 })
  }

  let customerId = body.customerId
  let customerName = body.customerName?.trim()

  // If customerId provided, verify it exists
  if (customerId) {
    const customer = await queryOne<Customer>(
      'SELECT * FROM Customer WHERE id = ?',
      [customerId]
    )
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 400 })
    }
    customerName = customer.name // Use customer's name for backward compat
  }
  // If only customerName provided, find or create customer
  else if (customerName) {
    // Validate customer name length before attempting to create
    if (customerName.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: 'Customer name must be 200 characters or less' },
        { status: 400 }
      )
    }

    let customer = await queryOne<Customer>(
      'SELECT * FROM Customer WHERE name = ?',
      [customerName]
    )
    if (!customer) {
      try {
        const customerId = newId()
        await execute(
          'INSERT INTO Customer (id, name, createdAt, updatedAt) VALUES (?, ?, NOW(3), NOW(3))',
          [customerId, customerName]
        )
        customer = { id: customerId, name: customerName, createdAt: new Date(), updatedAt: new Date() }
      } catch (error: unknown) {
        // Handle race condition where another request created the same customer
        if (isDuplicateEntryError(error)) {
          // Retry finding the customer that was just created
          customer = await queryOne<Customer>(
            'SELECT * FROM Customer WHERE name = ?',
            [customerName]
          )
          if (!customer) {
            // Extremely unlikely, but handle it gracefully
            return NextResponse.json(
              { error: 'Customer with this name already exists' },
              { status: 409 }
            )
          }
        } else {
          throw error
        }
      }
    }
    customerId = customer.id
  } else {
    return NextResponse.json(
      { error: 'Either customerId or customerName is required' },
      { status: 400 }
    )
  }

  // Verify assessment type exists
  const typeExists = await queryOne<AssessmentType>(
    'SELECT * FROM AssessmentType WHERE id = ?',
    [body.assessmentTypeId]
  )

  if (!typeExists) {
    return NextResponse.json(
      { error: 'Assessment type not found' },
      { status: 400 }
    )
  }

  // Create assessment
  const assessmentId = newId()
  await execute(
    `INSERT INTO Assessment (id, name, customerName, customerId, assessmentTypeId, createdBy, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', NOW(3), NOW(3))`,
    [assessmentId, body.name.trim(), customerName, customerId, body.assessmentTypeId, body.createdBy.trim()]
  )

  // Query back with includes
  const assessment = await queryOne<Assessment>(
    'SELECT * FROM Assessment WHERE id = ?',
    [assessmentId]
  )

  const assessmentType = await queryOne<AssessmentType>(
    'SELECT * FROM AssessmentType WHERE id = ?',
    [body.assessmentTypeId]
  )

  const customer = await queryOne<Customer>(
    'SELECT * FROM Customer WHERE id = ?',
    [customerId]
  )

  return NextResponse.json({
    ...assessment,
    assessmentType,
    customer
  }, { status: 201 })
}
