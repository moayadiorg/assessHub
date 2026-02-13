import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query, queryOne, execute, isDuplicateEntryError } from '@/lib/sql-helpers'
import { newId } from '@/lib/id'
import type { DbUser } from '@/types/db'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_ROLES = ['admin', 'sa', 'reader']

// GET /api/users - List all users (admin only)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin role
  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const role = searchParams.get('role')

    // Build dynamic WHERE clause
    const conditions: string[] = []
    const params: any[] = []

    if (search) {
      conditions.push('(email LIKE CONCAT(\'%\', ?, \'%\') OR name LIKE CONCAT(\'%\', ?, \'%\'))')
      params.push(search, search)
    }

    if (role && VALID_ROLES.includes(role)) {
      conditions.push('role = ?')
      params.push(role)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const users = await query<DbUser>(
      `SELECT id, email, name, role, isActive, lastLoginAt, createdAt, createdBy
       FROM User
       ${whereClause}
       ORDER BY createdAt DESC`,
      params
    )

    return NextResponse.json(users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: !!u.isActive,
      lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null,
      createdAt: new Date(u.createdAt).toISOString(),
      createdBy: u.createdBy
    })))
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Pre-authorize new user (admin only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin role
  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    )
  }

  const body = await request.json()

  // Validate required fields
  if (!body.email?.trim()) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    )
  }

  // Validate email format
  const email = body.email.trim().toLowerCase()
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: 'Invalid email format' },
      { status: 400 }
    )
  }

  // Validate role
  if (!body.role || !VALID_ROLES.includes(body.role)) {
    return NextResponse.json(
      { error: 'Valid role is required (admin, sa, or reader)' },
      { status: 400 }
    )
  }

  try {
    // Check if email already exists
    const existing = await queryOne<DbUser>(
      'SELECT id FROM User WHERE email = ?',
      [email]
    )

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create user
    const userId = newId()
    const name = body.name?.trim() || null

    await execute(
      `INSERT INTO User (id, email, name, role, isActive, createdBy, createdAt)
       VALUES (?, ?, ?, ?, 1, ?, NOW(3))`,
      [userId, email, name, body.role, session.user.id]
    )

    // Fetch the created user
    const user = await queryOne<DbUser>(
      `SELECT id, email, name, role, isActive, lastLoginAt, createdAt, createdBy
       FROM User
       WHERE id = ?`,
      [userId]
    )

    if (!user) {
      throw new Error('Failed to retrieve created user')
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: !!user.isActive,
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
      createdAt: new Date(user.createdAt).toISOString(),
      createdBy: user.createdBy
    }, { status: 201 })
  } catch (error: any) {
    // Handle race condition on unique constraint
    if (isDuplicateEntryError(error)) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
