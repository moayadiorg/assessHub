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
