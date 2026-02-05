'use client'

import { Badge } from '@radix-ui/themes'

interface MaturityBadgeProps {
  level: number
  name: string
}

export function MaturityBadge({ level, name }: MaturityBadgeProps) {
  const colorMap: Record<number, 'red' | 'orange' | 'yellow' | 'green' | 'teal'> = {
    1: 'red',
    2: 'orange',
    3: 'yellow',
    4: 'green',
    5: 'teal',
  }

  return (
    <Badge size="2" color={colorMap[level] || 'gray'}>
      Level {level}: {name}
    </Badge>
  )
}
