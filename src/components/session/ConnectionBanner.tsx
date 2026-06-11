'use client'

import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConnectionBannerProps {
  status: string
  retryCount: number
  onRetry: () => void
}

export function ConnectionBanner({ status, retryCount, onRetry }: ConnectionBannerProps) {
  if (status !== 'error' && status !== 'reconnecting') return null

  if (status === 'reconnecting') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 banner-slide-down shadow-md">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Reconnecting... (attempt {retryCount}/5)</span>
      </div>
    )
  }

  // error state
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-3 flex items-center justify-between banner-slide-down shadow-md">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Connection lost</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onRetry} className="h-8">
          Retry
        </Button>
        <Button variant="ghost" size="sm" onClick={() => window.location.href = '/dashboard'} className="h-8 text-white hover:bg-red-600 hover:text-white">
          End Session
        </Button>
      </div>
    </div>
  )
}
