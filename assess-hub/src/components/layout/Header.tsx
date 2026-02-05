'use client'

import { Box, Flex, Text, Button, Avatar } from '@radix-ui/themes'
import { PlusIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

interface HeaderProps {
  title: string
  showNewAssessment?: boolean
  children?: React.ReactNode
}

export function Header({ title, showNewAssessment = true, children }: HeaderProps) {
  return (
    <Box
      asChild
      style={{
        height: '64px',
        borderBottom: '1px solid var(--gray-5)',
        backgroundColor: 'var(--color-background)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <header>
        <Flex align="center" justify="between" px="6" style={{ height: '100%' }}>
          <Text size="5" weight="bold">
            {title}
          </Text>

          <Flex align="center" gap="3">
            {children}
            {showNewAssessment && (
              <Button asChild>
                <Link href="/assessments/new">
                  <PlusIcon width={18} height={18} />
                  New Assessment
                </Link>
              </Button>
            )}
            <Avatar
              size="2"
              radius="full"
              fallback="JD"
              style={{ cursor: 'pointer' }}
            />
          </Flex>
        </Flex>
      </header>
    </Box>
  )
}
