'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  Flex,
  Text,
  Select,
  Button,
  Table,
  TextField,
  Badge,
  Grid,
} from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  BarChartIcon,
} from '@radix-ui/react-icons'

interface Customer {
  id: string
  name: string
  assessmentCount: number
}

interface AssessmentType {
  id: string
  name: string
  iconColor: string
}

interface Assessment {
  id: string
  name: string
  customerName: string
  status: string
  updatedAt: string
}

export default function ReportsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  // Customer report state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')

  // Comparison report state
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [typeAssessments, setTypeAssessments] = useState<Assessment[]>([])
  const [assessment1Id, setAssessment1Id] = useState('')
  const [assessment2Id, setAssessment2Id] = useState('')

  // Customer list state
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/customers', { credentials: 'include' }).then(async r => {
          if (r.status === 401) {
            router.push('/auth/signin')
            throw new Error('Session expired')
          }
          if (!r.ok) {
            const data = await r.json().catch(() => ({}))
            throw new Error(data.error || 'Failed to fetch customers')
          }
          return r.json()
        }),
        fetch('/api/assessment-types?active=true', { credentials: 'include' }).then(r => {
          if (r.status === 401) {
            router.push('/auth/signin')
            throw new Error('Session expired')
          }
          if (!r.ok) throw new Error('Failed to fetch assessment types')
          return r.json()
        })
      ])
        .then(([customersData, typesData]) => {
          setCustomers(customersData)
          setAssessmentTypes(typesData)
          setLoading(false)
        })
        .catch(err => {
          setError(err.message)
          setLoading(false)
        })
    }
  }, [status])

  // Fetch assessments when type is selected
  useEffect(() => {
    if (selectedTypeId) {
      fetch(`/api/assessments?typeId=${selectedTypeId}&status=completed`)
        .then(r => {
          if (!r.ok) throw new Error('Failed to fetch assessments')
          return r.json()
        })
        .then(setTypeAssessments)
        .catch(err => {
          console.error('Error fetching assessments:', err)
          setTypeAssessments([])
        })
    } else {
      setTypeAssessments([])
    }
    // Reset selections when type changes
    setAssessment1Id('')
    setAssessment2Id('')
  }, [selectedTypeId])

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewCustomerReport = () => {
    if (selectedCustomerId) {
      router.push(`/reports/customer/${selectedCustomerId}`)
    }
  }

  const handleCompare = () => {
    if (assessment1Id && assessment2Id) {
      router.push(`/reports/compare?a1=${assessment1Id}&a2=${assessment2Id}`)
    }
  }

  // Show loading while checking authentication
  if (status === 'loading' || loading) {
    return (
      <Box>
        <Header title="Reports" />
        <Box p="6"><Text>Loading...</Text></Box>
      </Box>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (status !== 'authenticated') {
    return null
  }

  if (error) {
    return (
      <Box>
        <Header title="Reports" />
        <Box p="6">
          <Card>
            <Text color="red" size="2">{error}</Text>
            <Button onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>
              Retry
            </Button>
          </Card>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Header title="Reports" />

      <Box p="6">
        <Grid columns={{ initial: '1', lg: '2' }} gap="6" mb="6">
          {/* Customer Reports Card */}
          <Card className="animate-in animate-in-delay-1" style={{ borderTop: '4px solid var(--blue-9)' }}>
            <Flex align="center" gap="3" mb="4">
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: 'var(--blue-9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChartIcon width={20} height={20} />
              </Box>
              <Text size="4" weight="bold" className="font-heading">Customer Reports</Text>
            </Flex>
            <Text size="2" color="gray" mb="4" style={{ display: 'block' }}>
              View aggregated assessment data and trends for a specific customer.
            </Text>

            <Flex gap="3" align="end">
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                  Select Customer
                </Text>
                <Select.Root
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                >
                  <Select.Trigger
                    placeholder="Choose a customer..."
                    style={{ width: '100%' }}
                  />
                  <Select.Content>
                    {customers.length === 0 ? (
                      <Select.Item value="no-customers" disabled>
                        No customers available
                      </Select.Item>
                    ) : (
                      customers.map(customer => (
                        <Select.Item key={customer.id} value={customer.id}>
                          {customer.name} ({customer.assessmentCount} assessment{customer.assessmentCount !== 1 ? 's' : ''})
                        </Select.Item>
                      ))
                    )}
                  </Select.Content>
                </Select.Root>
              </Box>
              <Button
                onClick={handleViewCustomerReport}
                disabled={!selectedCustomerId}
              >
                View Report
                <ArrowRightIcon />
              </Button>
            </Flex>
          </Card>

          {/* Comparison Reports Card */}
          <Card className="animate-in animate-in-delay-2" style={{ borderTop: '4px solid var(--green-9)' }}>
            <Flex align="center" gap="3" mb="4">
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  color: 'var(--green-9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChartIcon width={20} height={20} />
              </Box>
              <Text size="4" weight="bold" className="font-heading">Comparison Reports</Text>
            </Flex>
            <Text size="2" color="gray" mb="4" style={{ display: 'block' }}>
              Compare two assessments side-by-side with overlaid visualizations.
            </Text>

            <Flex direction="column" gap="3">
              <Box>
                <Text as="label" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                  Assessment Type
                </Text>
                <Select.Root
                  value={selectedTypeId}
                  onValueChange={setSelectedTypeId}
                >
                  <Select.Trigger
                    placeholder="Select type to compare..."
                    style={{ width: '100%' }}
                  />
                  <Select.Content>
                    {assessmentTypes.length === 0 ? (
                      <Select.Item value="no-types" disabled>
                        No assessment types available
                      </Select.Item>
                    ) : (
                      assessmentTypes.map(type => (
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
                      ))
                    )}
                  </Select.Content>
                </Select.Root>
              </Box>

              {selectedTypeId && (
                <>
                  {typeAssessments.length < 2 ? (
                    <Text size="2" color="gray">
                      Need at least 2 completed assessments of this type to compare.
                    </Text>
                  ) : (
                    <Flex gap="3" align="center">
                      <Box style={{ flex: 1 }}>
                        <Select.Root
                          value={assessment1Id}
                          onValueChange={setAssessment1Id}
                        >
                          <Select.Trigger
                            placeholder="Assessment 1..."
                            style={{ width: '100%' }}
                          />
                          <Select.Content>
                            {typeAssessments
                              .filter(a => a.id !== assessment2Id)
                              .map(a => (
                                <Select.Item key={a.id} value={a.id}>
                                  {a.name} - {a.customerName}
                                </Select.Item>
                              ))}
                          </Select.Content>
                        </Select.Root>
                      </Box>

                      <Text color="gray" weight="medium">vs</Text>

                      <Box style={{ flex: 1 }}>
                        <Select.Root
                          value={assessment2Id}
                          onValueChange={setAssessment2Id}
                        >
                          <Select.Trigger
                            placeholder="Assessment 2..."
                            style={{ width: '100%' }}
                          />
                          <Select.Content>
                            {typeAssessments
                              .filter(a => a.id !== assessment1Id)
                              .map(a => (
                                <Select.Item key={a.id} value={a.id}>
                                  {a.name} - {a.customerName}
                                </Select.Item>
                              ))}
                          </Select.Content>
                        </Select.Root>
                      </Box>
                    </Flex>
                  )}

                  <Button
                    onClick={handleCompare}
                    disabled={!assessment1Id || !assessment2Id}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    Compare
                    <ArrowRightIcon />
                  </Button>
                </>
              )}

              {!selectedTypeId && (
                <Text size="2" color="gray">
                  Select an assessment type to view available comparisons.
                </Text>
              )}
            </Flex>
          </Card>
        </Grid>

        {/* Customer List */}
        <Card>
          <Flex justify="between" align="center" mb="4">
            <Text size="4" weight="bold">All Customers</Text>
            <TextField.Root
              placeholder="Search customers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: 250 }}
            >
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>
          </Flex>

          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Customer Name</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Assessments</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredCustomers.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={3}>
                    <Text color="gray" size="2">
                      {searchTerm ? 'No customers match your search' : 'No customers found'}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredCustomers.map(customer => (
                  <Table.Row key={customer.id}>
                    <Table.Cell>
                      <Text weight="medium">{customer.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="soft">
                        {customer.assessmentCount} assessment{customer.assessmentCount !== 1 ? 's' : ''}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        variant="ghost"
                        size="1"
                        onClick={() => router.push(`/reports/customer/${customer.id}`)}
                        disabled={customer.assessmentCount === 0}
                      >
                        View Report
                        <ArrowRightIcon />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Card>
      </Box>
    </Box>
  )
}
