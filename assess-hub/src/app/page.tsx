'use client'

import { Box, Card, Flex, Text, Grid, Button, Table, Badge, Skeleton } from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { useState, useEffect } from 'react'
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

interface DashboardStats {
  totalAssessments: number
  byStatus: {
    draft: number
    inProgress: number
    completed: number
  }
  byType: Array<{
    typeId: string
    typeName: string
    iconColor: string
    count: number
    completedCount: number
    avgScore: number | null
  }>
  recentAssessments: Array<{
    id: string
    name: string
    customerName: string
    typeName: string
    status: string
    score: number | null
    updatedAt: string
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load dashboard statistics')
        return res.json()
      })
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (error) {
    return (
      <Box>
        <Header title="Dashboard" />
        <Box p="6">
          <Card>
            <Text color="red">Error loading dashboard: {error}</Text>
          </Card>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Header title="Dashboard" />

      <Box p="6">
        {/* Stats Grid */}
        <Grid columns={{ initial: '1', sm: '2', lg: '4' }} gap="4" mb="6">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : stats ? (
            <>
              <StatCard
                label="Total Assessments"
                value={stats.totalAssessments.toString()}
                change={`${stats.byStatus.draft} draft, ${stats.byStatus.inProgress} in progress`}
                icon={<FileTextIcon width={20} height={20} />}
              />
              <StatCard
                label="Completed"
                value={stats.byStatus.completed.toString()}
                change={
                  stats.totalAssessments === 0
                    ? 'No assessments yet'
                    : `${Math.round((stats.byStatus.completed / stats.totalAssessments) * 100)}% completion rate`
                }
                positive={stats.byStatus.completed > 0}
                icon={<CheckCircledIcon width={20} height={20} />}
              />
              <StatCard
                label="In Progress"
                value={stats.byStatus.inProgress.toString()}
                change={`${stats.byStatus.draft} awaiting start`}
                icon={<ReloadIcon width={20} height={20} />}
              />
              <StatCard
                label="Avg. Maturity Score"
                value={calculateOverallAvgScore(stats.byType)}
                change={`Across ${stats.byType.length} assessment types`}
                positive
                icon={<BarChartIcon width={20} height={20} />}
              />
            </>
          ) : null}
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

          {loading ? (
            <Box>
              <Skeleton height="40px" mb="2" />
              <Skeleton height="40px" mb="2" />
              <Skeleton height="40px" mb="2" />
            </Box>
          ) : stats && stats.recentAssessments.length > 0 ? (
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
                {stats.recentAssessments.map(assessment => (
                  <Table.Row key={assessment.id}>
                    <Table.Cell>
                      <Link href={`/assessments/${assessment.id}`}>
                        <Text weight="medium" style={{ cursor: 'pointer' }}>
                          {assessment.name}
                        </Text>
                      </Link>
                    </Table.Cell>
                    <Table.Cell>{assessment.customerName}</Table.Cell>
                    <Table.Cell>{assessment.typeName}</Table.Cell>
                    <Table.Cell>
                      <Badge color={getStatusColor(assessment.status)}>
                        {formatStatus(assessment.status)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      {assessment.score !== null ? assessment.score.toFixed(1) : '-'}
                    </Table.Cell>
                    <Table.Cell>{formatRelativeTime(assessment.updatedAt)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          ) : (
            <Box py="6" style={{ textAlign: 'center' }}>
              <Text color="gray">No assessments yet. Create your first assessment to get started.</Text>
            </Box>
          )}
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

// Helper functions
function getStatusColor(status: string): 'green' | 'yellow' | 'gray' {
  switch (status) {
    case 'completed':
      return 'green'
    case 'in-progress':
      return 'yellow'
    default:
      return 'gray'
  }
}

function formatStatus(status: string): string {
  switch (status) {
    case 'in-progress':
      return 'In Progress'
    case 'completed':
      return 'Completed'
    default:
      return 'Draft'
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  }
  const months = Math.floor(diffDays / 30)
  return `${months} month${months !== 1 ? 's' : ''} ago`
}

function calculateOverallAvgScore(
  byType: Array<{ avgScore: number | null }>
): string {
  const validScores = byType
    .map(t => t.avgScore)
    .filter((score): score is number => score !== null)

  if (validScores.length === 0) return '-'

  const avg = validScores.reduce((sum, s) => sum + s, 0) / validScores.length
  return avg.toFixed(1)
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

function StatCardSkeleton() {
  return (
    <Card>
      <Flex justify="between" align="start" mb="2">
        <Skeleton width="80px" height="16px" />
        <Skeleton width="20px" height="20px" />
      </Flex>
      <Skeleton width="60px" height="32px" mb="2" />
      <Skeleton width="120px" height="16px" />
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
