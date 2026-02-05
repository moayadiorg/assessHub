'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Box, Card, Text, Button } from '@radix-ui/themes'
import Link from 'next/link'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The verification token has expired or has already been used.',
    NotAuthorized: 'Your email is not authorized. Contact an administrator.',
    AccountDisabled: 'Your account has been disabled. Contact an administrator.',
    Default: 'An error occurred during authentication.',
  }

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

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
        <Box mb="4" style={{ color: 'var(--amber-9)' }}>
          <ExclamationTriangleIcon width={48} height={48} />
        </Box>
        <Text size="6" weight="bold" mb="2" style={{ display: 'block' }}>
          Authentication Error
        </Text>
        <Text size="3" color="gray" mb="6" style={{ display: 'block' }}>
          {errorMessage}
        </Text>
        <Button asChild>
          <Link href="/auth/signin">Back to Sign In</Link>
        </Button>
      </Card>
    </Box>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
