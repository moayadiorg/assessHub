# Plan 04: Admin Assessment Types UI

## Overview
Build the admin interface for managing Assessment Types - listing, creating, editing, and deleting assessment templates.

## Dependencies
- **Plan 01**: Assessment Types API must be complete

## Files to Create

### 1. `assess-hub/src/app/admin/page.tsx`
Admin dashboard with navigation cards to different admin sections.

### 2. `assess-hub/src/app/admin/layout.tsx`
Admin layout wrapper (optional - can use main layout).

### 3. `assess-hub/src/app/admin/types/page.tsx`
List of all assessment types with actions.

### 4. `assess-hub/src/app/admin/types/new/page.tsx`
Form to create a new assessment type.

### 5. `assess-hub/src/app/admin/types/[id]/page.tsx`
Edit existing assessment type.

### 6. `assess-hub/src/components/admin/AssessmentTypeCard.tsx`
Card component for displaying an assessment type.

### 7. `assess-hub/src/components/admin/AssessmentTypeForm.tsx`
Reusable form for create/edit.

## UI Components Required

From Radix UI Themes:
- Card, Flex, Box, Grid, Text
- Button, IconButton
- TextField, TextArea
- Select (for icon color)
- Dialog (for delete confirmation)
- Badge (for status)
- AlertDialog (for confirmations)

## Implementation Details

### Admin Dashboard (`/admin/page.tsx`)
```tsx
import { Box, Card, Grid, Text, Flex } from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import {
  FileTextIcon,
  ListBulletIcon,
  UploadIcon,
} from '@radix-ui/react-icons'

export default function AdminPage() {
  return (
    <Box>
      <Header title="Admin Dashboard" />
      <Box p="6">
        <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
          <AdminCard
            href="/admin/types"
            icon={<FileTextIcon width={24} height={24} />}
            title="Assessment Types"
            description="Create and manage assessment templates"
          />
          <AdminCard
            href="/admin/questions"
            icon={<ListBulletIcon width={24} height={24} />}
            title="Questions Editor"
            description="Edit categories and questions"
          />
          <AdminCard
            href="/admin/import"
            icon={<UploadIcon width={24} height={24} />}
            title="CSV Import"
            description="Bulk import assessment structures"
          />
        </Grid>
      </Box>
    </Box>
  )
}

function AdminCard({ href, icon, title, description }) {
  return (
    <Link href={href}>
      <Card style={{ cursor: 'pointer' }} className="hover:bg-gray-2">
        <Flex gap="3" align="start">
          <Box style={{ color: 'var(--accent-9)' }}>{icon}</Box>
          <Box>
            <Text size="4" weight="bold">{title}</Text>
            <Text size="2" color="gray">{description}</Text>
          </Box>
        </Flex>
      </Card>
    </Link>
  )
}
```

### Types List Page (`/admin/types/page.tsx`)
```tsx
'use client'

import { useState, useEffect } from 'react'
import { Box, Card, Flex, Text, Button, Grid, Badge, AlertDialog } from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { AssessmentTypeCard } from '@/components/admin/AssessmentTypeCard'
import Link from 'next/link'
import { PlusIcon } from '@radix-ui/react-icons'

interface AssessmentType {
  id: string
  name: string
  description: string | null
  version: string
  iconColor: string
  isActive: boolean
  _count: {
    categories: number
    assessments: number
  }
}

export default function AdminTypesPage() {
  const [types, setTypes] = useState<AssessmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchTypes()
  }, [])

  async function fetchTypes() {
    const res = await fetch('/api/assessment-types')
    const data = await res.json()
    setTypes(data)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/assessment-types/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    fetchTypes()
  }

  return (
    <Box>
      <Header title="Assessment Types" />
      <Box p="6">
        <Flex justify="between" align="center" mb="6">
          <Text size="5" weight="bold">
            {types.length} Assessment Type{types.length !== 1 && 's'}
          </Text>
          <Button asChild>
            <Link href="/admin/types/new">
              <PlusIcon /> Create New Type
            </Link>
          </Button>
        </Flex>

        {loading ? (
          <Text>Loading...</Text>
        ) : types.length === 0 ? (
          <Card>
            <Flex direction="column" align="center" py="8">
              <Text size="4" color="gray" mb="4">
                No assessment types yet
              </Text>
              <Button asChild>
                <Link href="/admin/types/new">Create Your First Type</Link>
              </Button>
            </Flex>
          </Card>
        ) : (
          <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
            {types.map((type) => (
              <AssessmentTypeCard
                key={type.id}
                type={type}
                onDelete={() => setDeleteId(type.id)}
              />
            ))}
          </Grid>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog.Root open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialog.Content>
            <AlertDialog.Title>Delete Assessment Type</AlertDialog.Title>
            <AlertDialog.Description>
              Are you sure? This action cannot be undone.
            </AlertDialog.Description>
            <Flex gap="3" mt="4" justify="end">
              <AlertDialog.Cancel>
                <Button variant="soft" color="gray">Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action>
                <Button color="red" onClick={() => deleteId && handleDelete(deleteId)}>
                  Delete
                </Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
      </Box>
    </Box>
  )
}
```

### Assessment Type Card Component
```tsx
// assess-hub/src/components/admin/AssessmentTypeCard.tsx
'use client'

import { Card, Flex, Box, Text, Badge, IconButton, DropdownMenu } from '@radix-ui/themes'
import Link from 'next/link'
import { DotsVerticalIcon, Pencil1Icon, TrashIcon, EyeOpenIcon } from '@radix-ui/react-icons'

interface AssessmentTypeCardProps {
  type: {
    id: string
    name: string
    description: string | null
    version: string
    iconColor: string
    isActive: boolean
    _count: {
      categories: number
      assessments: number
    }
  }
  onDelete: () => void
}

export function AssessmentTypeCard({ type, onDelete }: AssessmentTypeCardProps) {
  return (
    <Card>
      <Flex justify="between" align="start" mb="3">
        <Flex gap="2" align="center">
          <Box
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: type.iconColor,
            }}
          />
          <Text size="4" weight="bold">{type.name}</Text>
        </Flex>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <IconButton variant="ghost" size="1">
              <DotsVerticalIcon />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item asChild>
              <Link href={`/admin/types/${type.id}`}>
                <Pencil1Icon /> Edit
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link href={`/admin/questions/${type.id}`}>
                <EyeOpenIcon /> Manage Questions
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item color="red" onClick={onDelete}>
              <TrashIcon /> Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>

      {type.description && (
        <Text size="2" color="gray" mb="3" style={{ display: 'block' }}>
          {type.description}
        </Text>
      )}

      <Flex gap="2" mb="3">
        <Badge variant="soft">v{type.version}</Badge>
        {!type.isActive && <Badge color="red">Inactive</Badge>}
      </Flex>

      <Flex gap="4">
        <Text size="2" color="gray">
          {type._count.categories} categories
        </Text>
        <Text size="2" color="gray">
          {type._count.assessments} assessments
        </Text>
      </Flex>
    </Card>
  )
}
```

### Assessment Type Form Component
```tsx
// assess-hub/src/components/admin/AssessmentTypeForm.tsx
'use client'

import { useState } from 'react'
import { Box, Flex, Text, TextField, TextArea, Button, Select } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'

const COLOR_OPTIONS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#64748b', label: 'Slate' },
]

interface AssessmentTypeFormProps {
  initialData?: {
    id: string
    name: string
    description: string | null
    version: string
    iconColor: string
    isActive: boolean
  }
}

export function AssessmentTypeForm({ initialData }: AssessmentTypeFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [version, setVersion] = useState(initialData?.version || '1.0')
  const [iconColor, setIconColor] = useState(initialData?.iconColor || '#3b82f6')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const url = initialData
        ? `/api/assessment-types/${initialData.id}`
        : '/api/assessment-types'
      const method = initialData ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, version, iconColor }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      router.push('/admin/types')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      {error && (
        <Text color="red" size="2" mb="4" style={{ display: 'block' }}>
          {error}
        </Text>
      )}

      <Flex direction="column" gap="4">
        <Box>
          <Text as="label" size="2" weight="bold" mb="1" style={{ display: 'block' }}>
            Name *
          </Text>
          <TextField.Root
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Cloud Maturity Model"
            required
          />
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="1" style={{ display: 'block' }}>
            Description
          </Text>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this assessment type"
            rows={3}
          />
        </Box>

        <Flex gap="4">
          <Box style={{ flex: 1 }}>
            <Text as="label" size="2" weight="bold" mb="1" style={{ display: 'block' }}>
              Version
            </Text>
            <TextField.Root
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0"
            />
          </Box>

          <Box style={{ flex: 1 }}>
            <Text as="label" size="2" weight="bold" mb="1" style={{ display: 'block' }}>
              Color
            </Text>
            <Select.Root value={iconColor} onValueChange={setIconColor}>
              <Select.Trigger style={{ width: '100%' }} />
              <Select.Content>
                {COLOR_OPTIONS.map((color) => (
                  <Select.Item key={color.value} value={color.value}>
                    <Flex align="center" gap="2">
                      <Box
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: color.value,
                        }}
                      />
                      {color.label}
                    </Flex>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>
        </Flex>

        <Flex gap="3" mt="4">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : initialData ? 'Update' : 'Create'}
          </Button>
          <Button type="button" variant="soft" color="gray" onClick={() => router.back()}>
            Cancel
          </Button>
        </Flex>
      </Flex>
    </Box>
  )
}
```

### Create New Type Page
```tsx
// assess-hub/src/app/admin/types/new/page.tsx
import { Box, Card } from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { AssessmentTypeForm } from '@/components/admin/AssessmentTypeForm'

export default function NewTypePage() {
  return (
    <Box>
      <Header title="Create Assessment Type" />
      <Box p="6">
        <Card style={{ maxWidth: 600 }}>
          <AssessmentTypeForm />
        </Card>
      </Box>
    </Box>
  )
}
```

### Edit Type Page
```tsx
// assess-hub/src/app/admin/types/[id]/page.tsx
import { Box, Card } from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { AssessmentTypeForm } from '@/components/admin/AssessmentTypeForm'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function EditTypePage({
  params,
}: {
  params: { id: string }
}) {
  const type = await prisma.assessmentType.findUnique({
    where: { id: params.id },
  })

  if (!type) {
    notFound()
  }

  return (
    <Box>
      <Header title={`Edit: ${type.name}`} />
      <Box p="6">
        <Card style={{ maxWidth: 600 }}>
          <AssessmentTypeForm initialData={type} />
        </Card>
      </Box>
    </Box>
  )
}
```

## Testing Checklist
- [ ] Admin dashboard shows three navigation cards
- [ ] Types list page loads and displays all types
- [ ] Empty state shows when no types exist
- [ ] Create form validates required fields
- [ ] Create form submits and redirects
- [ ] Edit form loads existing data
- [ ] Edit form updates and redirects
- [ ] Delete confirmation dialog works
- [ ] Delete removes type from list
- [ ] Color picker shows colored dots

## Completion Criteria
- All pages render correctly
- CRUD operations work via API
- Form validation provides feedback
- Navigation between pages works
- Responsive layout on mobile
