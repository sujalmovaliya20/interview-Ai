'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function DesktopAppLauncher({ sessionId }: { sessionId: string }) {
  const [showFallback, setShowFallback] = useState(false)
  const [fallbackToken, setFallbackToken] = useState('')
  const [fallbackSessionId, setFallbackSessionId] = useState('')

  const handleOpenDesktop = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Not authenticated — please sign in first')
        return
      }

      const encodedToken = encodeURIComponent(session.access_token)
      const encodedSessionId = encodeURIComponent(sessionId)
      const deepLink = `interviewai://auth?token=${encodedToken}&sessionId=${encodedSessionId}`

      // Open deep link
      window.open(deepLink, '_self')

      toast.success('Opening desktop app...')
      // Do NOT auto-show fallback — user asks for it if needed

      setFallbackToken(session.access_token)
      setFallbackSessionId(sessionId)

    } catch (err) {
      console.error('[Desktop] Deep link error:', err)
      toast.error('Could not open desktop app')
    }
  }

  return (
    <>
      <button 
        onClick={handleOpenDesktop}
        className="pointer-events-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors border border-white/10 shadow-lg"
      >
        Open in Desktop App ↗
      </button>

      <button
        onClick={() => setShowFallback(!showFallback)}
        className="text-xs text-muted-foreground underline mt-1 cursor-pointer"
      >
        Desktop app not opening?
      </button>

      {showFallback && (
        <div className="absolute top-16 right-4 w-96 bg-zinc-900 border border-red-500/50 rounded-lg p-4 shadow-2xl pointer-events-auto">
          <h3 className="text-red-400 font-semibold mb-2">
            Manual options
          </h3>
          <div className="flex gap-2 mb-4">
            <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded text-sm transition-colors" onClick={() => {
              const enc = encodeURIComponent
              window.open(
                `interviewai://auth?token=${enc(fallbackToken)}&sessionId=${enc(fallbackSessionId)}`,
                '_self'
              )
            }}>
              Try Again ↗
            </button>
            <button className="px-3 py-2 rounded text-sm text-zinc-400 hover:text-white transition-colors" onClick={() => setShowFallback(false)}>
              Dismiss
            </button>
          </div>
          <p className="text-zinc-500 text-xs">
            Or open the desktop app tray icon → "Paste auth token"
          </p>
        </div>
      )}
    </>
  )
}
