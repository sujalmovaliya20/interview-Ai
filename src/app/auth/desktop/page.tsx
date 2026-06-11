'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Sparkles, Loader2, CheckCircle } from 'lucide-react'

export default function DesktopAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function handleDesktopLogin() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          throw new Error('No session found')
        }

        // We have the session, let's redirect to the desktop app!
        const deepLink = `interviewai://auth-success?access_token=${session.access_token}&refresh_token=${session.refresh_token}`
        
        setStatus('success')
        
        // Slight delay for UX
        setTimeout(() => {
          window.location.href = deepLink
        }, 1500)

      } catch (err) {
        console.error(err)
        setStatus('error')
      }
    }

    handleDesktopLogin()
  }, [supabase])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/20">
      <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-xl border border-primary/10 text-center">
        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
          {status === 'loading' && <Loader2 className="h-8 w-8 text-primary animate-spin" />}
          {status === 'success' && <CheckCircle className="h-8 w-8 text-green-500" />}
          {status === 'error' && <Sparkles className="h-8 w-8 text-red-500" />}
        </div>
        
        <h1 className="text-2xl font-bold mb-2">
          {status === 'loading' && 'Authenticating...'}
          {status === 'success' && 'Authentication Successful!'}
          {status === 'error' && 'Authentication Failed'}
        </h1>
        
        <p className="text-muted-foreground mb-8">
          {status === 'loading' && 'Please wait while we secure your connection.'}
          {status === 'success' && "You will now be redirected to the desktop app. If you're not redirected automatically, please click the button below:"}
          {status === 'error' && 'We could not authenticate your session. Please try logging in again.'}
        </p>

        {status === 'success' && (
          <button 
            onClick={() => {
              supabase.auth.getSession().then(({ data }) => {
                if (data.session) {
                  window.location.href = `interviewai://auth-success?access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}`
                }
              })
            }}
            className="w-full bg-primary text-primary-foreground font-medium h-12 rounded-xl"
          >
            Open Desktop App
          </button>
        )}
      </div>
    </div>
  )
}
