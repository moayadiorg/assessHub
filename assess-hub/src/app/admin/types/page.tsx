'use client'

import { useState, useEffect } from 'react'
import { Box, Card, Flex, Text, Button, Grid, AlertDialog } from '@radix-ui/themes'
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
      <Header title="Assessment Types" showNewAssessment={false} />
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
