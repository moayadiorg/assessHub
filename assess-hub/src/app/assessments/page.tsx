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
