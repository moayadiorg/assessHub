# Plan 14: Reports Landing Page

## Overview

Create a central hub for accessing different report types. This page provides navigation to Customer Reports and Comparative Reports, along with a searchable list of all customers.

## Dependencies

- **Plan 13: Customer Model & Migration** - Required for customer data and API

## Features

1. **Customer selector dropdown** - Select a customer to view their report
2. **Quick access to Customer Report** - Button navigates to `/reports/customer/[id]`
3. **Assessment comparison selector** - Select type, then two assessments to compare
4. **Customer list** - Searchable table with assessment counts and quick actions

## Files to Create

### `src/app/reports/page.tsx`

```typescript
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
} from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { useRouter } from 'next/navigation'
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

  useEffect(() => {
    Promise.all([
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/assessment-types?active=true').then(r => r.json())
    ]).then(([customersData, typesData]) => {
      setCustomers(customersData)
      setAssessmentTypes(typesData)
      setLoading(false)
    })
  }, [])

  // Fetch assessments when type is selected
  useEffect(() => {
    if (selectedTypeId) {
      fetch(`/api/assessments?typeId=${selectedTypeId}&status=completed`)
        .then(r => r.json())
        .then(setTypeAssessments)
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

  if (loading) {
    return (
      <Box>
        <Header title="Reports" />
        <Box p="6"><Text>Loading...</Text></Box>
      </Box>
    )
  }

  return (
    <Box>
      <Header title="Reports" />

      <Box p="6">
        <Grid columns={{ initial: '1', lg: '2' }} gap="6" mb="6">
          {/* Customer Reports Card */}
          <Card>
            <Flex align="center" gap="2" mb="4">
              <BarChartIcon width={20} height={20} />
              <Text size="4" weight="bold">Customer Reports</Text>
            </Flex>
            <Text size="2" color="gray" mb="4" style={{ display: 'block' }}>
              View aggregated assessment data and trends for a specific customer.
            </Text>

            <Flex gap="3" align="end">
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2" weight="medium" mb="1">
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
                    {customers.map(customer => (
                      <Select.Item key={customer.id} value={customer.id}>
                        {customer.name} ({customer.assessmentCount} assessments)
                      </Select.Item>
                    ))}
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
          <Card>
            <Flex align="center" gap="2" mb="4">
              <BarChartIcon width={20} height={20} />
              <Text size="4" weight="bold">Comparison Reports</Text>
            </Flex>
            <Text size="2" color="gray" mb="4" style={{ display: 'block' }}>
              Compare two assessments side-by-side with overlaid visualizations.
            </Text>

            <Flex direction="column" gap="3">
              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
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
                    {assessmentTypes.map(type => (
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

              {selectedTypeId && (
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
```

## Page Layout

```
+----------------------------------------------------------+
|  Reports                                                  |
+----------------------------------------------------------+
|  +------------------------+  +------------------------+   |
|  | Customer Reports       |  | Comparison Reports     |   |
|  |                        |  |                        |   |
|  | View aggregated data   |  | Compare two assessments|   |
|  | and trends for a       |  | side-by-side           |   |
|  | specific customer.     |  |                        |   |
|  |                        |  | [Select Type ▼]        |   |
|  | [Select Customer ▼]    |  |                        |   |
|  | [View Report →]        |  | [Assessment 1 ▼] vs    |   |
|  |                        |  | [Assessment 2 ▼]       |   |
|  |                        |  | [Compare →]            |   |
|  +------------------------+  +------------------------+   |
|                                                           |
|  +------------------------------------------------------+ |
|  | All Customers                    [🔍 Search...]      | |
|  +------------------------------------------------------+ |
|  | Name              | Assessments | Actions            | |
|  +-------------------+-------------+--------------------+ |
|  | Acme Corp         | 5           | [View Report →]    | |
|  | TechStart Inc     | 3           | [View Report →]    | |
|  | GlobalBank        | 8           | [View Report →]    | |
|  +------------------------------------------------------+ |
+----------------------------------------------------------+
```

## Navigation Flow

1. **Customer Report Flow:**
   - User selects customer from dropdown
   - Clicks "View Report"
   - Navigates to `/reports/customer/[customerId]`

2. **Comparison Report Flow:**
   - User selects assessment type
   - Dropdowns populate with completed assessments of that type
   - User selects two different assessments
   - Clicks "Compare"
   - Navigates to `/reports/compare?a1=[id1]&a2=[id2]`

3. **Customer List Flow:**
   - User can search customers by name
   - Clicks "View Report" on a row
   - Navigates to `/reports/customer/[customerId]`

## API Dependencies

This page requires these existing APIs:

1. `GET /api/customers` - Returns list of customers with assessment counts
2. `GET /api/assessment-types?active=true` - Returns active assessment types
3. `GET /api/assessments?typeId=xxx&status=completed` - Returns completed assessments of a type

## UI Components Used

- `@radix-ui/themes`: Box, Card, Flex, Text, Select, Button, Table, TextField, Badge, Grid
- `@radix-ui/react-icons`: MagnifyingGlassIcon, ArrowRightIcon, BarChartIcon
- `next/navigation`: useRouter

## Testing Checklist

- [ ] Page loads and displays loading state
- [ ] Customer dropdown populates with all customers
- [ ] Type dropdown populates with active assessment types
- [ ] Assessment dropdowns populate when type is selected
- [ ] Assessment dropdowns only show completed assessments
- [ ] Cannot select same assessment in both dropdowns
- [ ] "View Report" button disabled when no customer selected
- [ ] "Compare" button disabled when not both assessments selected
- [ ] Customer search filters the table correctly
- [ ] "View Report" in table navigates correctly
- [ ] Empty states display appropriate messages
- [ ] Navigation to customer report works
- [ ] Navigation to comparison report works with query params

## Edge Cases

1. **No customers exist** - Show empty state message
2. **Customer has 0 assessments** - Disable "View Report" button
3. **Type has < 2 completed assessments** - Show message, disable comparison
4. **Search returns no results** - Show "No customers match" message
5. **API error** - Show error state with retry option
