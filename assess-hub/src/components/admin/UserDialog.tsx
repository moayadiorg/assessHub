'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  Flex,
  Box,
  Text,
  TextField,
  Button,
  Select,
} from '@radix-ui/themes'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  createdBy: string | null
}

interface UserDialogProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSave: () => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function UserDialog({ isOpen, onClose, user, onSave }: UserDialogProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('reader')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEditMode = !!user

  useEffect(() => {
    if (user) {
      setEmail(user.email)
      setName(user.name || '')
      setRole(user.role)
    } else {
      setEmail('')
      setName('')
      setRole('reader')
    }
    setError('')
  }, [user, isOpen])

  function validateForm(): boolean {
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      return false
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid email address')
      return false
    }

    if (!role) {
      setError('Role is required')
      return false
    }

    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) return

    setSaving(true)
    setError('')

    try {
      const url = isEditMode ? `/api/users/${user.id}` : '/api/users'
      const method = isEditMode ? 'PATCH' : 'POST'

      const body: any = {
        role,
        name: name.trim() || null,
      }

      // Email only included for new users
      if (!isEditMode) {
        body.email = email.trim().toLowerCase()
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save user')
      }

      onSave()
    } catch (error: any) {
      console.error('Error saving user:', error)
      setError(error.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  function getRoleLabel(roleValue: string): string {
    switch (roleValue) {
      case 'admin':
        return 'Administrator'
      case 'sa':
        return 'Solution Architect'
      case 'reader':
        return 'Reader'
      default:
        return roleValue
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>{isEditMode ? 'Edit User' : 'Add User'}</Dialog.Title>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            {/* Email Field */}
            <Box>
              <Text
                as="label"
                size="2"
                weight="bold"
                mb="1"
                style={{ display: 'block' }}
              >
                Email *
              </Text>
              <TextField.Root
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                disabled={isEditMode}
              />
              {isEditMode && (
                <Text size="1" color="gray" mt="1" style={{ display: 'block' }}>
                  Email cannot be changed after creation
                </Text>
              )}
            </Box>

            {/* Name Field */}
            <Box>
              <Text
                as="label"
                size="2"
                weight="bold"
                mb="1"
                style={{ display: 'block' }}
              >
                Name
              </Text>
              <TextField.Root
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name (optional)"
              />
            </Box>

            {/* Role Field */}
            <Box>
              <Text
                as="label"
                size="2"
                weight="bold"
                mb="1"
                style={{ display: 'block' }}
              >
                Role *
              </Text>
              <Select.Root value={role} onValueChange={setRole}>
                <Select.Trigger placeholder="Select a role" />
                <Select.Content>
                  <Select.Item value="admin">
                    {getRoleLabel('admin')}
                  </Select.Item>
                  <Select.Item value="sa">{getRoleLabel('sa')}</Select.Item>
                  <Select.Item value="reader">
                    {getRoleLabel('reader')}
                  </Select.Item>
                </Select.Content>
              </Select.Root>
              <Box mt="2">
                <Text size="1" color="gray">
                  {role === 'admin' &&
                    'Full access to all features and user management'}
                  {role === 'sa' &&
                    'Can create and manage assessments, view reports'}
                  {role === 'reader' && 'Can only view assessments and reports'}
                </Text>
              </Box>
            </Box>

            {/* Error Message */}
            {error && (
              <Box
                p="3"
                style={{
                  backgroundColor: 'var(--red-3)',
                  borderRadius: 6,
                  border: '1px solid var(--red-6)',
                }}
              >
                <Text size="2" color="red">
                  {error}
                </Text>
              </Box>
            )}

            {/* Info for new users */}
            {!isEditMode && (
              <Box
                p="3"
                style={{
                  backgroundColor: 'var(--blue-3)',
                  borderRadius: 6,
                  border: '1px solid var(--blue-6)',
                }}
              >
                <Text size="2" color="blue">
                  This user will be pre-authorized to sign in with the specified
                  email address via Google or GitHub OAuth.
                </Text>
              </Box>
            )}
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEditMode ? 'Update' : 'Add User'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
