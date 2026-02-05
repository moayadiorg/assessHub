'use client'

import { Box, Flex } from '@radix-ui/themes'
import { Sidebar } from './Sidebar'
import { useUIStore } from '@/store/uiStore'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <Flex style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Box
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? '64px' : '280px',
          transition: 'margin-left 0.2s ease',
          backgroundColor: 'var(--gray-2)',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Flex>
  )
}
