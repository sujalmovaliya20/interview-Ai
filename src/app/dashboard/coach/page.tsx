import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CoachDashboardClient } from './CoachDashboardClient'

export default async function CoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const transcriptionUrl = process.env.NEXT_PUBLIC_TRANSCRIPTION_URL || 'http://localhost:8000'
  let historyData = {
    sessions: [],
    top_weaknesses: [],
    total_sessions: 0,
    avg_score: 0.0
  }

  try {
    const res = await fetch(`${transcriptionUrl}/coach/user/${user.id}/history`, {
      cache: 'no-store'
    })
    if (res.ok) {
      historyData = await res.json()
    }
  } catch (err) {
    console.error('Failed to fetch coach history:', err)
  }

  return (
    <div className="p-6 lg:p-8 w-full max-w-5xl mx-auto space-y-8">
      <CoachDashboardClient initialHistory={historyData} userId={user.id} />
    </div>
  )
}
