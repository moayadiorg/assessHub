import { Box, Card, Flex, Text, Button } from '@radix-ui/themes'
import Link from 'next/link'
import { LockClosedIcon } from '@radix-ui/react-icons'

export default function UnauthorizedPage() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--gray-2)',
      }}
    >
      <Card style={{ width: 400, padding: 32, textAlign: 'center' }}>
        <Box mb="4" style={{ color: 'var(--red-9)' }}>
          <LockClosedIcon width={48} height={48} />
        </Box>
        <Text size="6" weight="bold" mb="2" style={{ display: 'block' }}>
          Access Denied
        </Text>
        <Text size="3" color="gray" mb="6" style={{ display: 'block' }}>
          You don't have permission to access this page.
        </Text>
        <Button asChild>
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </Card>
    </Box>
  )
}
