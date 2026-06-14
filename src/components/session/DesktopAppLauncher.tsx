'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Monitor, HelpCircle } from 'lucide-react'

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
    <div className="hidden md:flex items-center gap-1.5 pointer-events-auto relative">
      <button 
        onClick={handleOpenDesktop}
        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all border border-white/10 shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
      >
        <Monitor className="h-3.5 w-3.5 mr-1.5" />
        Open in Desktop App
      </button>

      <button
        onClick={() => setShowFallback(!showFallback)}
        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        title="Trouble opening? Click for manual options"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {showFallback && (
        <div className="absolute top-10 right-0 w-80 bg-zinc-900 border border-border/80 rounded-xl p-4 shadow-2xl z-50 pointer-events-auto animate-fade-in text-left">
          <h3 className="text-zinc-200 font-semibold mb-1 text-sm">
            Desktop App Connection
          </h3>
          <p className="text-zinc-400 text-xs mb-3 leading-relaxed">
            If the desktop application did not launch automatically, you can try initiating the connection again or copy your credentials manually.
          </p>
          <div className="flex gap-2 mb-3">
            <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-white/5 cursor-pointer" onClick={() => {
              const enc = encodeURIComponent
              window.open(
                `interviewai://auth?token=${enc(fallbackToken)}&sessionId=${enc(fallbackSessionId)}`,
                '_self'
              )
            }}>
              Launch Manually ↗
            </button>
            <button className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer" onClick={() => setShowFallback(false)}>
              Dismiss
            </button>
          </div>
          <p className="text-zinc-500 text-[10px]">
            Or open the desktop app tray icon → select "Paste Auth Token"
          </p>
        </div>
      )}
    </div>
  )
}
