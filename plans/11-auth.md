# Plan 11: Authentication & Authorization

## Overview
Implement authentication using NextAuth.js with role-based access control for admin, user (Solution Architect), and viewer roles.

## Dependencies
- None (can be developed in parallel with other features)

## Package Installation
```bash
npm install next-auth @auth/prisma-adapter
```

## Files to Create

### 1. `assess-hub/src/app/api/auth/[...nextauth]/route.ts`
NextAuth.js API route handler.

### 2. `assess-hub/src/lib/auth.ts`
Auth configuration and utilities.

### 3. `assess-hub/src/components/auth/AuthProvider.tsx`
Session provider wrapper.

### 4. `assess-hub/src/components/auth/SignInButton.tsx`
Sign in/out button component.

### 5. `assess-hub/src/components/auth/ProtectedRoute.tsx`
HOC for protecting routes.

### 6. `assess-hub/src/middleware.ts`
Next.js middleware for route protection.

### 7. `assess-hub/src/app/auth/signin/page.tsx`
Custom sign-in page.

### 8. `assess-hub/src/app/auth/error/page.tsx`
Auth error page.

## Environment Variables
```env
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# OAuth Providers (choose one or more)
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Or Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Implementation Details

### Auth Configuration
```typescript
// assess-hub/src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Development only - credentials provider
    ...(process.env.NODE_ENV === 'development'
      ? [
          CredentialsProvider({
            name: 'Development',
            credentials: {
              email: { label: 'Email', type: 'email' },
              role: { label: 'Role', type: 'text' },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null

              // Find or create user
              let user = await prisma.user.findUnique({
                where: { email: credentials.email },
              })

              if (!user) {
                user = await prisma.user.create({
                  data: {
                    email: credentials.email,
                    name: credentials.email.split('@')[0],
                    role: credentials.role || 'user',
                  },
                })
              }

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              }
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        (session.user as any).id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}

// Role checking utilities
export type UserRole = 'admin' | 'user' | 'viewer'

export function canManageAssessmentTypes(role: UserRole): boolean {
  return role === 'admin'
}

export function canCreateAssessments(role: UserRole): boolean {
  return role === 'admin' || role === 'user'
}

export function canViewAssessment(role: UserRole, isOwner: boolean): boolean {
  return role === 'admin' || isOwner || role === 'viewer'
}

export function canEditAssessment(role: UserRole, isOwner: boolean): boolean {
  return role === 'admin' || (role === 'user' && isOwner)
}
```

### NextAuth Route Handler
```typescript
// assess-hub/src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

### Auth Provider
```tsx
// assess-hub/src/components/auth/AuthProvider.tsx
'use client'

import { SessionProvider } from 'next-auth/react'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>
}
```

### Update Root Layout
```tsx
// assess-hub/src/app/layout.tsx
import { AuthProvider } from '@/components/auth/AuthProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Theme>
            <MainLayout>{children}</MainLayout>
          </Theme>
        </AuthProvider>
      </body>
    </html>
  )
}
```

### Sign In Button Component
```tsx
// assess-hub/src/components/auth/SignInButton.tsx
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
```

### Middleware for Route Protection
```typescript
// assess-hub/src/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin routes
    if (path.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Assessment creation
    if (path === '/assessments/new') {
      if (token?.role === 'viewer') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/assessments/:path*',
  ],
}
```

### Sign In Page
```tsx
// assess-hub/src/app/auth/signin/page.tsx
'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Box, Card, Flex, Text, Button, TextField } from '@radix-ui/themes'

export default function SignInPage() {
  const [providers, setProviders] = useState<any>(null)
  const [devEmail, setDevEmail] = useState('')
  const [devRole, setDevRole] = useState('user')

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
                <option value="admin">Admin</option>
                <option value="user">User (SA)</option>
                <option value="viewer">Viewer</option>
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
```

### Unauthorized Page
```tsx
// assess-hub/src/app/unauthorized/page.tsx
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
```

### TypeScript Declarations
```typescript
// assess-hub/src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
```

### Hook for Role Checking
```tsx
// assess-hub/src/hooks/useAuth.ts
'use client'

import { useSession } from 'next-auth/react'
import { UserRole, canManageAssessmentTypes, canCreateAssessments } from '@/lib/auth'

export function useAuth() {
  const { data: session, status } = useSession()

  const role = (session?.user as any)?.role as UserRole | undefined
  const isLoading = status === 'loading'
  const isAuthenticated = !!session

  return {
    session,
    user: session?.user,
    role,
    isLoading,
    isAuthenticated,
    isAdmin: role === 'admin',
    canManageTypes: role ? canManageAssessmentTypes(role) : false,
    canCreateAssessments: role ? canCreateAssessments(role) : false,
  }
}
```

## Testing Checklist
- [ ] Sign in page renders with providers
- [ ] GitHub OAuth works (if configured)
- [ ] Google OAuth works (if configured)
- [ ] Dev credentials work in development
- [ ] Session persists across page refreshes
- [ ] Sign out clears session
- [ ] Admin routes protected
- [ ] Unauthorized page shows for restricted access
- [ ] User menu shows role
- [ ] API routes check authentication
- [ ] Middleware redirects correctly

## Completion Criteria
- NextAuth.js configured with providers
- Role-based access control implemented
- Protected routes via middleware
- Sign in/out functionality
- Custom sign in page
- Session accessible throughout app
- TypeScript types for auth
