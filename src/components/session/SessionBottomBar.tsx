'use client'

import { Loader2 } from 'lucide-react'
import { AudioLevelMeter } from './AudioLevelMeter'
import { SessionState } from '@/store/sessionStore'

interface SessionBottomBarProps {
  audioLevel: number
  isRecording: boolean
  isPaused: boolean
  status: SessionState['status']
  onTogglePause: () => void
}

export function SessionBottomBar({
  audioLevel,
  isRecording,
  isPaused,
  status,
  onTogglePause
}: SessionBottomBarProps) {
  
  const renderStatusText = () => {
    switch (status) {
      case 'joining':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Connecting...</span>
          </>
        )
      case 'active':
        if (isPaused) {
          return (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span className="text-sm font-medium text-amber-600 dark:text-amber-500">Paused</span>
            </>
          )
        }
        return (
          <>
            <span className="h-2 w-2 rounded-full bg-green-500 status-pulse"></span>
            <span className="text-sm font-medium text-green-600 dark:text-green-500">Recording</span>
          </>
        )
      case 'paused':
        return (
          <>
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span className="text-sm font-medium text-amber-600 dark:text-amber-500">Paused</span>
          </>
        )
      case 'ending':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Ending session...</span>
          </>
        )
      case 'ended':
        return (
          <>
            <span className="h-2 w-2 rounded-full bg-muted-foreground"></span>
            <span className="text-sm font-medium text-muted-foreground">Session ended</span>
          </>
        )
      default:
        return (
          <>
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span className="text-sm font-medium text-red-600 dark:text-red-500">Connection error</span>
          </>
        )
    }
  }

  return (
    <div className="h-12 border-t bg-background flex items-center justify-between px-4 gap-4 shrink-0">
      {/* LEFT */}
      <div className="w-[120px]">
        <AudioLevelMeter level={audioLevel} isActive={isRecording && !isPaused} />
      </div>

      {/* CENTER */}
      <div className="flex items-center gap-2 flex-1 justify-center">
        {renderStatusText()}
      </div>

      {/* RIGHT */}
      <div className="w-[120px] hidden md:flex justify-end text-xs text-muted-foreground whitespace-nowrap opacity-60">
        Space to pause &middot; ⌘S to stop
      </div>
    </div>
  )
}
