'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  Flex,
  Text,
  Button,
  Table,
  Badge,
  TextField,
  Select,
  AlertDialog,
} from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { UserDialog } from '@/components/admin/UserDialog'
import { PlusIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons'

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toggleId, setToggleId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [search, roleFilter])

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter !== 'all') params.set('role', roleFilter)

      const res = await fetch(`/api/users?${params}`)
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  function handleAddUser() {
    setEditingUser(null)
    setDialogOpen(true)
  }

  function handleEditUser(user: User) {
    setEditingUser(user)
    setDialogOpen(true)
  }

  async function handleToggleActive(user: User) {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update user')
      }

      setToggleId(null)
      fetchUsers()
    } catch (error: any) {
      console.error('Error toggling user status:', error)
      alert(error.message || 'Failed to update user status')
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete user')
      }
      setDeleteId(null)
      fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(error.message || 'Failed to delete user')
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  function getRoleBadgeColor(role: string): 'blue' | 'green' | 'gray' {
    switch (role) {
      case 'admin':
        return 'blue'
      case 'sa':
        return 'green'
      default:
        return 'gray'
    }
  }

  function getRoleLabel(role: string): string {
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'sa':
        return 'Solution Architect'
      case 'reader':
        return 'Reader'
      default:
        return role
    }
  }

  return (
    <Box>
      <Header title="User Management" showNewAssessment={false} />
      <Box p="6">
        <Flex justify="between" align="center" mb="4">
          <Text size="5" weight="bold">
            {users.length} User{users.length !== 1 && 's'}
          </Text>
          <Button onClick={handleAddUser}>
            <PlusIcon /> Add User
          </Button>
        </Flex>

        {/* Search and Filter */}
        <Flex gap="3" mb="4">
          <Box style={{ flex: 1, maxWidth: 400 }}>
            <TextField.Root
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            >
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>
          </Box>
          <Select.Root value={roleFilter} onValueChange={setRoleFilter}>
            <Select.Trigger placeholder="Filter by role" style={{ width: 200 }} />
            <Select.Content>
              <Select.Item value="all">All Roles</Select.Item>
              <Select.Item value="admin">Administrator</Select.Item>
              <Select.Item value="sa">Solution Architect</Select.Item>
              <Select.Item value="reader">Reader</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>

        {/* Users Table */}
        {loading ? (
          <Card>
            <Flex justify="center" py="8">
              <Text>Loading users...</Text>
            </Flex>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <Flex direction="column" align="center" py="8">
              <Text size="4" color="gray" mb="4">
                {search || roleFilter !== 'all'
                  ? 'No users match your filters'
                  : 'No users yet'}
              </Text>
              {!search && roleFilter === 'all' && (
                <Button onClick={handleAddUser}>Add Your First User</Button>
              )}
            </Flex>
          </Card>
        ) : (
          <Card>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Last Login</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {users.map((user) => (
                  <Table.Row key={user.id}>
                    <Table.Cell>
                      <Text weight="medium">{user.email}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text color="gray">{user.name || '—'}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={getRoleBadgeColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={user.isActive ? 'green' : 'red'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {formatDate(user.lastLoginAt)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="2">
                        <Button
                          size="1"
                          variant="soft"
                          onClick={() => handleEditUser(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="1"
                          variant="soft"
                          color={user.isActive ? 'orange' : 'green'}
                          onClick={() => setToggleId(user.id)}
                        >
                          {user.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          size="1"
                          variant="soft"
                          color="red"
                          onClick={() => setDeleteId(user.id)}
                        >
                          Delete
                        </Button>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Card>
        )}

        {/* Add/Edit User Dialog */}
        <UserDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          user={editingUser}
          onSave={() => {
            setDialogOpen(false)
            fetchUsers()
          }}
        />

        {/* Toggle Status Confirmation */}
        <AlertDialog.Root
          open={!!toggleId}
          onOpenChange={() => setToggleId(null)}
        >
          <AlertDialog.Content>
            <AlertDialog.Title>
              {toggleId && users.find((u) => u.id === toggleId)?.isActive
                ? 'Disable User'
                : 'Enable User'}
            </AlertDialog.Title>
            <AlertDialog.Description>
              {toggleId && users.find((u) => u.id === toggleId)?.isActive
                ? 'This user will not be able to sign in until re-enabled.'
                : 'This user will be able to sign in again.'}
            </AlertDialog.Description>
            <Flex gap="3" mt="4" justify="end">
              <AlertDialog.Cancel>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action>
                <Button
                  color={
                    toggleId && users.find((u) => u.id === toggleId)?.isActive
                      ? 'orange'
                      : 'green'
                  }
                  onClick={() => {
                    const user = users.find((u) => u.id === toggleId)
                    if (user) handleToggleActive(user)
                  }}
                >
                  Confirm
                </Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>

        {/* Delete Confirmation */}
        <AlertDialog.Root
          open={!!deleteId}
          onOpenChange={() => setDeleteId(null)}
        >
          <AlertDialog.Content>
            <AlertDialog.Title>Delete User</AlertDialog.Title>
            <AlertDialog.Description>
              Are you sure? This will permanently delete the user and all their
              associated data. This action cannot be undone.
            </AlertDialog.Description>
            <Flex gap="3" mt="4" justify="end">
              <AlertDialog.Cancel>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action>
                <Button
                  color="red"
                  onClick={() => deleteId && handleDelete(deleteId)}
                >
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
