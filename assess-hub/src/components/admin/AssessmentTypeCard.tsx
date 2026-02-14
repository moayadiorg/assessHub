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
    <Card
      className="card-hover"
      style={{
        borderTop: `4px solid ${type.iconColor}`,
        cursor: 'default',
      }}
    >
      <Flex justify="between" align="start" mb="3">
        <Flex gap="3" align="center">
          <Box
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: type.iconColor,
              flexShrink: 0,
            }}
          />
          <Text size="4" weight="bold" className="font-heading">{type.name}</Text>
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

      <Flex gap="2" mb="3" align="center">
        <Badge variant="outline">v{type.version}</Badge>
        {!type.isActive && <Badge color="red">Inactive</Badge>}
      </Flex>

      <Flex gap="2">
        <Badge variant="soft" color="gray">
          {type._count.categories} categories
        </Badge>
        <Badge variant="soft" color="gray">
          {type._count.assessments} assessments
        </Badge>
      </Flex>
    </Card>
  )
}
