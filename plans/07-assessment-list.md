# Plan 07: Assessment List Page

## Overview
Build the assessment list page where users can view, filter, search, and manage their assessments.

## Dependencies
- **Plan 01**: Assessment Types API
- **Plan 03**: Assessments API

## Files to Create

### 1. `assess-hub/src/app/assessments/page.tsx`
Main assessments list page with table and filters.

### 2. `assess-hub/src/app/assessments/new/page.tsx`
Page to create a new assessment (select type, enter details).

### 3. `assess-hub/src/components/assessment/AssessmentTable.tsx`
Table component for displaying assessments.

### 4. `assess-hub/src/components/assessment/AssessmentFilters.tsx`
Filter controls (status, type, search).

### 5. `assess-hub/src/components/assessment/NewAssessmentForm.tsx`
Form for creating new assessment.

### 6. `assess-hub/src/hooks/useAssessments.ts`
Custom hook for fetching and filtering assessments.

## Implementation Details

### Assessments List Page
```tsx
// assess-hub/src/app/assessments/page.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Flex,
  Text,
  Button,
  TextField,
  Select,
  Card,
} from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { AssessmentTable } from '@/components/assessment/AssessmentTable'
import Link from 'next/link'
import { PlusIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons'

interface Assessment {
  id: string
  name: string
  customerName: string
  status: string
  createdAt: string
  updatedAt: string
  assessmentType: {
    id: string
    name: string
    iconColor: string
  }
  totalQuestions: number
  answeredQuestions: number
}

interface AssessmentType {
  id: string
  name: string
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [types, setTypes] = useState<AssessmentType[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchTypes()
    fetchAssessments()
  }, [])

  async function fetchTypes() {
    const res = await fetch('/api/assessment-types?active=true')
    const data = await res.json()
    setTypes(data)
  }

  async function fetchAssessments() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (typeFilter !== 'all') params.set('typeId', typeFilter)
    if (search) params.set('search', search)

    const res = await fetch(`/api/assessments?${params}`)
    const data = await res.json()
    setAssessments(data)
    setLoading(false)
  }

  // Refetch when filters change
  useEffect(() => {
    const timer = setTimeout(fetchAssessments, 300) // Debounce search
    return () => clearTimeout(timer)
  }, [search, statusFilter, typeFilter])

  async function handleDelete(id: string) {
    if (!confirm('Delete this assessment?')) return
    await fetch(`/api/assessments/${id}`, { method: 'DELETE' })
    fetchAssessments()
  }

  return (
    <Box>
      <Header title="Assessments" />
      <Box p="6">
        {/* Header with filters */}
        <Flex justify="between" align="end" mb="6" wrap="wrap" gap="4">
          <Flex gap="3" align="end" wrap="wrap">
            {/* Search */}
            <Box>
              <Text size="2" color="gray" mb="1" style={{ display: 'block' }}>
                Search
              </Text>
              <TextField.Root
                placeholder="Name or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 200 }}
              >
                <TextField.Slot>
                  <MagnifyingGlassIcon />
                </TextField.Slot>
              </TextField.Root>
            </Box>

            {/* Status Filter */}
            <Box>
              <Text size="2" color="gray" mb="1" style={{ display: 'block' }}>
                Status
              </Text>
              <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
                <Select.Trigger style={{ width: 150 }} />
                <Select.Content>
                  <Select.Item value="all">All Statuses</Select.Item>
                  <Select.Item value="draft">Draft</Select.Item>
                  <Select.Item value="in-progress">In Progress</Select.Item>
                  <Select.Item value="completed">Completed</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Type Filter */}
            <Box>
              <Text size="2" color="gray" mb="1" style={{ display: 'block' }}>
                Type
              </Text>
              <Select.Root value={typeFilter} onValueChange={setTypeFilter}>
                <Select.Trigger style={{ width: 180 }} />
                <Select.Content>
                  <Select.Item value="all">All Types</Select.Item>
                  {types.map((type) => (
                    <Select.Item key={type.id} value={type.id}>
                      {type.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>

          <Button asChild>
            <Link href="/assessments/new">
              <PlusIcon /> New Assessment
            </Link>
          </Button>
        </Flex>

        {/* Results */}
        {loading ? (
          <Card>
            <Flex justify="center" py="8">
              <Text color="gray">Loading...</Text>
            </Flex>
          </Card>
        ) : assessments.length === 0 ? (
          <Card>
            <Flex direction="column" align="center" py="8">
              <Text size="4" color="gray" mb="4">
                No assessments found
              </Text>
              {search || statusFilter !== 'all' || typeFilter !== 'all' ? (
                <Button
                  variant="soft"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                    setTypeFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/assessments/new">Create Your First Assessment</Link>
                </Button>
              )}
            </Flex>
          </Card>
        ) : (
          <>
            <Text size="2" color="gray" mb="3">
              {assessments.length} assessment{assessments.length !== 1 && 's'}
            </Text>
            <AssessmentTable
              assessments={assessments}
              onDelete={handleDelete}
            />
          </>
        )}
      </Box>
    </Box>
  )
}
```

### Assessment Table Component
```tsx
// assess-hub/src/components/assessment/AssessmentTable.tsx
'use client'

import {
  Table,
  Badge,
  IconButton,
  DropdownMenu,
  Flex,
  Text,
  Progress,
} from '@radix-ui/themes'
import Link from 'next/link'
import {
  DotsVerticalIcon,
  Pencil1Icon,
  TrashIcon,
  BarChartIcon,
  FileTextIcon,
} from '@radix-ui/react-icons'

interface Assessment {
  id: string
  name: string
  customerName: string
  status: string
  createdAt: string
  updatedAt: string
  assessmentType: {
    id: string
    name: string
    iconColor: string
  }
  totalQuestions: number
  answeredQuestions: number
}

interface AssessmentTableProps {
  assessments: Assessment[]
  onDelete: (id: string) => void
}

export function AssessmentTable({ assessments, onDelete }: AssessmentTableProps) {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Assessment</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Customer</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Progress</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Updated</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell width="50px"></Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {assessments.map((assessment) => (
          <Table.Row key={assessment.id}>
            <Table.Cell>
              <Link
                href={`/assessments/${assessment.id}`}
                style={{ textDecoration: 'none' }}
              >
                <Text weight="medium" style={{ color: 'var(--accent-11)' }}>
                  {assessment.name}
                </Text>
              </Link>
            </Table.Cell>

            <Table.Cell>{assessment.customerName}</Table.Cell>

            <Table.Cell>
              <Flex align="center" gap="2">
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: assessment.assessmentType.iconColor,
                  }}
                />
                {assessment.assessmentType.name}
              </Flex>
            </Table.Cell>

            <Table.Cell>
              <StatusBadge status={assessment.status} />
            </Table.Cell>

            <Table.Cell>
              <Flex align="center" gap="2" style={{ minWidth: 120 }}>
                <Progress
                  value={
                    assessment.totalQuestions > 0
                      ? (assessment.answeredQuestions / assessment.totalQuestions) * 100
                      : 0
                  }
                  style={{ flex: 1 }}
                />
                <Text size="1" color="gray">
                  {assessment.answeredQuestions}/{assessment.totalQuestions}
                </Text>
              </Flex>
            </Table.Cell>

            <Table.Cell>
              <Text size="2" color="gray">
                {formatDate(assessment.updatedAt)}
              </Text>
            </Table.Cell>

            <Table.Cell>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <IconButton variant="ghost" size="1">
                    <DotsVerticalIcon />
                  </IconButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item asChild>
                    <Link href={`/assessments/${assessment.id}`}>
                      <Pencil1Icon /> Continue
                    </Link>
                  </DropdownMenu.Item>
                  {assessment.status === 'completed' && (
                    <DropdownMenu.Item asChild>
                      <Link href={`/assessments/${assessment.id}/results`}>
                        <BarChartIcon /> View Results
                      </Link>
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Item asChild>
                    <Link href={`/assessments/${assessment.id}/results`}>
                      <FileTextIcon /> Export PDF
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item
                    color="red"
                    onClick={() => onDelete(assessment.id)}
                  >
                    <TrashIcon /> Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, 'gray' | 'yellow' | 'green'> = {
    draft: 'gray',
    'in-progress': 'yellow',
    completed: 'green',
  }

  const labelMap: Record<string, string> = {
    draft: 'Draft',
    'in-progress': 'In Progress',
    completed: 'Completed',
  }

  return (
    <Badge color={colorMap[status] || 'gray'}>
      {labelMap[status] || status}
    </Badge>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString()
}
```

### New Assessment Page
```tsx
// assess-hub/src/app/assessments/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  Flex,
  Text,
  TextField,
  Select,
  Button,
  Grid,
} from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { useRouter } from 'next/navigation'

interface AssessmentType {
  id: string
  name: string
  description: string | null
  iconColor: string
  _count: {
    categories: number
  }
}

export default function NewAssessmentPage() {
  const router = useRouter()
  const [types, setTypes] = useState<AssessmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [name, setName] = useState('')
  const [customerName, setCustomerName] = useState('')

  useEffect(() => {
    fetchTypes()
  }, [])

  async function fetchTypes() {
    const res = await fetch('/api/assessment-types?active=true')
    const data = await res.json()
    setTypes(data)
    setLoading(false)
  }

  const selectedType = types.find((t) => t.id === selectedTypeId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          customerName,
          assessmentTypeId: selectedTypeId,
          createdBy: 'current-user', // TODO: Get from auth
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create assessment')
      }

      const assessment = await res.json()
      router.push(`/assessments/${assessment.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box>
        <Header title="New Assessment" />
        <Box p="6">
          <Text>Loading...</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Header title="New Assessment" />
      <Box p="6">
        <Grid columns={{ initial: '1', md: '2' }} gap="6">
          {/* Form */}
          <Card>
            <Text size="4" weight="bold" mb="4">
              Assessment Details
            </Text>

            {error && (
              <Text color="red" size="2" mb="4" style={{ display: 'block' }}>
                {error}
              </Text>
            )}

            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="4">
                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    Assessment Type *
                  </Text>
                  <Select.Root
                    value={selectedTypeId}
                    onValueChange={setSelectedTypeId}
                  >
                    <Select.Trigger
                      placeholder="Select an assessment type"
                      style={{ width: '100%' }}
                    />
                    <Select.Content>
                      {types.map((type) => (
                        <Select.Item key={type.id} value={type.id}>
                          <Flex align="center" gap="2">
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: type.iconColor,
                              }}
                            />
                            {type.name}
                          </Flex>
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>

                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    Assessment Name *
                  </Text>
                  <TextField.Root
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Cloud Infrastructure Review Q1 2024"
                    required
                  />
                </Box>

                <Box>
                  <Text as="label" size="2" weight="bold" mb="1">
                    Customer Name *
                  </Text>
                  <TextField.Root
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g., Acme Corporation"
                    required
                  />
                </Box>

                <Flex gap="3" mt="4">
                  <Button
                    type="submit"
                    disabled={!selectedTypeId || saving}
                  >
                    {saving ? 'Creating...' : 'Create Assessment'}
                  </Button>
                  <Button
                    type="button"
                    variant="soft"
                    color="gray"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                </Flex>
              </Flex>
            </form>
          </Card>

          {/* Type Preview */}
          {selectedType && (
            <Card>
              <Text size="4" weight="bold" mb="4">
                {selectedType.name}
              </Text>
              {selectedType.description && (
                <Text size="2" color="gray" mb="4" style={{ display: 'block' }}>
                  {selectedType.description}
                </Text>
              )}
              <Flex gap="4">
                <Box>
                  <Text size="6" weight="bold">
                    {selectedType._count.categories}
                  </Text>
                  <Text size="2" color="gray">
                    Categories
                  </Text>
                </Box>
              </Flex>
            </Card>
          )}
        </Grid>
      </Box>
    </Box>
  )
}
```

## Testing Checklist
- [ ] Assessments list loads with all assessments
- [ ] Search filters by name and customer
- [ ] Status filter works correctly
- [ ] Type filter works correctly
- [ ] Progress bar shows correct percentage
- [ ] Relative dates display correctly
- [ ] Status badges show correct colors
- [ ] Dropdown actions work (continue, results, delete)
- [ ] Delete confirmation and removal
- [ ] Empty state shows when no results
- [ ] New assessment form validates required fields
- [ ] Type selection shows preview
- [ ] Create assessment redirects to form

## Completion Criteria
- List page with filtering and search
- Table with progress indicators
- Status badges with appropriate colors
- Action dropdown for each row
- New assessment form with type selection
- Responsive layout
