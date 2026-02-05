import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } }
      ]
    }

    if (role && VALID_ROLES.includes(role)) {
      where.role = role
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        createdBy: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt?.toISOString() || null,
      createdAt: u.createdAt.toISOString(),
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
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: body.name?.trim() || null,
        role: body.role,
        isActive: true,
        createdBy: session.user.id
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        createdBy: true
      }
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      createdBy: user.createdBy
    }, { status: 201 })
  } catch (error: any) {
    // Handle race condition on unique constraint
    if (error.code === 'P2002') {
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
