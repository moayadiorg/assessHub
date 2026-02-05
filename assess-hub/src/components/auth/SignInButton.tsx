'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { Button, DropdownMenu, Avatar, Flex, Text } from '@radix-ui/themes'
import { ExitIcon, PersonIcon } from '@radix-ui/react-icons'

export function SignInButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <Button variant="soft" disabled>Loading...</Button>
  }

  if (!session) {
    return (
      <Button onClick={() => signIn()}>
        <PersonIcon /> Sign In
      </Button>
    )
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="ghost">
          <Flex align="center" gap="2">
            <Avatar
              size="1"
              src={session.user?.image || undefined}
              fallback={session.user?.name?.[0] || 'U'}
            />
            <Text size="2">{session.user?.name}</Text>
          </Flex>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item disabled>
          <Text size="2" color="gray">
            {(session.user as any)?.role || 'user'}
          </Text>
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onClick={() => signOut()}>
          <ExitIcon /> Sign Out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
