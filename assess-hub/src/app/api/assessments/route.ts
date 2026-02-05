import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const MAX_NAME_LENGTH = 200

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const typeId = searchParams.get('typeId')
  const search = searchParams.get('search')

  const where: any = {}

  if (status) {
    where.status = status
  }

  if (typeId) {
    where.assessmentTypeId = typeId
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { customerName: { contains: search } }
    ]
  }

  const assessments = await prisma.assessment.findMany({
    where,
    include: {
      assessmentType: {
        select: { id: true, name: true, iconColor: true }
      },
      _count: {
        select: { responses: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  // Add question count for progress calculation
  const enriched = await Promise.all(
    assessments.map(async (assessment) => {
      const totalQuestions = await prisma.question.count({
        where: {
          category: {
            assessmentTypeId: assessment.assessmentTypeId
          }
        }
      })
      return {
        ...assessment,
        totalQuestions,
        answeredQuestions: assessment._count.responses
      }
    })
  )

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
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })
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

    let customer = await prisma.customer.findUnique({
      where: { name: customerName }
    })
    if (!customer) {
      try {
        customer = await prisma.customer.create({
          data: { name: customerName }
        })
      } catch (error: any) {
        // Handle race condition where another request created the same customer
        if (error.code === 'P2002') {
          // Retry finding the customer that was just created
          customer = await prisma.customer.findUnique({
            where: { name: customerName }
          })
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
  const typeExists = await prisma.assessmentType.findUnique({
    where: { id: body.assessmentTypeId }
  })

  if (!typeExists) {
    return NextResponse.json(
      { error: 'Assessment type not found' },
      { status: 400 }
    )
  }

  const assessment = await prisma.assessment.create({
    data: {
      name: body.name.trim(),
      customerName, // Keep for backward compatibility
      customerId,   // New relation
      assessmentTypeId: body.assessmentTypeId,
      createdBy: body.createdBy.trim(),
      status: 'draft'
    },
    include: {
      assessmentType: true,
      customer: true
    }
  })

  return NextResponse.json(assessment, { status: 201 })
}
