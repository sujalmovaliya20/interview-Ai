import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Profile } from '@/types'
import { DashboardLayoutWrapper } from './DashboardLayoutWrapper'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch profile to verify it exists if needed, but for now we just use the auth user
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = data as unknown as Profile

  const safeUser = {
    id: user.id,
    email: profile?.email || user.email || 'user@example.com',
    full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null,
    avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null
  }

  return (
    <DashboardLayoutWrapper 
      sidebar={<Sidebar user={safeUser} />} 
      header={<Header title="Dashboard" user={safeUser} />}
    >
      {children}
    </DashboardLayoutWrapper>
  )
}
