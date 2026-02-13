'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Box,
  Card,
  Flex,
  Text,
  Grid,
  Badge,
  Button,
  Heading,
} from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { ComparisonSpiderChart } from '@/components/visualization/ComparisonSpiderChart'
import { ComparisonTable } from '@/components/visualization/ComparisonTable'
import { exportToPDF } from '@/lib/pdf-export'
import {
  DownloadIcon,
  ArrowLeftIcon,
  CheckCircledIcon,
} from '@radix-ui/react-icons'
import Link from 'next/link'

interface ComparisonReport {
  assessmentType: { id: string; name: string }
  assessment1: AssessmentData
  assessment2: AssessmentData
  comparison: {
    overallDelta: number
    winner: 1 | 2 | 'tie'
    categoryDeltas: CategoryDelta[]
  }
}

interface AssessmentData {
  id: string
  name: string
  customerName: string
  completedAt: string
  overallScore: number
  maturityLevel: { level: number; name: string }
  categoryScores: Array<{
    categoryId: string
    categoryName: string
    score: number
  }>
}

interface CategoryDelta {
  categoryId: string
  categoryName: string
  score1: number
  score2: number
  delta: number
  winner: 1 | 2 | 'tie'
}

export default function CompareReportPage() {
  return (
    <Suspense fallback={
      <Box>
        <Header title="Comparison Report" />
        <Box p="6"><Text>Loading comparison...</Text></Box>
      </Box>
    }>
      <CompareReportContent />
    </Suspense>
  )
}

function CompareReportContent() {
  const searchParams = useSearchParams()
  const a1 = searchParams.get('a1')
  const a2 = searchParams.get('a2')

  const [report, setReport] = useState<ComparisonReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!a1 || !a2) {
      setError('Missing assessment IDs')
      setLoading(false)
      return
    }

    fetch(`/api/reports/compare?a1=${a1}&a2=${a2}`)
      .then(r => {
        if (!r.ok) return r.json().then(d => Promise.reject(d))
        return r.json()
      })
      .then(data => {
        setReport(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.error || 'Failed to load comparison')
        setLoading(false)
      })
  }, [a1, a2])

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9_\-\.]/gi, '_')
  }

  const handleExport = async () => {
    if (!report) return

    setExporting(true)
    try {
      const name1 = sanitizeFilename(report.assessment1.name)
      const name2 = sanitizeFilename(report.assessment2.name)
      await exportToPDF('comparison-report', {
        filename: `comparison-${name1}-vs-${name2}.pdf`,
        orientation: 'landscape'
      })
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <Box>
        <Header title="Comparison Report" />
        <Box p="6"><Text>Loading comparison...</Text></Box>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Header title="Comparison Report" />
        <Box p="6">
          <Card>
            <Text color="red">{error}</Text>
            <Button variant="soft" mt="4" asChild>
              <Link href="/reports">Back to Reports</Link>
            </Button>
          </Card>
        </Box>
      </Box>
    )
  }

  if (!report) return null

  return (
    <Box>
      <Header title="Comparison Report" />

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
        <Box id="comparison-report">
          {/* Header */}
          <Card mb="6">
            <Flex justify="center" align="center" gap="2" mb="4">
              <Badge size="2" variant="soft">
                {report.assessmentType.name}
              </Badge>
            </Flex>
            <Heading size="5" align="center">Assessment Comparison</Heading>
          </Card>

          {/* Assessment Headers */}
          <Grid columns="2" gap="4" mb="6">
            <AssessmentHeader
              assessment={report.assessment1}
              color="blue"
              label="Assessment 1"
              isWinner={report.comparison.winner === 1}
            />
            <AssessmentHeader
              assessment={report.assessment2}
              color="green"
              label="Assessment 2"
              isWinner={report.comparison.winner === 2}
            />
          </Grid>

          {/* Overall Comparison */}
          <Card mb="6">
            <Flex justify="center" align="center" gap="4">
              <Box style={{ textAlign: 'center' }}>
                <Text size="7" weight="bold" color="blue">
                  {report.assessment1.overallScore.toFixed(1)}
                </Text>
                <Text size="2" color="gray" style={{ display: 'block' }}>
                  {report.assessment1.maturityLevel.name}
                </Text>
              </Box>

              <Box style={{ textAlign: 'center', padding: '0 20px' }}>
                <Text size="2" color="gray">Difference</Text>
                <Text
                  size="5"
                  weight="bold"
                  color={report.comparison.overallDelta > 0 ? 'blue' :
                         report.comparison.overallDelta < 0 ? 'green' : 'gray'}
                >
                  {report.comparison.overallDelta > 0 ? '+' : ''}
                  {report.comparison.overallDelta.toFixed(1)}
                </Text>
              </Box>

              <Box style={{ textAlign: 'center' }}>
                <Text size="7" weight="bold" color="green">
                  {report.assessment2.overallScore.toFixed(1)}
                </Text>
                <Text size="2" color="gray" style={{ display: 'block' }}>
                  {report.assessment2.maturityLevel.name}
                </Text>
              </Box>
            </Flex>
          </Card>

          {/* Spider Chart */}
          <Card mb="6">
            <Text size="4" weight="bold" mb="4">Category Comparison</Text>
            <ComparisonSpiderChart
              data1={report.assessment1.categoryScores}
              data2={report.assessment2.categoryScores}
              label1={report.assessment1.name}
              label2={report.assessment2.name}
            />
          </Card>

          {/* Comparison Table */}
          <Card>
            <Text size="4" weight="bold" mb="4">Detailed Comparison</Text>
            <ComparisonTable
              categoryDeltas={report.comparison.categoryDeltas}
              assessment1Name={report.assessment1.name}
              assessment2Name={report.assessment2.name}
            />
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

function AssessmentHeader({
  assessment,
  color,
  label,
  isWinner
}: {
  assessment: AssessmentData
  color: 'blue' | 'green'
  label: string
  isWinner: boolean
}) {
  return (
    <Card style={{ borderLeft: `4px solid var(--${color}-9)` }}>
      <Flex justify="between" align="start">
        <Box>
          <Flex align="center" gap="2" mb="2">
            <Badge color={color} variant="soft">{label}</Badge>
            {isWinner && (
              <Badge color="yellow" variant="soft">
                <CheckCircledIcon width={12} height={12} />
                Higher Score
              </Badge>
            )}
          </Flex>
          <Text size="4" weight="bold" style={{ display: 'block' }}>
            {assessment.name}
          </Text>
          <Text size="2" color="gray">{assessment.customerName}</Text>
        </Box>
        <Box style={{ textAlign: 'right' }}>
          <Text size="2" color="gray">Completed</Text>
          <Text size="2" style={{ display: 'block' }}>
            {new Date(assessment.completedAt).toLocaleDateString()}
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}
