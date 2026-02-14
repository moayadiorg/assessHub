import { Box, Card, Grid, Text, Flex } from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import {
  FileTextIcon,
  ListBulletIcon,
  UploadIcon,
  PersonIcon,
} from '@radix-ui/react-icons'

const adminCards = [
  {
    href: '/admin/types',
    icon: <FileTextIcon width={24} height={24} />,
    title: 'Assessment Types',
    description: 'Create and manage assessment templates',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  {
    href: '/admin/questions',
    icon: <ListBulletIcon width={24} height={24} />,
    title: 'Questions Editor',
    description: 'Edit categories and questions',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
  {
    href: '/admin/import',
    icon: <UploadIcon width={24} height={24} />,
    title: 'CSV Import',
    description: 'Bulk import assessment structures',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  {
    href: '/admin/users',
    icon: <PersonIcon width={24} height={24} />,
    title: 'User Management',
    description: 'Pre-authorize users and manage roles',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
  },
]

export default function AdminPage() {
  return (
    <Box>
      <Header title="Admin Dashboard" showNewAssessment={false} />
      <Box p="6">
        <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
          {adminCards.map((card, index) => (
            <AdminCard key={card.href} {...card} delay={index + 1} />
          ))}
        </Grid>
      </Box>
    </Box>
  )
}

function AdminCard({
  href,
  icon,
  title,
  description,
  color,
  bgColor,
  delay,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  color: string
  bgColor: string
  delay: number
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Card
        className={`card-hover animate-in animate-in-delay-${delay}`}
        style={{ borderTop: `4px solid ${color}` }}
      >
        <Flex gap="4" align="start">
          <Box
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: bgColor,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Text size="4" weight="bold" className="font-heading" style={{ display: 'block' }}>
              {title}
            </Text>
            <Text size="2" color="gray" mt="1" style={{ display: 'block' }}>
              {description}
            </Text>
          </Box>
        </Flex>
      </Card>
    </Link>
  )
}
