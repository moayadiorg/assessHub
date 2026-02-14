'use client'

import { Box, Flex, Text, Button } from '@radix-ui/themes'
import { PlusIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import { SignInButton } from '@/components/auth/SignInButton'

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
        borderBottom: '1px solid var(--gray-4)',
        backgroundColor: 'var(--color-background)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <header>
        <Flex align="center" justify="between" px="6" style={{ height: '100%' }}>
          <Text size="5" weight="bold" className="font-heading">
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
            <SignInButton />
          </Flex>
        </Flex>
      </header>
    </Box>
  )
}
