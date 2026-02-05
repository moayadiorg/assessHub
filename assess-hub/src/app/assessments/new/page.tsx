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

interface Customer {
  id: string
  name: string
  assessmentCount: number
  createdAt: string
}

export default function NewAssessmentPage() {
  const router = useRouter()
  const [types, setTypes] = useState<AssessmentType[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [name, setName] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [newCustomerName, setNewCustomerName] = useState('')
  const [isNewCustomer, setIsNewCustomer] = useState(false)

  useEffect(() => {
    fetchTypes()
    fetchCustomers()
  }, [])

  async function fetchTypes() {
    const res = await fetch('/api/assessment-types?active=true')
    const data = await res.json()
    setTypes(data)
    setLoading(false)
  }

  async function fetchCustomers() {
    const res = await fetch('/api/customers')
    const data = await res.json()
    setCustomers(data)
  }

  const selectedType = types.find((t) => t.id === selectedTypeId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Build request data based on customer selection mode
      const submitData = isNewCustomer
        ? {
            name,
            customerName: newCustomerName.trim(),
            assessmentTypeId: selectedTypeId,
            createdBy: 'current-user', // TODO: Get from auth
          }
        : {
            name,
            customerId: selectedCustomerId,
            assessmentTypeId: selectedTypeId,
            createdBy: 'current-user', // TODO: Get from auth
          }

      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
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
      <Header title="New Assessment" showNewAssessment={false} />
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
                    Customer *
                  </Text>
                  <Flex direction="column" gap="2">
                    <Flex gap="2" align="center">
                      <input
                        type="radio"
                        id="existing-customer"
                        checked={!isNewCustomer}
                        onChange={() => setIsNewCustomer(false)}
                      />
                      <Text as="label" htmlFor="existing-customer" size="2">
                        Select existing customer
                      </Text>
                    </Flex>
                    {!isNewCustomer && (
                      <Select.Root
                        value={selectedCustomerId}
                        onValueChange={setSelectedCustomerId}
                      >
                        <Select.Trigger
                          placeholder="Select a customer"
                          style={{ width: '100%' }}
                        />
                        <Select.Content>
                          {customers.map((customer) => (
                            <Select.Item key={customer.id} value={customer.id}>
                              {customer.name} ({customer.assessmentCount}{' '}
                              {customer.assessmentCount === 1
                                ? 'assessment'
                                : 'assessments'}
                              )
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    )}
                    <Flex gap="2" align="center" mt="2">
                      <input
                        type="radio"
                        id="new-customer"
                        checked={isNewCustomer}
                        onChange={() => setIsNewCustomer(true)}
                      />
                      <Text as="label" htmlFor="new-customer" size="2">
                        Create new customer
                      </Text>
                    </Flex>
                    {isNewCustomer && (
                      <TextField.Root
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        placeholder="e.g., Acme Corporation"
                        required={isNewCustomer}
                      />
                    )}
                  </Flex>
                </Box>

                <Flex gap="3" mt="4">
                  <Button
                    type="submit"
                    disabled={
                      !selectedTypeId ||
                      (!isNewCustomer && !selectedCustomerId) ||
                      (isNewCustomer && !newCustomerName.trim()) ||
                      saving
                    }
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
