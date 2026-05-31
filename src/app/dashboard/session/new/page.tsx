import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewSessionModal } from '@/components/session/NewSessionModal'

export default async function NewSessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return <NewSessionModal />
}
