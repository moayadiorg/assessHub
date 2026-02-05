'use client'

import { useState, useEffect, use } from 'react'
import {
  Box,
  Card,
  Flex,
  Text,
  Badge,
  Button,
  Table,
  Heading,
} from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { TrendChart } from '@/components/visualization/TrendChart'
import { SpiderChart } from '@/components/visualization/SpiderChart'
import { exportToPDF } from '@/lib/pdf-export'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  DownloadIcon,
  ArrowLeftIcon,
} from '@radix-ui/react-icons'
import Link from 'next/link'

interface CustomerReport {
  customer: { id: string; name: string }
  totalAssessments: number
  assessmentsByType: Array<{
    typeId: string
    typeName: string
    iconColor: string
    assessments: Array<{
      id: string
      name: string
      completedAt: string
      overallScore: number
      maturityLevel: { level: number; name: string }
      categoryScores: Array<{
        categoryId: string
        categoryName: string
        score: number
      }>
    }>
    trend: {
      direction: 'improving' | 'declining' | 'stable'
      firstScore: number
      lastScore: number
      change: number
    } | null
  }>
}

export default function CustomerReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [report, setReport] = useState<CustomerReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetch(`/api/reports/customer/${id}`)
      .then(r => {
        if (r.status === 401) {
          window.location.href = '/auth/signin'
          return
        }
        if (!r.ok) throw new Error('Failed to load report')
        return r.json()
      })
      .then(data => {
        if (data) {
          setReport(data)
          setLoading(false)
        }
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportToPDF('customer-report', {
        filename: `${report?.customer.name}-report.pdf`,
        orientation: 'portrait'
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <Box>
        <Header title="Customer Report" />
        <Box p="6"><Text>Loading report...</Text></Box>
      </Box>
    )
  }

  if (error || !report) {
    return (
      <Box>
        <Header title="Customer Report" />
        <Box p="6">
          <Card>
            <Text color="red">{error || 'Customer not found'}</Text>
            <Box mt="4">
              <Button variant="soft" asChild>
                <Link href="/reports">
                  <ArrowLeftIcon />
                  Back to Reports
                </Link>
              </Button>
            </Box>
          </Card>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Header title="Customer Report" />

      <Box p="6">
        {/* Actions Bar */}
        <Flex justify="between" align="center" mb="6">
          <Button variant="ghost" asChild>
            <Link href="/reports">
              <ArrowLeftIcon />
              Back to Reports
            </Link>
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            <DownloadIcon />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </Flex>

        {/* Report Content */}
        <Box id="customer-report">
          {/* Customer Header */}
          <Card mb="6">
            <Heading size="6" mb="2">{report.customer.name}</Heading>
            <Flex gap="6">
              <Box>
                <Text size="6" weight="bold">{report.totalAssessments}</Text>
                <Text size="2" color="gray"> completed assessments</Text>
              </Box>
              <Box>
                <Text size="6" weight="bold">{report.assessmentsByType.length}</Text>
                <Text size="2" color="gray"> assessment types</Text>
              </Box>
            </Flex>
          </Card>

          {/* Assessment Types */}
          {report.assessmentsByType.map(typeData => (
            <Card key={typeData.typeId} mb="6">
              {/* Type Header */}
              <Flex justify="between" align="center" mb="4">
                <Flex align="center" gap="3">
                  <Box
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: typeData.iconColor
                    }}
                  />
                  <Text size="5" weight="bold">{typeData.typeName}</Text>
                  <Badge variant="soft">
                    {typeData.assessments.length} assessment{typeData.assessments.length !== 1 ? 's' : ''}
                  </Badge>
                </Flex>

                {/* Trend Indicator */}
                {typeData.trend && (
                  <TrendIndicator trend={typeData.trend} />
                )}
              </Flex>

              {/* Trend Chart */}
              {typeData.assessments.length >= 2 && (
                <Box mb="4">
                  <TrendChart
                    data={typeData.assessments.map(a => ({
                      name: a.name,
                      date: a.completedAt,
                      score: a.overallScore
                    }))}
                    color={typeData.iconColor}
                  />
                </Box>
              )}

              {/* Assessments Table */}
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Assessment</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Completed</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Score</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Maturity Level</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {typeData.assessments.map(assessment => (
                    <Table.Row key={assessment.id}>
                      <Table.Cell>
                        <Link href={`/assessments/${assessment.id}/results`}>
                          <Text weight="medium" style={{ color: 'var(--accent-9)', cursor: 'pointer' }}>
                            {assessment.name}
                          </Text>
                        </Link>
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(assessment.completedAt).toLocaleDateString()}
                      </Table.Cell>
                      <Table.Cell>
                        <Text weight="bold">{assessment.overallScore.toFixed(1)}</Text>
                        <Text color="gray"> / 5</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={getMaturityColor(assessment.maturityLevel.level)}>
                          Level {assessment.maturityLevel.level}: {assessment.maturityLevel.name}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>

              {/* Latest Assessment Spider Chart */}
              {typeData.assessments.length > 0 && (
                <Box mt="4">
                  <Text size="2" color="gray" mb="2">
                    Latest Assessment Category Scores
                  </Text>
                  <SpiderChart
                    categoryScores={typeData.assessments[typeData.assessments.length - 1].categoryScores}
                  />
                </Box>
              )}
            </Card>
          ))}

          {report.assessmentsByType.length === 0 && (
            <Card>
              <Text color="gray">
                No completed assessments found for this customer.
              </Text>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  )
}

function TrendIndicator({ trend }: { trend: { direction: string; change: number } }) {
  const config = {
    improving: { icon: ArrowUpIcon, color: 'green', label: 'Improving' },
    declining: { icon: ArrowDownIcon, color: 'red', label: 'Declining' },
    stable: { icon: MinusIcon, color: 'gray', label: 'Stable' }
  }[trend.direction] || { icon: MinusIcon, color: 'gray', label: 'Stable' }

  const Icon = config.icon

  return (
    <Flex align="center" gap="2">
      <Badge color={config.color as any} variant="soft">
        <Icon width={12} height={12} />
        {config.label}
      </Badge>
      <Text size="2" color={config.color as any}>
        {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}
      </Text>
    </Flex>
  )
}

function getMaturityColor(level: number): 'red' | 'orange' | 'yellow' | 'blue' | 'green' {
  const colors: Record<number, 'red' | 'orange' | 'yellow' | 'blue' | 'green'> = {
    1: 'red',
    2: 'orange',
    3: 'yellow',
    4: 'blue',
    5: 'green'
  }
  return colors[level] || 'red'
}
