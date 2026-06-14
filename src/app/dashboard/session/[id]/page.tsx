import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { LiveSessionView } from '@/components/session/LiveSessionView'

export default async function LiveSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: session } = await (supabase as any)
    .from('sessions')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    notFound()
  }

  const { data: { session: authSession } } = await supabase.auth.getSession()
  
  if (!authSession?.access_token) {
    redirect('/auth/signin')
  }

  return (
    <div className="flex flex-col h-full">
      <LiveSessionView 
        sessionId={session.id} 
        initialSession={session} 
        accessToken={authSession.access_token} 
      />
    </div>
  )
}
