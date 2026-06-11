'use client'

import { useEffect } from 'react'
import { ChevronLeft, PauseCircle, PlayCircle, StopCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SessionState } from '@/store/sessionStore'

interface SessionTopBarProps {
  sessionId: string
  model: string
  language: string
  status: SessionState['status']
  timer: { formatted: string; seconds: number }
  creditBalance: number
  isUnlimited: boolean
  onPause: () => void
  onResume: () => void
  onStop: () => void
  isPaused: boolean
  isConnected: boolean
  onBack: () => void
}

const MODEL_NAMES: Record<string, { name: string; color: string }> = {
  'meta/llama-3.1-70b-instruct': { name: 'Llama 3.1 70B', color: 'bg-green-500/10 text-green-500' },
  'mistralai/mistral-large': { name: 'Mistral Large', color: 'bg-blue-500/10 text-blue-500' },
  'abacusai/dracarys-llama-3.1-70b-instruct': { name: 'Dracarys 70B', color: 'bg-purple-500/10 text-purple-500' },
}

const LANGUAGE_MAP: Record<string, { flag: string; name: string }> = {
  'en': { flag: '🇺🇸', name: 'English' },
  'hi': { flag: '🇮🇳', name: 'Hindi' },
  'es': { flag: '🇪🇸', name: 'Spanish' },
  'fr': { flag: '🇫🇷', name: 'French' },
}

export function SessionTopBar({
  sessionId,
  model,
  language,
  status,
  timer,
  creditBalance,
  isUnlimited,
  onPause,
  onResume,
  onStop,
  isPaused,
  isConnected,
  onBack
}: SessionTopBarProps) {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.code === 'Space') {
        e.preventDefault()
        if (status === 'active') {
          if (isPaused) onResume()
          else onPause()
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (status === 'active' || status === 'paused') {
          onStop()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [status, isPaused, onPause, onResume, onStop])

  const modelInfo = MODEL_NAMES[model] || { name: model, color: 'bg-primary/10 text-primary' }
  const langInfo = LANGUAGE_MAP[language] || { flag: '🌐', name: language.toUpperCase() }

  return (
    <div className="h-14 border-b bg-background flex items-center justify-between px-4 gap-3 shrink-0 relative">
      {/* LEFT GROUP */}
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <span className={`font-mono text-lg font-bold ${
            !isConnected ? 'text-red-500' :
            isPaused ? 'text-amber-500' : 
            'text-green-500'
          }`}>
            {timer.formatted}
          </span>
          <span className="relative flex h-3 w-3">
            {isConnected && !isPaused && status === 'active' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              !isConnected && status !== 'ended' ? 'bg-red-500 animate-pulse' :
              isPaused ? 'bg-amber-500' :
              status === 'active' ? 'bg-green-500' : 'bg-muted'
            }`}></span>
          </span>
        </div>
      </div>

      {/* CENTER GROUP */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
        <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${modelInfo.color}`}>
          {modelInfo.name}
        </div>
        <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground flex items-center gap-1.5">
          <span>{langInfo.flag}</span>
          <span>{langInfo.name}</span>
        </div>
      </div>

      {/* RIGHT GROUP */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        <div className="hidden sm:block">
          {isUnlimited ? (
            <div className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-500">
              ∞ Unlimited
            </div>
          ) : creditBalance === 0 ? (
            <div className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-500">
              No credits
            </div>
          ) : creditBalance <= 2 ? (
            <div className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-500 animate-pulse">
              {creditBalance} cr
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-500">
              {creditBalance} cr
            </div>
          )}
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-9 w-9 ${isPaused ? 'text-amber-500' : ''}`}
                disabled={status !== 'active' && status !== 'paused'}
                onClick={isPaused ? onResume : onPause}
              >
                {isPaused ? <PlayCircle className="h-5 w-5" /> : <PauseCircle className="h-5 w-5" />}
              </Button>
            } />
            <TooltipContent>
              <p>{isPaused ? 'Resume (Space)' : 'Pause (Space)'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                disabled={status !== 'active' && status !== 'paused'}
                onClick={onStop}
              >
                <StopCircle className="h-5 w-5" />
              </Button>
            } />
            <TooltipContent>
              <p>End session (⌘S)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
