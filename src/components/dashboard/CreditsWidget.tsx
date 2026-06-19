'use client'

import { useCredits } from '@/hooks/useCredits'
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits</span>
        {isUnlimited ? (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/15">
            Unlimited
          </span>
        ) : (
          <span className="text-sm font-bold text-foreground tabular-nums">{balance.toFixed(1)}</span>
        )}
      </div>

      {!isUnlimited && (
        <Progress 
          value={progressValue} 
          className={`h-1.5 bg-muted rounded-full ${
            balance < 2 
              ? '[&>div]:bg-red-500' 
              : balance <= 4 
              ? '[&>div]:bg-amber-500' 
              : '[&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-indigo-500'
          } [&>div]:rounded-full`} 
        />
      )}

      <Button 
        nativeButton={false} 
        variant="outline" 
        size="sm" 
        className="w-full border-border bg-transparent text-muted-foreground hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-300 hover:border-violet-500/25 rounded-lg text-xs transition-all" 
        render={<Link href="/dashboard" className="block w-full" />}
      >
        Add credits
      </Button>
    </div>
  )
}
