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
      <Header title="CSV Import" showNewAssessment={false} />
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
                    {r.name}: {r.categories} categories, {r.questions} questions
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
