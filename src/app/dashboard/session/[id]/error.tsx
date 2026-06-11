'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col h-screen w-full items-center justify-center bg-background p-4 text-center">
      <div className="bg-destructive/10 p-4 rounded-full mb-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        We couldn't load the interview session. Please try again or return to the dashboard.
      </p>
      <div className="flex gap-4">
        <Button variant="default" onClick={() => reset()}>
          Try again
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
