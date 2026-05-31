'use client'

import { useCredits } from '@/hooks/useCredits'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export function CreditsWidget() {
  const { balance, isUnlimited, isLoading } = useCredits()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  const progressValue = Math.min((balance / 10) * 100, 100)
  
  let progressColor = '[&>div]:bg-green-500'
  if (balance < 2) progressColor = '[&>div]:bg-red-500'
  else if (balance <= 4) progressColor = '[&>div]:bg-amber-500'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Credits</span>
        {isUnlimited ? (
          <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 shadow-none">
            Unlimited plan
          </Badge>
        ) : (
          <Badge variant="outline">{balance.toFixed(1)}</Badge>
        )}
      </div>

      {!isUnlimited && (
        <Progress value={progressValue} className={`h-2 ${progressColor}`} />
      )}

      <Button nativeButton={false} variant="outline" size="sm" className="w-full" render={<Link href="/pricing" className="block w-full" />}>
        Add credits
      </Button>
    </div>
  )
}
