'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/store/uiStore'
import {
  HomeIcon,
  BarChartIcon,
  FileTextIcon,
  PlusCircledIcon,
  UploadIcon,
  ChevronLeftIcon,
  LayersIcon,
  PersonIcon,
} from '@radix-ui/react-icons'
import { Box, Flex, Text, IconButton, Separator } from '@radix-ui/themes'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const mainNavItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <HomeIcon width={20} height={20} /> },
  { href: '/assessments', label: 'Assessments', icon: <BarChartIcon width={20} height={20} /> },
  { href: '/reports', label: 'Reports', icon: <FileTextIcon width={20} height={20} /> },
]

const adminNavItems: NavItem[] = [
  { href: '/admin/types', label: 'Assessment Types', icon: <PlusCircledIcon width={20} height={20} /> },
  { href: '/admin/import', label: 'Import CSV', icon: <UploadIcon width={20} height={20} /> },
  { href: '/admin/users', label: 'Users', icon: <PersonIcon width={20} height={20} /> },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <Box
      asChild
      style={{
        width: sidebarCollapsed ? '64px' : '280px',
        minWidth: sidebarCollapsed ? '64px' : '280px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        borderRight: '1px solid var(--gray-5)',
        backgroundColor: 'var(--color-background)',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      <aside>
        {/* Header */}
        <Flex
          align="center"
          justify="between"
          px="4"
          style={{
            height: '64px',
            borderBottom: '1px solid var(--gray-5)',
          }}
        >
          <Flex align="center" gap="3">
            <Box
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--accent-9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <LayersIcon width={18} height={18} />
            </Box>
            {!sidebarCollapsed && (
              <Text size="4" weight="bold" style={{ color: 'var(--accent-9)' }}>
                AssessHub
              </Text>
            )}
          </Flex>
          <IconButton
            variant="ghost"
            size="2"
            onClick={toggleSidebar}
            style={{
              transform: sidebarCollapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          >
            <ChevronLeftIcon width={18} height={18} />
          </IconButton>
        </Flex>

        {/* Navigation */}
        <Box py="4" px="2" style={{ overflowY: 'auto', height: 'calc(100vh - 64px)' }}>
          <NavSection title="Main" items={mainNavItems} collapsed={sidebarCollapsed} isActive={isActive} />

          <Separator size="4" my="4" />

          <NavSection title="Administration" items={adminNavItems} collapsed={sidebarCollapsed} isActive={isActive} />
        </Box>
      </aside>
    </Box>
  )
}

interface NavSectionProps {
  title: string
  items: NavItem[]
  collapsed: boolean
  isActive: (href: string) => boolean
}

function NavSection({ title, items, collapsed, isActive }: NavSectionProps) {
  return (
    <Box>
      {!collapsed && (
        <Text
          size="1"
          weight="medium"
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--gray-10)',
            padding: '8px 12px',
          }}
        >
          {title}
        </Text>
      )}
      {items.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
      ))}
    </Box>
  )
}

interface NavLinkProps {
  item: NavItem
  active: boolean
  collapsed: boolean
}

function NavLink({ item, active, collapsed }: NavLinkProps) {
  return (
    <Link href={item.href} style={{ textDecoration: 'none' }}>
      <Flex
        align="center"
        gap="3"
        px="3"
        py="2"
        style={{
          borderRadius: '8px',
          marginBottom: '2px',
          backgroundColor: active ? 'var(--accent-3)' : 'transparent',
          color: active ? 'var(--accent-11)' : 'var(--gray-11)',
          cursor: 'pointer',
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'background-color 0.15s ease',
        }}
        className="hover:bg-[var(--gray-3)]"
      >
        <Box style={{ flexShrink: 0 }}>{item.icon}</Box>
        {!collapsed && (
          <Text size="2" weight={active ? 'medium' : 'regular'}>
            {item.label}
          </Text>
        )}
      </Flex>
    </Link>
  )
}
