# Plan 10: PDF Export

## Overview
Implement PDF export functionality for assessment results using jsPDF and html2canvas.

## Dependencies
- **Plan 09**: Results & Visualization (needs results page)

## Package Installation
```bash
npm install jspdf html2canvas
npm install -D @types/html2canvas
```

## Files to Create

### 1. `assess-hub/src/lib/pdf-export.ts`
PDF generation utilities.

### 2. `assess-hub/src/components/export/PDFDocument.tsx`
Hidden component that renders the PDF-ready layout.

### 3. `assess-hub/src/app/api/assessments/[id]/export/route.ts`
Optional server-side PDF generation endpoint.

## Implementation Details

### PDF Export Utility
```typescript
// assess-hub/src/lib/pdf-export.ts
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFExportOptions {
  filename?: string
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'letter'
}

export async function exportToPDF(
  elementId: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = 'assessment-results.pdf',
    orientation = 'portrait',
    format = 'a4',
  } = options

  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  // Capture the element as canvas
  const canvas = await html2canvas(element, {
    scale: 2, // Higher quality
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png')

  // Create PDF
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10

  const imgWidth = pageWidth - margin * 2
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  // Handle multi-page
  let heightLeft = imgHeight
  let position = margin

  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
  heightLeft -= pageHeight - margin * 2

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2
  }

  pdf.save(filename)
}

export async function generatePDFBlob(
  elementId: string,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const { orientation = 'portrait', format = 'a4' } = options

  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 10
  const imgWidth = pageWidth - margin * 2
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight)

  return pdf.output('blob')
}
```

### PDF Document Component
```tsx
// assess-hub/src/components/export/PDFDocument.tsx
'use client'

import { Box, Flex, Text, Grid } from '@radix-ui/themes'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'

interface AssessmentResults {
  assessmentName: string
  customerName: string
  overallScore: number
  maturityLevel: {
    level: number
    name: string
  }
  categoryScores: {
    categoryId: string
    categoryName: string
    score: number
    questionScores: {
      questionText: string
      score: number | null
      commentary: string | null
    }[]
  }[]
}

interface PDFDocumentProps {
  results: AssessmentResults
  generatedDate?: Date
}

export function PDFDocument({ results, generatedDate = new Date() }: PDFDocumentProps) {
  return (
    <Box
      id="pdf-content"
      style={{
        width: '210mm', // A4 width
        padding: '20mm',
        backgroundColor: 'white',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Header */}
      <Flex justify="between" align="start" mb="6">
        <Box>
          <Text size="7" weight="bold" style={{ display: 'block', marginBottom: 8 }}>
            {results.assessmentName}
          </Text>
          <Text size="4" color="gray">
            {results.customerName}
          </Text>
        </Box>
        <Box style={{ textAlign: 'right' }}>
          <Text size="2" color="gray" style={{ display: 'block' }}>
            Generated: {generatedDate.toLocaleDateString()}
          </Text>
        </Box>
      </Flex>

      {/* Overall Score */}
      <Box
        mb="6"
        p="4"
        style={{
          backgroundColor: '#f8fafc',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
        }}
      >
        <Grid columns="3" gap="4">
          <Box>
            <Text size="2" color="gray" style={{ display: 'block' }}>
              Overall Score
            </Text>
            <Text size="8" weight="bold" style={{ color: getScoreColor(results.overallScore) }}>
              {results.overallScore.toFixed(1)}
            </Text>
            <Text size="3" color="gray"> / 5</Text>
          </Box>
          <Box>
            <Text size="2" color="gray" style={{ display: 'block' }}>
              Maturity Level
            </Text>
            <Text size="5" weight="bold">
              Level {results.maturityLevel.level}
            </Text>
            <Text size="3" color="gray" style={{ display: 'block' }}>
              {results.maturityLevel.name}
            </Text>
          </Box>
          <Box>
            <Text size="2" color="gray" style={{ display: 'block' }}>
              Categories Assessed
            </Text>
            <Text size="5" weight="bold">
              {results.categoryScores.length}
            </Text>
          </Box>
        </Grid>
      </Box>

      {/* Spider Chart */}
      <Box mb="6">
        <Text size="5" weight="bold" mb="4" style={{ display: 'block' }}>
          Category Scores Overview
        </Text>
        <Box style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={results.categoryScores.map((cs) => ({
                category: cs.categoryName,
                score: cs.score,
              }))}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} />
              <Radar
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Category Details */}
      <Box>
        <Text size="5" weight="bold" mb="4" style={{ display: 'block' }}>
          Detailed Results by Category
        </Text>
        {results.categoryScores.map((category) => (
          <Box
            key={category.categoryId}
            mb="4"
            style={{
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: 16,
            }}
          >
            <Flex justify="between" align="center" mb="3">
              <Text size="4" weight="bold">
                {category.categoryName}
              </Text>
              <Box
                style={{
                  backgroundColor: getScoreColor(category.score),
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 16,
                  fontSize: 14,
                  fontWeight: 'bold',
                }}
              >
                {category.score.toFixed(1)}
              </Box>
            </Flex>

            {category.questionScores.map((q, idx) => (
              <Flex
                key={idx}
                align="start"
                gap="3"
                mb="2"
                style={{ paddingLeft: 16 }}
              >
                <Box
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: q.score ? getScoreColor(q.score) : '#e2e8f0',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  {q.score || '-'}
                </Box>
                <Box style={{ flex: 1 }}>
                  <Text size="2" style={{ display: 'block' }}>
                    {q.questionText}
                  </Text>
                  {q.commentary && (
                    <Text
                      size="1"
                      color="gray"
                      style={{
                        display: 'block',
                        fontStyle: 'italic',
                        marginTop: 4,
                      }}
                    >
                      Note: {q.commentary}
                    </Text>
                  )}
                </Box>
              </Flex>
            ))}
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box
        mt="6"
        pt="4"
        style={{
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <Text size="1" color="gray">
          Generated by Assess Hub • {generatedDate.toLocaleString()}
        </Text>
      </Box>
    </Box>
  )
}

function getScoreColor(score: number): string {
  if (score >= 4) return '#10b981'
  if (score >= 3) return '#eab308'
  if (score >= 2) return '#f97316'
  return '#ef4444'
}
```

### Updated Results Page with Export
```tsx
// Add to assess-hub/src/app/assessments/[id]/results/page.tsx

import { useState, useRef } from 'react'
import { PDFDocument } from '@/components/export/PDFDocument'
import { exportToPDF } from '@/lib/pdf-export'

// Inside the component:
const [exporting, setExporting] = useState(false)
const [showPDFPreview, setShowPDFPreview] = useState(false)

async function handleExportPDF() {
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

// In the JSX:
<Button onClick={handleExportPDF} disabled={exporting}>
  <DownloadIcon />
  {exporting ? 'Generating PDF...' : 'Export PDF'}
</Button>

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
```

### Share Link Feature
```tsx
// assess-hub/src/components/export/ShareDialog.tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  Flex,
  Box,
  Text,
  TextField,
  Button,
  IconButton,
} from '@radix-ui/themes'
import { CopyIcon, CheckIcon } from '@radix-ui/react-icons'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessmentId: string
}

export function ShareDialog({ open, onOpenChange, assessmentId }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/assessments/${assessmentId}/results`
    : ''

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Share Results</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Anyone with this link can view the assessment results.
        </Dialog.Description>

        <Flex gap="2">
          <TextField.Root
            value={shareUrl}
            readOnly
            style={{ flex: 1 }}
          />
          <IconButton onClick={handleCopy}>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </IconButton>
        </Flex>

        <Flex justify="end" mt="4">
          <Dialog.Close>
            <Button variant="soft">Close</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}
```

## Testing Checklist
- [ ] Export button shows loading state
- [ ] PDF generates with all content
- [ ] PDF filename includes assessment name
- [ ] Spider chart renders in PDF
- [ ] Category scores display correctly
- [ ] Question details with scores
- [ ] Commentary included where present
- [ ] Multi-page PDF for long assessments
- [ ] Share dialog shows correct URL
- [ ] Copy to clipboard works
- [ ] Copied feedback shows

## Completion Criteria
- PDF export with full assessment results
- Spider chart included in PDF
- All questions with scores and commentary
- Professional formatting
- Share link functionality
- Responsive export button states
