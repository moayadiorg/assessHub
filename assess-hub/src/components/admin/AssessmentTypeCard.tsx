'use client'

import { Card, Flex, Box, Text, Badge, IconButton, DropdownMenu } from '@radix-ui/themes'
import Link from 'next/link'
import { DotsVerticalIcon, Pencil1Icon, TrashIcon, EyeOpenIcon } from '@radix-ui/react-icons'

interface AssessmentTypeCardProps {
  type: {
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
  onDelete: () => void
}

export function AssessmentTypeCard({ type, onDelete }: AssessmentTypeCardProps) {
  return (
    <Card>
      <Flex justify="between" align="start" mb="3">
        <Flex gap="2" align="center">
          <Box
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: type.iconColor,
            }}
          />
          <Text size="4" weight="bold">{type.name}</Text>
        </Flex>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <IconButton variant="ghost" size="1">
              <DotsVerticalIcon />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item asChild>
              <Link href={`/admin/types/${type.id}`}>
                <Pencil1Icon /> Edit
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link href={`/admin/questions/${type.id}`}>
                <EyeOpenIcon /> Manage Questions
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item color="red" onClick={onDelete}>
              <TrashIcon /> Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>

      {type.description && (
        <Text size="2" color="gray" mb="3" style={{ display: 'block' }}>
          {type.description}
        </Text>
      )}

      <Flex gap="2" mb="3">
        <Badge variant="soft">v{type.version}</Badge>
        {!type.isActive && <Badge color="red">Inactive</Badge>}
      </Flex>

      <Flex gap="4">
        <Text size="2" color="gray">
          {type._count.categories} categories
        </Text>
        <Text size="2" color="gray">
          {type._count.assessments} assessments
        </Text>
      </Flex>
    </Card>
  )
}
