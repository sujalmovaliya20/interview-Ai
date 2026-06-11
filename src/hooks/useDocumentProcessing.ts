'use client'

import { useState, useEffect } from 'react'

interface UseDocumentProcessingProps {
  documentId: string
  initiallyProcessed: boolean
}

export function useDocumentProcessing({ documentId, initiallyProcessed }: UseDocumentProcessingProps) {
  const [isProcessed, setIsProcessed] = useState(initiallyProcessed)
  const [error, setError] = useState<string | null>(null)
  const [tokenCount, setTokenCount] = useState<number | null>(null)

  useEffect(() => {
    if (initiallyProcessed || isProcessed || error) {
      return
    }

    let pollCount = 0
    const maxPolls = 20 // 60 seconds at 3s intervals

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/documents/processing-status?documentId=${documentId}`)
        if (!res.ok) throw new Error('Status check failed')
        
        const data = await res.json()
        
        if (data.isProcessed) {
          setIsProcessed(true)
          setTokenCount(data.tokenCount)
        } else if (data.error) {
          setError(data.error)
        }
      } catch (err) {
        console.error('Polling error:', err)
      }

      pollCount++
      if (pollCount >= maxPolls && !isProcessed && !error) {
        setError("Processing timed out")
      }
    }

    const intervalId = setInterval(() => {
      if (!isProcessed && !error && pollCount < maxPolls) {
        pollStatus()
      }
    }, 3000)

    // Initial check
    pollStatus()

    return () => clearInterval(intervalId)
  }, [documentId, initiallyProcessed, isProcessed, error])

  return { isProcessed, error, tokenCount }
}
