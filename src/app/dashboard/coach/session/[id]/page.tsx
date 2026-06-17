import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CoachSessionClient } from './CoachSessionClient'

interface Params {
  params: Promise<{ id: string }>
}

export default async function CoachSessionPage({ params }: Params) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: session } = await (supabase as any)
    .from('coach_sessions')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    notFound()
  }

  return (
    <div className="p-6 lg:p-8 w-full max-w-4xl mx-auto min-h-screen flex flex-col">
      <CoachSessionClient 
        sessionId={session.id} 
        initialSession={session} 
      />
    </div>
  )
}
