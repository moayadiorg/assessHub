'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Box, Card, Flex, Text, Button, TextField } from '@radix-ui/themes'

export default function SignInPage() {
  const [providers, setProviders] = useState<any>(null)
  const [devEmail, setDevEmail] = useState('')
  const [devRole, setDevRole] = useState('sa')

  useEffect(() => {
    getProviders().then(setProviders)
  }, [])

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
      <Card style={{ width: 400, padding: 32 }}>
        <Text size="6" weight="bold" mb="2" style={{ display: 'block', textAlign: 'center' }}>
          Sign In
        </Text>
        <Text size="2" color="gray" mb="6" style={{ display: 'block', textAlign: 'center' }}>
          Sign in to access the assessment platform
        </Text>

        <Flex direction="column" gap="3">
          {providers?.github && (
            <Button
              size="3"
              variant="outline"
              onClick={() => signIn('github', { callbackUrl: '/' })}
            >
              Continue with GitHub
            </Button>
          )}

          {providers?.google && (
            <Button
              size="3"
              variant="outline"
              onClick={() => signIn('google', { callbackUrl: '/' })}
            >
              Continue with Google
            </Button>
          )}

          <Text
            size="2"
            color="gray"
            mt="3"
            style={{ display: 'block', textAlign: 'center' }}
          >
            Only pre-authorized users can sign in
          </Text>

          {/* Development mode credentials */}
          {providers?.credentials && (
            <>
              <Box
                my="4"
                style={{
                  borderTop: '1px solid var(--gray-5)',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <Text
                  size="2"
                  color="gray"
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'white',
                    padding: '0 8px',
                  }}
                >
                  Development Only
                </Text>
              </Box>

              <TextField.Root
                placeholder="Email"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
              />

              <select
                value={devRole}
                onChange={(e) => setDevRole(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--gray-6)',
                }}
              >
                <option value="admin">Administrator</option>
                <option value="sa">Solution Architect</option>
                <option value="reader">Reader</option>
              </select>

              <Button
                size="3"
                onClick={() =>
                  signIn('credentials', {
                    email: devEmail,
                    role: devRole,
                    callbackUrl: '/',
                  })
                }
                disabled={!devEmail}
              >
                Sign In (Dev)
              </Button>
            </>
          )}
        </Flex>
      </Card>
    </Box>
  )
}
