import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { SessionsTable } from '@/components/dashboard/SessionsTable'
import { Video, Zap, Clock, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Session, Credits } from '@/types'
import { OnboardingTour } from '@/components/dashboard/OnboardingTour'

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
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Dashboard</h1>
        <p className="text-sm text-zinc-500">Your interview preparation overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

      {/* Recent Sessions / Empty State */}
      {totalSessions === 0 ? (
        <div className="glass-card p-10 flex flex-col items-center justify-center text-center space-y-5">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-violet-500/15 to-indigo-500/15 border border-violet-500/20 flex items-center justify-center shadow-lg shadow-violet-500/5">
            <Sparkles className="h-8 w-8 text-violet-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold gradient-text">Ready for your next interview?</h2>
            <p className="text-zinc-400 max-w-md text-sm leading-relaxed">
              Start an AI-powered interview session right now and practice with realistic questions and instant feedback.
            </p>
          </div>
          <Button 
            nativeButton={false} 
            size="lg" 
            render={<Link href="/dashboard/session/new" />}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/10 hover:shadow-lg hover:shadow-violet-500/20 transition-all rounded-xl font-semibold"
          >
            Start new session
          </Button>
        </div>
      ) : (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-100">Recent sessions</h2>
            <Link href="/dashboard/sessions" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors flex items-center gap-1 group">
              View all sessions <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <SessionsTable sessions={(recentSessions as Session[]) || []} />
        </div>
      )}

      {/* Onboarding Tour */}
      <OnboardingTour />
    </div>
  )
}
