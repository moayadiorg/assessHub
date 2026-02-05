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
    <form onSubmit={handleSubmit}>
      <Box>
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
    </form>
  )
}
