import { query, queryOne, execute } from '@/lib/sql-helpers'
import { newId } from '@/lib/id'
import { NextResponse } from 'next/server'

interface AssessmentTypeRow {
  id: string
  name: string
  description: string | null
  version: string
  iconColor: string
  isActive: number
  createdAt: Date
  updatedAt: Date
  categoryCount: number
  assessmentCount: number
}

/**
 * GET /api/assessment-types
 * Returns all assessment types with optional filtering
 * Query params:
 *   - active=true: Filter to only active types
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const sql = `
      SELECT
        at.id, at.name, at.description, at.version, at.iconColor,
        at.isActive, at.createdAt, at.updatedAt,
        (SELECT COUNT(*) FROM Category c WHERE c.assessmentTypeId = at.id) as categoryCount,
        (SELECT COUNT(*) FROM Assessment a WHERE a.assessmentTypeId = at.id) as assessmentCount
      FROM AssessmentType at
      ${activeOnly ? 'WHERE at.isActive = 1' : ''}
      ORDER BY at.createdAt DESC
    `

    const types = await query<AssessmentTypeRow>(sql, [])

    // Map to API response format
    const response = types.map(type => ({
      id: type.id,
      name: type.name,
      description: type.description,
      version: type.version,
      iconColor: type.iconColor,
      isActive: !!type.isActive,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
      _count: {
        categories: type.categoryCount,
        assessments: type.assessmentCount
      }
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching assessment types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessment types' },
      { status: 500 }
    )
  }
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

    const id = newId()
    const name = body.name.trim()
    const description = body.description?.trim() || null
    const version = body.version || '1.0'
    const iconColor = body.iconColor || '#3b82f6'

    await execute(
      `INSERT INTO AssessmentType
       (id, name, description, version, iconColor, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 1, NOW(3), NOW(3))`,
      [id, name, description, version, iconColor]
    )

    // Fetch the created type
    const type = await queryOne<AssessmentTypeRow>(
      `SELECT
        at.id, at.name, at.description, at.version, at.iconColor,
        at.isActive, at.createdAt, at.updatedAt,
        0 as categoryCount,
        0 as assessmentCount
      FROM AssessmentType at
      WHERE at.id = ?`,
      [id]
    )

    if (!type) {
      return NextResponse.json(
        { error: 'Failed to create assessment type' },
        { status: 500 }
      )
    }

    const response = {
      id: type.id,
      name: type.name,
      description: type.description,
      version: type.version,
      iconColor: type.iconColor,
      isActive: !!type.isActive,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
      _count: {
        categories: 0,
        assessments: 0
      }
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating assessment type:', error)
    return NextResponse.json(
      { error: 'Failed to create assessment type' },
      { status: 500 }
    )
  }
}
