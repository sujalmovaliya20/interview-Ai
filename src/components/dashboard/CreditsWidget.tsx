'use client'

import { useCredits } from '@/hooks/useCredits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Coins, Loader2 } from 'lucide-react'

export function CreditsWidget() {
  const { credits, loading } = useCredits()

  if (loading) {
    return (
      <div className="rounded-xl border bg-card text-card-foreground shadow p-4 mb-4 animate-pulse">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <div className="h-4 w-20 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  const isLow = credits < 2

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-4 mb-4">
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm font-medium text-muted-foreground flex items-center">
          <Coins className="h-4 w-4 mr-1 text-primary" /> Credits
        </div>
        {isLow && <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600">Low</Badge>}
      </div>
      <div className="text-3xl font-bold mb-4">{credits}</div>
      <Button nativeButton={false} size="sm" variant="outline" className="w-full" render={<Link href="#pricing" />}>Add credits</Button>
    </div>
  )
}
