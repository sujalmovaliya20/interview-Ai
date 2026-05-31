import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'
import { Profile, Credits } from '@/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const [profileRes, creditsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('credits').select('*').eq('user_id', user.id).single()
  ])

  const profile = profileRes.data as unknown as Profile
  const credits = creditsRes.data as unknown as Credits

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      
      <SettingsClient 
        profile={profile} 
        credits={credits} 
        email={user.email || ''} 
      />
    </div>
  )
}
