# PDF Export Components

This directory contains components and utilities for exporting assessment results to PDF.

## Files

### `pdf-export.ts`
Core utility functions for PDF generation using jsPDF and html2canvas.

**Functions:**
- `exportToPDF(elementId, options)`: Exports an HTML element to PDF file with multi-page support
- `generatePDFBlob(elementId, options)`: Generates PDF as Blob for programmatic use

### `PDFDocument.tsx`
React component that renders assessment results in a PDF-ready format (A4 size).

**Props:**
```typescript
interface PDFDocumentProps {
  results: AssessmentResults
  generatedDate?: Date
}
```

### `ShareDialog.tsx`
Dialog component for sharing assessment results with copy-to-clipboard functionality.

**Props:**
```typescript
interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessmentId: string
}
```

## Integration Example

```tsx
'use client'

import { useState } from 'react'
import { Button, Box } from '@radix-ui/themes'
import { DownloadIcon, Share1Icon } from '@radix-ui/react-icons'
import { PDFDocument, ShareDialog } from '@/components/export'
import { exportToPDF } from '@/lib/pdf-export'

export function ResultsPage({ results, assessmentId }) {
  const [exporting, setExporting] = useState(false)
  const [showPDFPreview, setShowPDFPreview] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  async function handleExportPDF() {
    setShowPDFPreview(true)
    setExporting(true)

    // Wait for DOM to render
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

  return (
    <>
      {/* Action buttons */}
      <Button onClick={handleExportPDF} disabled={exporting}>
        <DownloadIcon />
        {exporting ? 'Generating PDF...' : 'Export PDF'}
      </Button>

      <Button onClick={() => setShareDialogOpen(true)}>
        <Share1Icon />
        Share Results
      </Button>

      {/* Regular page content */}
      <div>
        {/* Your results display here */}
      </div>

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

      {/* Share dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        assessmentId={assessmentId}
      />
    </>
  )
}
```

## Notes

- The PDFDocument component must be rendered in the DOM before calling `exportToPDF`
- Use a 500ms delay to ensure the component (especially charts) fully renders
- Hide the PDFDocument off-screen using `position: absolute; left: -9999px`
- Multi-page PDFs are automatically created for long content
- The export uses 2x scale for high-quality rendering
