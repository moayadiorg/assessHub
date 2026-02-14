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
import { Box, Flex, Text, IconButton } from '@radix-ui/themes'

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
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
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
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Flex align="center" gap="3">
            <Box
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
              }}
            >
              <LayersIcon width={18} height={18} />
            </Box>
            {!sidebarCollapsed && (
              <Text
                size="4"
                weight="bold"
                className="font-heading"
                style={{ color: 'white' }}
              >
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
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            <ChevronLeftIcon width={18} height={18} />
          </IconButton>
        </Flex>

        {/* Navigation */}
        <Box py="4" px="2" style={{ overflowY: 'auto', height: 'calc(100vh - 64px)' }}>
          <NavSection title="Main" items={mainNavItems} collapsed={sidebarCollapsed} isActive={isActive} />

          <Box
            my="4"
            mx="3"
            style={{
              height: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            }}
          />

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
            letterSpacing: '0.08em',
            color: 'rgba(255, 255, 255, 0.4)',
            padding: '8px 12px',
            fontSize: '11px',
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
          position: 'relative',
          backgroundColor: active ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
          cursor: 'pointer',
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'background-color 0.15s ease, color 0.15s ease',
          borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
          }
        }}
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
