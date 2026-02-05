'use client'

import { Table, Text, Flex, Badge } from '@radix-ui/themes'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
} from '@radix-ui/react-icons'

interface CategoryDelta {
  categoryId: string
  categoryName: string
  score1: number
  score2: number
  delta: number
  winner: 1 | 2 | 'tie'
}

interface ComparisonTableProps {
  categoryDeltas: CategoryDelta[]
  assessment1Name: string
  assessment2Name: string
}

export function ComparisonTable({
  categoryDeltas,
  assessment1Name,
  assessment2Name
}: ComparisonTableProps) {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Category</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell style={{ textAlign: 'center' }}>
            <Flex align="center" justify="center" gap="2">
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--blue-9)'
                }}
              />
              {assessment1Name}
            </Flex>
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell style={{ textAlign: 'center' }}>
            <Flex align="center" justify="center" gap="2">
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--green-9)'
                }}
              />
              {assessment2Name}
            </Flex>
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell style={{ textAlign: 'center' }}>
            Difference
          </Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {categoryDeltas.map(cat => (
          <Table.Row key={cat.categoryId}>
            <Table.Cell>
              <Text weight="medium">{cat.categoryName}</Text>
            </Table.Cell>
            <Table.Cell style={{ textAlign: 'center' }}>
              <Text
                weight={cat.winner === 1 ? 'bold' : 'regular'}
                color={cat.winner === 1 ? 'blue' : undefined}
              >
                {cat.score1.toFixed(1)}
              </Text>
            </Table.Cell>
            <Table.Cell style={{ textAlign: 'center' }}>
              <Text
                weight={cat.winner === 2 ? 'bold' : 'regular'}
                color={cat.winner === 2 ? 'green' : undefined}
              >
                {cat.score2.toFixed(1)}
              </Text>
            </Table.Cell>
            <Table.Cell style={{ textAlign: 'center' }}>
              <DeltaBadge delta={cat.delta} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <Badge color="gray" variant="soft">
        <MinusIcon width={10} height={10} />
        0.0
      </Badge>
    )
  }

  const isPositive = delta > 0
  const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon
  const color = isPositive ? 'blue' : 'green'

  return (
    <Badge color={color} variant="soft">
      <Icon width={10} height={10} />
      {isPositive ? '+' : ''}{delta.toFixed(1)}
    </Badge>
  )
}
