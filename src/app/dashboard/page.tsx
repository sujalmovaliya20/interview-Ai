import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { SessionsTable } from '@/components/dashboard/SessionsTable'
import { Video, Zap, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Session, Credits } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const [
    creditsRes,
    sessionsCountRes,
    recentSessionsRes,
    completedSessionsRes
  ] = await Promise.all([
    supabase.from('credits').select('balance, is_unlimited').eq('user_id', user.id).single(),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('sessions').select('duration_seconds').eq('user_id', user.id).eq('status', 'completed')
  ])

  const creditsData = creditsRes.data as unknown as Pick<Credits, 'balance' | 'is_unlimited'>
  const sessionsCount = sessionsCountRes.count
  const recentSessions = recentSessionsRes.data as unknown as Session[]
  const completedSessions = completedSessionsRes.data as unknown as Pick<Session, 'duration_seconds'>[]

  const totalSessions = sessionsCount || 0
  const creditsValue = creditsData?.is_unlimited ? '∞' : (creditsData?.balance || 0).toFixed(1)
  
  let avgDuration = 0
  if (completedSessions && completedSessions.length > 0) {
    const totalDuration = completedSessions.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)
    avgDuration = Math.round(totalDuration / completedSessions.length)
  }
  const avgM = Math.floor(avgDuration / 60)
  const avgS = avgDuration % 60
  const formattedAvg = avgDuration > 0 ? `${avgM}m ${avgS}s` : '—'

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Sessions"
          value={totalSessions}
          icon={Video}
          trend={{ value: 12, label: 'vs last month' }}
        />
        <StatsCard
          title="Credits"
          value={creditsValue}
          icon={Zap}
        />
        <StatsCard
          title="Avg Duration"
          value={formattedAvg}
          icon={Clock}
        />
      </div>

      {totalSessions === 0 ? (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready for your next interview?</h2>
          <p className="text-muted-foreground max-w-md">
            Start an AI-powered interview session right now and practice with realistic questions and instant feedback.
          </p>
          <Button nativeButton={false} size="lg" render={<Link href="/dashboard/session/new" />}>
            Start new session
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent sessions</h2>
            <Link href="/dashboard/sessions" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              View all sessions <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <SessionsTable sessions={(recentSessions as Session[]) || []} />
        </div>
      )}
    </div>
  )
}
