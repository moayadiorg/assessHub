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

/**
 * ShareDialog component displays a shareable URL for assessment results.
 * Includes copy-to-clipboard functionality with visual feedback.
 */
export function ShareDialog({ open, onOpenChange, assessmentId }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  // Generate full URL for sharing (client-side only)
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/assessments/${assessmentId}/results`
    : ''

  /**
   * Copies the share URL to clipboard and shows success feedback
   */
  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    // Reset copied state after 2 seconds
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
          <IconButton onClick={handleCopy} variant="soft">
            {copied ? <CheckIcon /> : <CopyIcon />}
          </IconButton>
        </Flex>

        {copied && (
          <Text size="1" color="green" style={{ display: 'block', marginTop: 8 }}>
            Link copied to clipboard!
          </Text>
        )}

        <Flex justify="end" mt="4">
          <Dialog.Close>
            <Button variant="soft" type="button">Close</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}
