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
