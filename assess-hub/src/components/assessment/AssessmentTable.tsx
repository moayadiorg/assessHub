'use client'

import {
  Table,
  Badge,
  IconButton,
  DropdownMenu,
  Flex,
  Text,
  Progress,
} from '@radix-ui/themes'
import Link from 'next/link'
import {
  DotsVerticalIcon,
  Pencil1Icon,
  TrashIcon,
  BarChartIcon,
  FileTextIcon,
} from '@radix-ui/react-icons'

interface Assessment {
  id: string
  name: string
  customerName: string
  status: string
  createdAt: string
  updatedAt: string
  assessmentType: {
    id: string
    name: string
    iconColor: string
  }
  totalQuestions: number
  answeredQuestions: number
}

interface AssessmentTableProps {
  assessments: Assessment[]
  onDelete: (id: string) => void
}

export function AssessmentTable({ assessments, onDelete }: AssessmentTableProps) {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Assessment</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Customer</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Progress</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Updated</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell width="50px"></Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {assessments.map((assessment) => (
          <Table.Row key={assessment.id}>
            <Table.Cell>
              <Link
                href={`/assessments/${assessment.id}`}
                style={{ textDecoration: 'none' }}
              >
                <Text weight="medium" style={{ color: 'var(--accent-11)' }}>
                  {assessment.name}
                </Text>
              </Link>
            </Table.Cell>

            <Table.Cell>{assessment.customerName}</Table.Cell>

            <Table.Cell>
              <Flex align="center" gap="2">
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: assessment.assessmentType.iconColor,
                  }}
                />
                {assessment.assessmentType.name}
              </Flex>
            </Table.Cell>

            <Table.Cell>
              <StatusBadge status={assessment.status} />
            </Table.Cell>

            <Table.Cell>
              <Flex align="center" gap="2" style={{ minWidth: 120 }}>
                <Progress
                  value={
                    assessment.totalQuestions > 0
                      ? (assessment.answeredQuestions / assessment.totalQuestions) * 100
                      : 0
                  }
                  style={{ flex: 1 }}
                />
                <Text size="1" color="gray">
                  {assessment.answeredQuestions}/{assessment.totalQuestions}
                </Text>
              </Flex>
            </Table.Cell>

            <Table.Cell>
              <Text size="2" color="gray">
                {formatDate(assessment.updatedAt)}
              </Text>
            </Table.Cell>

            <Table.Cell>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <IconButton variant="ghost" size="1">
                    <DotsVerticalIcon />
                  </IconButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item asChild>
                    <Link href={`/assessments/${assessment.id}`}>
                      <Pencil1Icon /> Continue
                    </Link>
                  </DropdownMenu.Item>
                  {assessment.status === 'completed' && (
                    <DropdownMenu.Item asChild>
                      <Link href={`/assessments/${assessment.id}/results`}>
                        <BarChartIcon /> View Results
                      </Link>
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Item asChild>
                    <Link href={`/assessments/${assessment.id}/results`}>
                      <FileTextIcon /> Export PDF
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item
                    color="red"
                    onClick={() => onDelete(assessment.id)}
                  >
                    <TrashIcon /> Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, 'gray' | 'yellow' | 'green'> = {
    draft: 'gray',
    'in-progress': 'yellow',
    completed: 'green',
  }

  const labelMap: Record<string, string> = {
    draft: 'Draft',
    'in-progress': 'In Progress',
    completed: 'Completed',
  }

  return (
    <Badge color={colorMap[status] || 'gray'}>
      {labelMap[status] || status}
    </Badge>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString()
}
