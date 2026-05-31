import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Profile } from '@/types'

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
    email: profile?.email || user.email || 'user@example.com'
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={safeUser} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Dashboard" user={safeUser} />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  )
}
