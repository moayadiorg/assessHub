import { NextAuthOptions } from 'next-auth'
import { MysqlAdapter } from './mysql-adapter'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { queryOne, execute } from './sql-helpers'
import type { DbUser } from '@/types/db'

// Build providers array conditionally based on available env vars
const providers: NextAuthOptions['providers'] = []

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  )
} else if (process.env.NODE_ENV === 'production') {
  console.warn('WARNING: GITHUB_ID/GITHUB_SECRET not set. GitHub auth disabled.')
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  )
} else if (process.env.NODE_ENV === 'production') {
  console.warn('WARNING: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not set. Google auth disabled.')
}

// Development only - credentials provider
if (process.env.ENABLE_DEV_AUTH === 'true') {
  providers.push(
    CredentialsProvider({
      name: 'Development',
      credentials: {
        email: { label: 'Email', type: 'email' },
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        // Look up existing user - don't auto-create
        const user = await queryOne<DbUser>(
          'SELECT * FROM User WHERE email = ?',
          [credentials.email]
        )

        // User must be pre-authorized and active
        if (!user) return null
        if (!user.isActive) return null

        // Update last login
        await execute(
          'UPDATE User SET lastLoginAt = NOW(3) WHERE id = ?',
          [user.id]
        )

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    })
  )
}

export const authOptions: NextAuthOptions = {
  adapter: MysqlAdapter() as any,
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Skip for credentials provider (handled in authorize)
      if (account?.provider === 'credentials') return true

      const email = (user.email || (profile as any)?.email)?.toLowerCase()
      if (!email) return false

      const existingUser = await queryOne<DbUser>(
        'SELECT * FROM User WHERE email = ?',
        [email]
      )

      if (!existingUser) {
        return '/auth/error?error=NotAuthorized'
      }
      if (!existingUser.isActive) {
        return '/auth/error?error=AccountDisabled'
      }

      // Update last login
      await execute(
        'UPDATE User SET lastLoginAt = NOW(3) WHERE id = ?',
        [existingUser.id]
      )

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token) {
        return {
          ...session,
          user: {
            ...session.user,
            role: token.role as string,
            id: token.id as string,
          },
        }
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
export type UserRole = 'admin' | 'sa' | 'reader'

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin'
}

export function canManageAssessmentTypes(role: UserRole): boolean {
  return role === 'admin'
}

export function canCreateAssessments(role: UserRole): boolean {
  return role === 'admin' || role === 'sa'
}

export function canViewAssessment(role: UserRole, isOwner: boolean): boolean {
  return role === 'admin' || isOwner || role === 'reader'
}

export function canEditAssessment(role: UserRole, isOwner: boolean): boolean {
  return role === 'admin' || (role === 'sa' && isOwner)
}
