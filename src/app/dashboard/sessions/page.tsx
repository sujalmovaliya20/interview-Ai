import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SessionsClient } from '@/components/dashboard/SessionsClient'
import { Session } from '@/types'

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const typedSessions = (sessions as Session[]) || []

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Sessions</h1>
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/15">
          {typedSessions.length} total
        </span>
      </div>

      <SessionsClient sessions={typedSessions} />
    </div>
  )
}
