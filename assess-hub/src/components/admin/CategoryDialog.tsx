'use client'

import { useState, useEffect } from 'react'
import { Dialog, Flex, Box, Text, TextField, TextArea, Button } from '@radix-ui/themes'

interface Category {
  id: string
  name: string
  description: string | null
  order: number
}

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessmentTypeId: string
  category: Category | null
  onSuccess: () => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  assessmentTypeId,
  category,
  onSuccess,
}: CategoryDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (category) {
      setName(category.name)
      setDescription(category.description || '')
    } else {
      setName('')
      setDescription('')
    }
  }, [category, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const url = category
        ? `/api/categories/${category.id}`
        : '/api/categories'
      const method = category ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentTypeId,
          name,
          description,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save category')
      }

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>
          {category ? 'Edit Category' : 'Add Category'}
        </Dialog.Title>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <Box>
              <Text as="label" size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                Name *
              </Text>
              <TextField.Root
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Infrastructure"
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
                placeholder="Brief description of this category"
                rows={2}
              />
            </Box>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : category ? 'Update' : 'Create'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
