# Plan 06: CSV Import

## Overview
Build the CSV import functionality allowing bulk creation of assessment types, categories, questions, and maturity level options from a CSV file.

## Dependencies
- **Plan 01**: Assessment Types API
- **Plan 02**: Categories & Questions API

## Package Installation
```bash
npm install papaparse
npm install -D @types/papaparse
```

## Files to Create

### 1. `assess-hub/src/app/api/assessment-types/import/route.ts`
API endpoint to process CSV import.

### 2. `assess-hub/src/app/admin/import/page.tsx`
Import UI with file upload, preview, and import execution.

### 3. `assess-hub/src/components/admin/CSVDropzone.tsx`
File drop zone component.

### 4. `assess-hub/src/components/admin/CSVPreview.tsx`
Preview table showing parsed data.

### 5. `assess-hub/src/components/admin/CSVValidation.tsx`
Validation error display.

### 6. `assess-hub/src/lib/csv-parser.ts`
CSV parsing and validation utilities.

## CSV Format

### Template Structure
```csv
assessment_type,category,category_order,question,question_order,level_1,level_2,level_3,level_4,level_5
```

### Column Definitions
| Column | Required | Description |
|--------|----------|-------------|
| assessment_type | Yes | Name of assessment type |
| category | Yes | Category name |
| category_order | Yes | Display order (integer) |
| question | Yes | Question text |
| question_order | Yes | Order within category |
| level_1 | Yes | Description for score 1 (Initial) |
| level_2 | Yes | Description for score 2 (Managed) |
| level_3 | Yes | Description for score 3 (Defined) |
| level_4 | Yes | Description for score 4 (Quantitatively Managed) |
| level_5 | Yes | Description for score 5 (Optimizing) |

## Implementation Details

### CSV Parser Utility
```typescript
// assess-hub/src/lib/csv-parser.ts
import Papa from 'papaparse'

export interface CSVRow {
  assessment_type: string
  category: string
  category_order: string
  question: string
  question_order: string
  level_1: string
  level_2: string
  level_3: string
  level_4: string
  level_5: string
}

export interface ValidationError {
  row: number
  column: string
  message: string
}

export interface ParsedImport {
  assessmentType: string
  categories: {
    name: string
    order: number
    questions: {
      text: string
      order: number
      options: { score: number; label: string; description: string }[]
    }[]
  }[]
}

const REQUIRED_COLUMNS = [
  'assessment_type',
  'category',
  'category_order',
  'question',
  'question_order',
  'level_1',
  'level_2',
  'level_3',
  'level_4',
  'level_5',
]

const LEVEL_LABELS: Record<number, string> = {
  1: 'Initial',
  2: 'Managed',
  3: 'Defined',
  4: 'Quantitatively Managed',
  5: 'Optimizing',
}

export function parseCSV(csvString: string): {
  data: CSVRow[]
  errors: ValidationError[]
} {
  const result = Papa.parse<CSVRow>(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  const errors: ValidationError[] = []

  // Check for required columns
  const headers = result.meta.fields || []
  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      errors.push({
        row: 0,
        column: col,
        message: `Missing required column: ${col}`,
      })
    }
  }

  // Validate each row
  result.data.forEach((row, index) => {
    const rowNum = index + 2 // Account for header row + 1-indexed

    // Required fields
    if (!row.assessment_type?.trim()) {
      errors.push({ row: rowNum, column: 'assessment_type', message: 'Assessment type is required' })
    }
    if (!row.category?.trim()) {
      errors.push({ row: rowNum, column: 'category', message: 'Category is required' })
    }
    if (!row.question?.trim()) {
      errors.push({ row: rowNum, column: 'question', message: 'Question is required' })
    }

    // Order fields must be numbers
    if (isNaN(parseInt(row.category_order))) {
      errors.push({ row: rowNum, column: 'category_order', message: 'Category order must be a number' })
    }
    if (isNaN(parseInt(row.question_order))) {
      errors.push({ row: rowNum, column: 'question_order', message: 'Question order must be a number' })
    }

    // Level descriptions required
    for (let i = 1; i <= 5; i++) {
      const key = `level_${i}` as keyof CSVRow
      if (!row[key]?.trim()) {
        errors.push({ row: rowNum, column: key, message: `Level ${i} description is required` })
      }
    }
  })

  return { data: result.data, errors }
}

export function transformToImport(rows: CSVRow[]): ParsedImport[] {
  const typeMap = new Map<string, ParsedImport>()

  for (const row of rows) {
    const typeName = row.assessment_type.trim()

    if (!typeMap.has(typeName)) {
      typeMap.set(typeName, {
        assessmentType: typeName,
        categories: [],
      })
    }

    const typeData = typeMap.get(typeName)!
    const categoryName = row.category.trim()
    const categoryOrder = parseInt(row.category_order)

    let category = typeData.categories.find(c => c.name === categoryName)
    if (!category) {
      category = {
        name: categoryName,
        order: categoryOrder,
        questions: [],
      }
      typeData.categories.push(category)
    }

    category.questions.push({
      text: row.question.trim(),
      order: parseInt(row.question_order),
      options: [1, 2, 3, 4, 5].map(score => ({
        score,
        label: LEVEL_LABELS[score],
        description: row[`level_${score}` as keyof CSVRow]?.trim() || '',
      })),
    })
  }

  // Sort categories and questions by order
  for (const type of typeMap.values()) {
    type.categories.sort((a, b) => a.order - b.order)
    for (const cat of type.categories) {
      cat.questions.sort((a, b) => a.order - b.order)
    }
  }

  return Array.from(typeMap.values())
}

export function generateTemplate(): string {
  const rows = [
    REQUIRED_COLUMNS.join(','),
    'Cloud Maturity,Infrastructure,1,How automated is your infrastructure provisioning?,1,Manual provisioning,Some scripts,IaC templates,Full IaC with CI/CD,Self-service platform',
    'Cloud Maturity,Infrastructure,1,How do you manage infrastructure state?,2,No tracking,Spreadsheets,Basic state files,Centralized state management,GitOps with drift detection',
    'Cloud Maturity,Security,2,How are secrets managed?,1,Hardcoded,Environment variables,Vault with manual rotation,Automated rotation,Zero-trust dynamic secrets',
  ]
  return rows.join('\n')
}
```

### Import API Endpoint
```typescript
// assess-hub/src/app/api/assessment-types/import/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { parseCSV, transformToImport, ParsedImport } from '@/lib/csv-parser'

export async function POST(request: Request) {
  try {
    const { csv } = await request.json()

    if (!csv) {
      return NextResponse.json(
        { error: 'CSV content is required' },
        { status: 400 }
      )
    }

    // Parse and validate
    const { data, errors } = parseCSV(csv)

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      )
    }

    // Transform to import structure
    const imports = transformToImport(data)

    // Import each assessment type
    const results = []

    for (const importData of imports) {
      const result = await importAssessmentType(importData)
      results.push(result)
    }

    return NextResponse.json({
      success: true,
      imported: results,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    )
  }
}

async function importAssessmentType(data: ParsedImport) {
  // Create assessment type
  const assessmentType = await prisma.assessmentType.create({
    data: {
      name: data.assessmentType,
      description: `Imported from CSV`,
      version: '1.0',
    },
  })

  let categoryCount = 0
  let questionCount = 0

  // Create categories and questions
  for (const catData of data.categories) {
    const category = await prisma.category.create({
      data: {
        assessmentTypeId: assessmentType.id,
        name: catData.name,
        order: catData.order,
      },
    })
    categoryCount++

    for (const qData of catData.questions) {
      await prisma.question.create({
        data: {
          categoryId: category.id,
          text: qData.text,
          order: qData.order,
          options: {
            create: qData.options.map(opt => ({
              score: opt.score,
              label: opt.label,
              description: opt.description,
            })),
          },
        },
      })
      questionCount++
    }
  }

  return {
    id: assessmentType.id,
    name: assessmentType.name,
    categories: categoryCount,
    questions: questionCount,
  }
}

// GET endpoint for template download
export async function GET() {
  const { generateTemplate } = await import('@/lib/csv-parser')
  const template = generateTemplate()

  return new NextResponse(template, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="assessment-template.csv"',
    },
  })
}
```

### Import Page UI
```tsx
// assess-hub/src/app/admin/import/page.tsx
'use client'

import { useState } from 'react'
import {
  Box,
  Card,
  Flex,
  Text,
  Button,
  Table,
  Callout,
  Badge,
} from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { CSVDropzone } from '@/components/admin/CSVDropzone'
import {
  UploadIcon,
  DownloadIcon,
  CheckCircledIcon,
  CrossCircledIcon,
} from '@radix-ui/react-icons'

interface ValidationError {
  row: number
  column: string
  message: string
}

interface ImportResult {
  id: string
  name: string
  categories: number
  questions: number
}

export default function ImportPage() {
  const [csvContent, setCSVContent] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<ImportResult[] | null>(null)

  async function handleFileSelect(content: string, name: string) {
    setCSVContent(content)
    setFileName(name)
    setErrors([])
    setResults(null)

    // Parse for preview
    const Papa = (await import('papaparse')).default
    const parsed = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      preview: 10,
    })
    setPreviewRows(parsed.data)
  }

  async function handleImport() {
    if (!csvContent) return

    setImporting(true)
    setErrors([])

    try {
      const res = await fetch('/api/assessment-types/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvContent }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors)
        } else {
          setErrors([{ row: 0, column: '', message: data.error }])
        }
        return
      }

      setResults(data.imported)
    } catch (err: any) {
      setErrors([{ row: 0, column: '', message: err.message }])
    } finally {
      setImporting(false)
    }
  }

  function handleDownloadTemplate() {
    window.location.href = '/api/assessment-types/import'
  }

  function handleReset() {
    setCSVContent(null)
    setFileName(null)
    setPreviewRows([])
    setErrors([])
    setResults(null)
  }

  return (
    <Box>
      <Header title="CSV Import" />
      <Box p="6">
        {/* Instructions */}
        <Card mb="6">
          <Flex justify="between" align="start">
            <Box>
              <Text size="4" weight="bold" mb="2">
                Import Assessment Structure
              </Text>
              <Text size="2" color="gray">
                Upload a CSV file to bulk create assessment types, categories,
                questions, and maturity level descriptions.
              </Text>
            </Box>
            <Button variant="soft" onClick={handleDownloadTemplate}>
              <DownloadIcon /> Download Template
            </Button>
          </Flex>
        </Card>

        {/* Success Results */}
        {results && (
          <Callout.Root color="green" mb="6">
            <Callout.Icon>
              <CheckCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              <Text weight="bold">Import Successful!</Text>
              <Box mt="2">
                {results.map((r) => (
                  <Text key={r.id} size="2" style={{ display: 'block' }}>
                    • {r.name}: {r.categories} categories, {r.questions} questions
                  </Text>
                ))}
              </Box>
            </Callout.Text>
          </Callout.Root>
        )}

        {/* Validation Errors */}
        {errors.length > 0 && (
          <Callout.Root color="red" mb="6">
            <Callout.Icon>
              <CrossCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              <Text weight="bold">Validation Errors</Text>
              <Box mt="2" style={{ maxHeight: 200, overflow: 'auto' }}>
                {errors.map((err, i) => (
                  <Text key={i} size="2" style={{ display: 'block' }}>
                    {err.row > 0 ? `Row ${err.row}` : 'File'}
                    {err.column && ` (${err.column})`}: {err.message}
                  </Text>
                ))}
              </Box>
            </Callout.Text>
          </Callout.Root>
        )}

        {/* File Upload */}
        {!csvContent ? (
          <CSVDropzone onFileSelect={handleFileSelect} />
        ) : (
          <Card>
            <Flex justify="between" align="center" mb="4">
              <Flex align="center" gap="2">
                <Badge>{fileName}</Badge>
                <Text size="2" color="gray">
                  {previewRows.length}+ rows
                </Text>
              </Flex>
              <Flex gap="2">
                <Button variant="soft" color="gray" onClick={handleReset}>
                  Choose Different File
                </Button>
                <Button onClick={handleImport} disabled={importing}>
                  <UploadIcon />
                  {importing ? 'Importing...' : 'Import'}
                </Button>
              </Flex>
            </Flex>

            {/* Preview Table */}
            <Box style={{ overflow: 'auto' }}>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Category</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Question</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>L1</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>L5</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {previewRows.map((row, i) => (
                    <Table.Row key={i}>
                      <Table.Cell>{row.assessment_type}</Table.Cell>
                      <Table.Cell>{row.category}</Table.Cell>
                      <Table.Cell style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.question}
                      </Table.Cell>
                      <Table.Cell style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.level_1}
                      </Table.Cell>
                      <Table.Cell style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.level_5}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
            {previewRows.length === 10 && (
              <Text size="2" color="gray" mt="2">
                Showing first 10 rows...
              </Text>
            )}
          </Card>
        )}
      </Box>
    </Box>
  )
}
```

### CSV Dropzone Component
```tsx
// assess-hub/src/components/admin/CSVDropzone.tsx
'use client'

import { useCallback } from 'react'
import { Box, Text, Flex } from '@radix-ui/themes'
import { UploadIcon } from '@radix-ui/react-icons'

interface CSVDropzoneProps {
  onFileSelect: (content: string, fileName: string) => void
}

export function CSVDropzone({ onFileSelect }: CSVDropzoneProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [onFileSelect]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [onFileSelect]
  )

  function processFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      onFileSelect(content, file.name)
    }
    reader.readAsText(file)
  }

  return (
    <Box
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{
        border: '2px dashed var(--gray-6)',
        borderRadius: 8,
        padding: 48,
        textAlign: 'center',
        cursor: 'pointer',
      }}
      onClick={() => document.getElementById('csv-input')?.click()}
    >
      <input
        id="csv-input"
        type="file"
        accept=".csv"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <Flex direction="column" align="center" gap="3">
        <Box style={{ color: 'var(--gray-9)' }}>
          <UploadIcon width={48} height={48} />
        </Box>
        <Text size="4" weight="bold">
          Drop CSV file here
        </Text>
        <Text size="2" color="gray">
          or click to browse
        </Text>
      </Flex>
    </Box>
  )
}
```

## Testing Checklist
- [ ] Template download works
- [ ] File drop zone accepts CSV files
- [ ] File input accepts CSV files
- [ ] Preview shows first 10 rows
- [ ] Validation catches missing columns
- [ ] Validation catches empty required fields
- [ ] Validation catches non-numeric order fields
- [ ] Import creates assessment type
- [ ] Import creates categories in order
- [ ] Import creates questions with options
- [ ] Success message shows counts
- [ ] Error messages display clearly
- [ ] Reset allows new file selection

## Completion Criteria
- Template download with example data
- Drag-and-drop file upload
- Data preview before import
- Comprehensive validation with row-level errors
- Atomic import (transaction)
- Success/error feedback
