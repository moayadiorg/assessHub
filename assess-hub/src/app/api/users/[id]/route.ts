import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryOne, execute } from '@/lib/sql-helpers'
import type { DbUser } from '@/types/db'

const VALID_ROLES = ['admin', 'sa', 'reader']

// GET /api/users/[id] - Get user details (admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    const user = await queryOne<DbUser>(
      `SELECT id, email, name, role, isActive, lastLoginAt, createdAt, createdBy, image
       FROM User
       WHERE id = ?`,
      [id]
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: !!user.isActive,
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
      createdAt: new Date(user.createdAt).toISOString(),
      createdBy: user.createdBy,
      image: user.image
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id] - Update user (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params
  const body = await request.json()

  // Prevent admin from deactivating themselves
  if (id === session.user.id && body.isActive === false) {
    return NextResponse.json(
      { error: 'You cannot deactivate your own account' },
      { status: 400 }
    )
  }

  // Validate role if provided
  if (body.role !== undefined && !VALID_ROLES.includes(body.role)) {
    return NextResponse.json(
      { error: 'Invalid role. Must be admin, sa, or reader' },
      { status: 400 }
    )
  }

  try {
    // Check if user exists
    const existing = await queryOne<DbUser>(
      'SELECT id FROM User WHERE id = ?',
      [id]
    )

    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build dynamic SET clause
    const setClauses: string[] = []
    const params: any[] = []

    if (body.role !== undefined) {
      setClauses.push('role = ?')
      params.push(body.role)
    }

    if (body.isActive !== undefined) {
      setClauses.push('isActive = ?')
      params.push(body.isActive ? 1 : 0)
    }

    if (body.name !== undefined) {
      setClauses.push('name = ?')
      params.push(body.name?.trim() || null)
    }

    // Reject empty updates
    if (setClauses.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Add updatedAt
    setClauses.push('updatedAt = NOW(3)')

    // Add id to params
    params.push(id)

    await execute(
      `UPDATE User SET ${setClauses.join(', ')} WHERE id = ?`,
      params
    )

    // Fetch updated user
    const user = await queryOne<DbUser>(
      `SELECT id, email, name, role, isActive, lastLoginAt, createdAt, createdBy
       FROM User
       WHERE id = ?`,
      [id]
    )

    if (!user) {
      throw new Error('Failed to retrieve updated user')
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
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Remove user (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  // Prevent admin from deleting themselves
  if (id === session.user.id) {
    return NextResponse.json(
      { error: 'You cannot delete your own account' },
      { status: 400 }
    )
  }

  try {
    const user = await queryOne<DbUser>(
      'SELECT id FROM User WHERE id = ?',
      [id]
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user (cascade will handle accounts and sessions)
    const result = await execute('DELETE FROM User WHERE id = ?', [id])

    // Handle race condition if user was deleted between check and delete
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
