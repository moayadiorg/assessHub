'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Box,
  Card,
  Flex,
  Grid,
  Text,
  Button,
} from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { SpiderChart } from '@/components/visualization/SpiderChart'
import { Heatmap } from '@/components/visualization/Heatmap'
import { ScoreSummary } from '@/components/visualization/ScoreSummary'
import { CategoryBreakdown } from '@/components/visualization/CategoryBreakdown'
import { PDFDocument, ShareDialog } from '@/components/export'
import { exportToPDF } from '@/lib/pdf-export'
import Link from 'next/link'
import { DownloadIcon, Share1Icon, ArrowLeftIcon, ReloadIcon } from '@radix-ui/react-icons'

interface AssessmentResults {
  assessmentId: string
  assessmentName: string
  customerName: string
  status: string
  overallScore: number
  maturityLevel: {
    level: number
    name: string
  }
  categoryScores: CategoryScore[]
  totalQuestions: number
  answeredQuestions: number
}

interface CategoryScore {
  categoryId: string
  categoryName: string
  score: number
  answeredQuestions: number
  totalQuestions: number
  questionScores: {
    questionId: string
    questionText: string
    score: number | null
    commentary: string | null
  }[]
}

export default function ResultsPage() {
  const params = useParams()
  const id = params?.id as string
  const [results, setResults] = useState<AssessmentResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [showPDFPreview, setShowPDFPreview] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  useEffect(() => {
    if (id) {
      fetchResults()
    }
  }, [id])

  async function fetchResults() {
    const res = await fetch(`/api/assessments/${id}/results`)
    const data = await res.json()
    setResults(data)
    setLoading(false)
  }

  async function handleExportPDF() {
    if (!results) return
    setShowPDFPreview(true)
    setExporting(true)

    // Wait for render
    await new Promise((resolve) => setTimeout(resolve, 500))

    try {
      await exportToPDF('pdf-content', {
        filename: `${results.assessmentName.replace(/\s+/g, '-')}-results.pdf`,
      })
    } catch (err) {
      console.error('Failed to export PDF:', err)
    } finally {
      setExporting(false)
      setShowPDFPreview(false)
    }
  }

  if (loading || !results) {
    return (
      <Box>
        <Header title="Loading..." />
        <Flex justify="center" p="8">
          <Text>Loading results...</Text>
        </Flex>
      </Box>
    )
  }

  return (
    <Box>
      <Header title="Assessment Results" />
      <Box p="6">
        {/* Header */}
        <Flex justify="between" align="start" mb="6">
          <Box>
            <Button variant="ghost" asChild mb="2">
              <Link href="/assessments">
                <ArrowLeftIcon /> Back to Assessments
              </Link>
            </Button>
            <Text size="6" weight="bold" className="font-heading" style={{ display: 'block' }}>
              {results.assessmentName}
            </Text>
            <Text size="3" color="gray">
              {results.customerName}
            </Text>
          </Box>

          <Flex gap="2">
            <Button variant="soft" onClick={() => setShareDialogOpen(true)}>
              <Share1Icon /> Share
            </Button>
            <Button onClick={handleExportPDF} disabled={exporting}>
              {exporting ? <ReloadIcon className="animate-spin" /> : <DownloadIcon />}
              {exporting ? 'Generating...' : 'Export PDF'}
            </Button>
          </Flex>
        </Flex>

        {/* Summary Cards */}
        <ScoreSummary results={results} />

        {/* Charts */}
        <Grid columns={{ initial: '1', lg: '2' }} gap="6" mt="6">
          {/* Spider Chart */}
          <Card>
            <Text size="4" weight="bold" className="font-heading" mb="4">
              Category Scores
            </Text>
            <SpiderChart categoryScores={results.categoryScores} />
          </Card>

          {/* Heatmap */}
          <Card>
            <Text size="4" weight="bold" className="font-heading" mb="4">
              Question Heatmap
            </Text>
            <Heatmap categoryScores={results.categoryScores} />
          </Card>
        </Grid>

        {/* Category Breakdown */}
        <Card mt="6">
          <Text size="4" weight="bold" mb="4">
            Detailed Breakdown
          </Text>
          <CategoryBreakdown categoryScores={results.categoryScores} />
        </Card>
      </Box>

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        assessmentId={id}
      />

      {/* Hidden PDF content for export */}
      {showPDFPreview && (
        <Box
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
          }}
        >
          <PDFDocument results={results} />
        </Box>
      )}
    </Box>
  )
}
