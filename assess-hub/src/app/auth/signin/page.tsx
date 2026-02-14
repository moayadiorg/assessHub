'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Box, Card, Flex, Text, Button, TextField, Select } from '@radix-ui/themes'
import { LayersIcon } from '@radix-ui/react-icons'

export default function SignInPage() {
  const [providers, setProviders] = useState<any>(null)
  const [devEmail, setDevEmail] = useState('')
  const [devRole, setDevRole] = useState('sa')

  useEffect(() => {
    getProviders().then(setProviders)
  }, [])

  return (
    <Box
      className="dot-grid-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card style={{ width: 400, padding: 32, borderTop: '4px solid #3b82f6' }}>
        {/* Logo */}
        <Flex direction="column" align="center" mb="4">
          <Box
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              marginBottom: '12px',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
            }}
          >
            <LayersIcon width={24} height={24} />
          </Box>
          <Text size="6" weight="bold" className="font-heading" style={{ display: 'block', textAlign: 'center' }}>
            Sign In
          </Text>
          <Text size="2" color="gray" mt="1" style={{ display: 'block', textAlign: 'center' }}>
            Sign in to access the assessment platform
          </Text>
        </Flex>

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

              <Select.Root value={devRole} onValueChange={setDevRole}>
                <Select.Trigger style={{ width: '100%' }} />
                <Select.Content>
                  <Select.Item value="admin">Administrator</Select.Item>
                  <Select.Item value="sa">Solution Architect</Select.Item>
                  <Select.Item value="reader">Reader</Select.Item>
                </Select.Content>
              </Select.Root>

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
