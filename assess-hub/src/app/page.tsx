import { Box, Card, Flex, Text, Grid, Button, Table, Badge } from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import {
  FileTextIcon,
  CheckCircledIcon,
  ReloadIcon,
  BarChartIcon,
  PlusCircledIcon,
  UploadIcon,
  DownloadIcon,
  ArrowRightIcon,
} from '@radix-ui/react-icons'

export default function DashboardPage() {
  return (
    <Box>
      <Header title="Dashboard" />

      <Box p="6">
        {/* Stats Grid */}
        <Grid columns={{ initial: '1', sm: '2', lg: '4' }} gap="4" mb="6">
          <StatCard
            label="Total Assessments"
            value="47"
            change="+12% from last month"
            positive
            icon={<FileTextIcon width={20} height={20} />}
          />
          <StatCard
            label="Completed"
            value="32"
            change="+8% from last month"
            positive
            icon={<CheckCircledIcon width={20} height={20} />}
          />
          <StatCard
            label="In Progress"
            value="11"
            change="Same as last month"
            icon={<ReloadIcon width={20} height={20} />}
          />
          <StatCard
            label="Avg. Maturity Score"
            value="3.2"
            change="+0.3 improvement"
            positive
            icon={<BarChartIcon width={20} height={20} />}
          />
        </Grid>

        {/* Recent Assessments */}
        <Card mb="6">
          <Flex justify="between" align="center" mb="4">
            <Text size="4" weight="bold">Recent Assessments</Text>
            <Button variant="ghost" asChild>
              <Link href="/assessments">
                View All
                <ArrowRightIcon width={16} height={16} />
              </Link>
            </Button>
          </Flex>

          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Assessment</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Customer</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Score</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Last Updated</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  <Text weight="medium">Cloud Infrastructure Review</Text>
                </Table.Cell>
                <Table.Cell>Acme Corp</Table.Cell>
                <Table.Cell>Cloud Maturity</Table.Cell>
                <Table.Cell>
                  <Badge color="green">Completed</Badge>
                </Table.Cell>
                <Table.Cell>3.8</Table.Cell>
                <Table.Cell>2 hours ago</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <Text weight="medium">DevOps Assessment Q1</Text>
                </Table.Cell>
                <Table.Cell>TechStart Inc</Table.Cell>
                <Table.Cell>DevOps Maturity</Table.Cell>
                <Table.Cell>
                  <Badge color="yellow">In Progress</Badge>
                </Table.Cell>
                <Table.Cell>2.4</Table.Cell>
                <Table.Cell>1 day ago</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <Text weight="medium">Security Posture Analysis</Text>
                </Table.Cell>
                <Table.Cell>GlobalBank</Table.Cell>
                <Table.Cell>Security Maturity</Table.Cell>
                <Table.Cell>
                  <Badge color="green">Completed</Badge>
                </Table.Cell>
                <Table.Cell>4.1</Table.Cell>
                <Table.Cell>3 days ago</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <Text weight="medium">Data Platform Review</Text>
                </Table.Cell>
                <Table.Cell>DataFlow Ltd</Table.Cell>
                <Table.Cell>Data Maturity</Table.Cell>
                <Table.Cell>
                  <Badge color="gray">Draft</Badge>
                </Table.Cell>
                <Table.Cell>-</Table.Cell>
                <Table.Cell>5 days ago</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <Text weight="medium">Kubernetes Readiness</Text>
                </Table.Cell>
                <Table.Cell>CloudNative Co</Table.Cell>
                <Table.Cell>Cloud Maturity</Table.Cell>
                <Table.Cell>
                  <Badge color="yellow">In Progress</Badge>
                </Table.Cell>
                <Table.Cell>3.0</Table.Cell>
                <Table.Cell>1 week ago</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Card>

        {/* Quick Actions & Activity */}
        <Grid columns={{ initial: '1', md: '2' }} gap="6">
          <Card>
            <Text size="4" weight="bold" mb="4">Quick Actions</Text>
            <Flex direction="column" gap="3">
              <Button variant="outline" asChild style={{ justifyContent: 'flex-start' }}>
                <Link href="/assessments/new">
                  <PlusCircledIcon width={18} height={18} />
                  Start New Assessment
                </Link>
              </Button>
              <Button variant="outline" asChild style={{ justifyContent: 'flex-start' }}>
                <Link href="/admin/import">
                  <UploadIcon width={18} height={18} />
                  Import Assessment Template
                </Link>
              </Button>
              <Button variant="outline" asChild style={{ justifyContent: 'flex-start' }}>
                <Link href="/admin/types">
                  <FileTextIcon width={18} height={18} />
                  Create Assessment Type
                </Link>
              </Button>
              <Button variant="outline" asChild style={{ justifyContent: 'flex-start' }}>
                <Link href="/reports">
                  <DownloadIcon width={18} height={18} />
                  Export Reports
                </Link>
              </Button>
            </Flex>
          </Card>

          <Card>
            <Text size="4" weight="bold" mb="4">Recent Activity</Text>
            <Flex direction="column" gap="4">
              <ActivityItem
                initials="JD"
                color="green"
                title="Completed Cloud Infrastructure Review"
                subtitle="Acme Corp - 2 hours ago"
              />
              <ActivityItem
                initials="SM"
                color="yellow"
                title="Updated DevOps Assessment Q1"
                subtitle="TechStart Inc - 1 day ago"
              />
              <ActivityItem
                initials="AK"
                color="blue"
                title="Created new assessment type"
                subtitle="Data Platform Maturity - 2 days ago"
              />
              <ActivityItem
                initials="LP"
                color="purple"
                title="Exported Security Posture Analysis"
                subtitle="GlobalBank - 3 days ago"
              />
            </Flex>
          </Card>
        </Grid>
      </Box>
    </Box>
  )
}

interface StatCardProps {
  label: string
  value: string
  change: string
  positive?: boolean
  icon: React.ReactNode
}

function StatCard({ label, value, change, positive, icon }: StatCardProps) {
  return (
    <Card>
      <Flex justify="between" align="start" mb="2">
        <Text size="2" color="gray">{label}</Text>
        <Box style={{ color: 'var(--gray-9)' }}>{icon}</Box>
      </Flex>
      <Text size="7" weight="bold">{value}</Text>
      <Text size="2" color={positive ? 'green' : 'gray'} mt="2">
        {change}
      </Text>
    </Card>
  )
}

interface ActivityItemProps {
  initials: string
  color: string
  title: string
  subtitle: string
}

function ActivityItem({ initials, color, title, subtitle }: ActivityItemProps) {
  const colorMap: Record<string, string> = {
    green: 'var(--green-9)',
    yellow: 'var(--yellow-9)',
    blue: 'var(--blue-9)',
    purple: 'var(--purple-9)',
  }

  return (
    <Flex gap="3" align="start">
      <Box
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: colorMap[color] || 'var(--gray-9)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {initials}
      </Box>
      <Box>
        <Text size="2" weight="medium">{title}</Text>
        <Text size="2" color="gray">{subtitle}</Text>
      </Box>
    </Flex>
  )
}
