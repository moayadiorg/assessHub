import { Box, Card, Grid, Text, Flex } from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import {
  FileTextIcon,
  ListBulletIcon,
  UploadIcon,
  PersonIcon,
} from '@radix-ui/react-icons'

export default function AdminPage() {
  return (
    <Box>
      <Header title="Admin Dashboard" showNewAssessment={false} />
      <Box p="6">
        <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
          <AdminCard
            href="/admin/types"
            icon={<FileTextIcon width={24} height={24} />}
            title="Assessment Types"
            description="Create and manage assessment templates"
          />
          <AdminCard
            href="/admin/questions"
            icon={<ListBulletIcon width={24} height={24} />}
            title="Questions Editor"
            description="Edit categories and questions"
          />
          <AdminCard
            href="/admin/import"
            icon={<UploadIcon width={24} height={24} />}
            title="CSV Import"
            description="Bulk import assessment structures"
          />
          <AdminCard
            href="/admin/users"
            icon={<PersonIcon width={24} height={24} />}
            title="User Management"
            description="Pre-authorize users and manage roles"
          />
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
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Link href={href}>
      <Card style={{ cursor: 'pointer' }} className="hover:bg-gray-2">
        <Flex gap="3" align="start">
          <Box style={{ color: 'var(--accent-9)' }}>{icon}</Box>
          <Box>
            <Text size="4" weight="bold" style={{ display: 'block' }}>
              {title}
            </Text>
            <Text size="2" color="gray" style={{ display: 'block' }}>
              {description}
            </Text>
          </Box>
        </Flex>
      </Card>
    </Link>
  )
}
