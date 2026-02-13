# Plan 13: Customer Model & Migration

## Overview

Add a proper Customer entity to the database for better data organization. Currently, assessments store `customerName` as a plain string field. This plan creates a Customer model with proper relations and migrates existing data.

## Dependencies

- None (can be implemented in parallel with Plan 12)

## Database Changes

### New Model: Customer

```prisma
model Customer {
  id          String       @id @default(cuid())
  name        String       @unique
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  assessments Assessment[]
}
```

### Updated Model: Assessment

```prisma
model Assessment {
  id               String         @id @default(cuid())
  name             String
  customerName     String         // KEEP for backward compatibility during migration
  customerId       String?        // Optional initially, required after migration
  customer         Customer?      @relation(fields: [customerId], references: [id])
  assessmentTypeId String
  assessmentType   AssessmentType @relation(fields: [assessmentTypeId], references: [id])
  createdBy        String
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  status           String         @default("draft")
  responses        Response[]
}
```

## Files to Create

### `prisma/schema.prisma` (MODIFY)

Add the Customer model and update Assessment model as shown above.

### `src/app/api/customers/route.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/customers - List all customers with assessment counts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')

  const where: any = {}
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
}

// POST /api/customers - Create a new customer
export async function POST(request: Request) {
  const body = await request.json()

  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: 'Customer name is required' },
      { status: 400 }
    )
  }

  // Check for duplicate name
  const existing = await prisma.customer.findUnique({
    where: { name: body.name.trim() }
  })

  if (existing) {
    return NextResponse.json(
      { error: 'Customer with this name already exists' },
      { status: 409 }
    )
  }

  const customer = await prisma.customer.create({
    data: {
      name: body.name.trim()
    }
  })

  return NextResponse.json(customer, { status: 201 })
}
```

### `src/app/api/customers/[id]/route.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/customers/[id] - Get customer details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
}

// PATCH /api/customers/[id] - Update customer
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  if (body.name !== undefined && !body.name?.trim()) {
    return NextResponse.json(
      { error: 'Customer name cannot be empty' },
      { status: 400 }
    )
  }

  // Check for duplicate name (if name is being changed)
  if (body.name) {
    const existing = await prisma.customer.findFirst({
      where: {
        name: body.name.trim(),
        NOT: { id }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Customer with this name already exists' },
        { status: 409 }
      )
    }
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name.trim() })
    }
  })

  return NextResponse.json(customer)
}

// DELETE /api/customers/[id] - Delete customer (only if no assessments)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  await prisma.customer.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
```

## Files to Modify

### `src/app/api/assessments/route.ts`

Update POST to accept `customerId` OR `customerName`:

```typescript
export async function POST(request: Request) {
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
    let customer = await prisma.customer.findUnique({
      where: { name: customerName }
    })
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name: customerName }
      })
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
```

### `src/app/assessments/new/page.tsx`

Add customer dropdown/autocomplete:

1. Fetch customers on mount: `GET /api/customers`
2. Add combobox for customer selection (existing or new)
3. Send `customerId` instead of `customerName` when submitting

```typescript
// Add state for customers
const [customers, setCustomers] = useState<Customer[]>([])
const [selectedCustomerId, setSelectedCustomerId] = useState('')
const [newCustomerName, setNewCustomerName] = useState('')
const [isNewCustomer, setIsNewCustomer] = useState(false)

// Fetch customers
useEffect(() => {
  fetch('/api/customers')
    .then(res => res.json())
    .then(setCustomers)
}, [])

// In form submission
const submitData = isNewCustomer
  ? { ...baseData, customerName: newCustomerName }
  : { ...baseData, customerId: selectedCustomerId }
```

## Migration Strategy

### Step 1: Schema Migration (Additive)

```bash
npx prisma migrate dev --name add_customer_model
```

This adds:
- Customer model
- Optional customerId field on Assessment
- Relation between Assessment and Customer

### Step 2: Data Migration Script

Create `prisma/migrations/migrate-customers.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateCustomers() {
  // Get all unique customer names
  const assessments = await prisma.assessment.findMany({
    select: { customerName: true },
    distinct: ['customerName']
  })

  const uniqueNames = [...new Set(assessments.map(a => a.customerName))]

  console.log(`Found ${uniqueNames.length} unique customer names`)

  // Create Customer records
  for (const name of uniqueNames) {
    const customer = await prisma.customer.upsert({
      where: { name },
      update: {},
      create: { name }
    })

    // Update all assessments with this customer name
    await prisma.assessment.updateMany({
      where: { customerName: name },
      data: { customerId: customer.id }
    })

    console.log(`Migrated customer: ${name}`)
  }

  console.log('Migration complete!')
}

migrateCustomers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run with: `npx ts-node prisma/migrations/migrate-customers.ts`

### Step 3: Make customerId Required (Optional Future Step)

After verifying migration success:

```prisma
model Assessment {
  // Change from optional to required
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])
}
```

Then run: `npx prisma migrate dev --name make_customer_required`

**Note:** The `customerName` field can be kept as denormalized data for display optimization, or removed in a future cleanup.

## API Response Schema

### GET /api/customers

```typescript
interface Customer {
  id: string
  name: string
  assessmentCount: number
  createdAt: string
}

type Response = Customer[]
```

### GET /api/customers/[id]

```typescript
interface CustomerDetail {
  id: string
  name: string
  assessmentCount: number
  assessments: Assessment[]
  createdAt: string
  updatedAt: string
}
```

### POST /api/customers

Request:
```typescript
{ name: string }
```

Response: `Customer` (201 Created)

## Testing Checklist

- [ ] Customer model created in database
- [ ] GET /api/customers returns all customers with counts
- [ ] GET /api/customers?search=x filters by name
- [ ] POST /api/customers creates new customer
- [ ] POST /api/customers rejects duplicate names
- [ ] GET /api/customers/[id] returns customer details
- [ ] PATCH /api/customers/[id] updates customer name
- [ ] DELETE /api/customers/[id] works for customers without assessments
- [ ] DELETE /api/customers/[id] rejects customers with assessments
- [ ] POST /api/assessments accepts customerId
- [ ] POST /api/assessments accepts customerName and creates/finds customer
- [ ] New assessment form shows customer dropdown
- [ ] Migration script correctly creates customers from existing data
- [ ] Migration script correctly links assessments to customers

## Edge Cases

1. **Empty customer name** - Reject with 400
2. **Duplicate customer name** - Reject with 409
3. **Delete customer with assessments** - Reject with 400
4. **Customer not found on GET** - Return 404
5. **Assessment with non-existent customerId** - Reject with 400
