import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
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

              // Look up existing user - don't auto-create
              const user = await prisma.user.findUnique({
                where: { email: credentials.email },
              })

              // User must be pre-authorized and active
              if (!user) return null
              if (!user.isActive) return null

              // Update last login
              await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
              })

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
    async signIn({ user, account, profile }) {
      // Skip for credentials provider (handled in authorize)
      if (account?.provider === 'credentials') return true

      const email = (user.email || (profile as any)?.email)?.toLowerCase()
      if (!email) return false

      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (!existingUser) {
        return '/auth/error?error=NotAuthorized'
      }
      if (!existingUser.isActive) {
        return '/auth/error?error=AccountDisabled'
      }

      // Update last login
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { lastLoginAt: new Date() },
      })

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
