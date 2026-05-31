'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/sessionStore'
import { useSocket } from '@/hooks/useSocket'
import { createSocket } from '@/lib/socket'
import { useAudioCapture } from '@/hooks/useAudioCapture'
import { useTimer } from '@/hooks/useTimer'
import { useCredits } from '@/hooks/useCredits'
import { TranscriptDisplay } from './TranscriptDisplay'
import { AnswerPanel } from './AnswerPanel'
import { AudioLevelMeter } from './AudioLevelMeter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Play, Pause, Square, AlertCircle, Coins, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export function LiveSessionView({ sessionId, initialSession, accessToken }: { sessionId: string; initialSession: any; accessToken: string }) {
  const router = useRouter()
  const creditsQuery = useCredits() as any
  const balance = creditsQuery?.balance || 0

  // Zustand state & actions
  const status = useSessionStore(state => state.status)
  const setStatus = useSessionStore(state => state.setStatus)
  const setModel = useSessionStore(state => state.setModel)
  const setLanguage = useSessionStore(state => state.setLanguage)
  const resetSession = useSessionStore(state => state.resetSession)
  const appendTranscriptDelta = useSessionStore(state => state.appendTranscriptDelta)
  const appendAnswerDelta = useSessionStore(state => state.appendAnswerDelta)
  const transcriptBlocks = useSessionStore(state => state.transcriptBlocks)

  // Modals
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(0)

  // Timer
  const { seconds, formatted, start: startTimer, pause: pauseTimer, resume: resumeTimer } = useTimer()

  // Initialize store on mount
  useEffect(() => {
    resetSession()
    setModel(initialSession.model)
    setLanguage(initialSession.language)
    setStatus(initialSession.status)
    return () => resetSession()
  }, [initialSession, resetSession, setModel, setLanguage, setStatus])

  // Socket
  const { isConnected, isJoining, error: socketError, sendChunk, endSession } = useSocket({
    sessionId,
    token: accessToken,
    enabled: true
  })

  // Audio capture
  const [debugMsg, setDebugMsg] = useState('Init')
  const handleChunk = useCallback((chunk: ArrayBuffer) => {
    setDebugMsg('Got chunk: ' + chunk.byteLength)
    sendChunk(chunk)
  }, [sendChunk])

  const {
    isRecording,
    isPaused,
    audioLevel,
    error: audioError,
    start: startAudio,
    pause: pauseAudio,
    resume: resumeAudio,
    stop: stopAudio
  } = useAudioCapture({
    onChunk: handleChunk,
    enabled: status === 'active'
  })

  const [hasStarted, setHasStarted] = useState(false)

  // Start recording once socket is connected and session joined
  useEffect(() => {
    // Only connect the socket and timer initially, do NOT start audio yet.
    // Audio must be started via user interaction to bypass Autoplay policies.
  }, [])

  const handleStartSession = () => {
    if (isConnected && !isJoining && status === 'active' && !audioError) {
      setHasStarted(true)
      startAudio()
      startTimer()
    } else if (audioError) {
      toast.error('Cannot start: Microphone access denied or not found.')
    } else {
      toast.error('Cannot start: Connecting to server...')
    }
  }

  // Handle errors
  useEffect(() => {
    if (socketError) toast.error(`Connection error: ${socketError}`)
    if (audioError) toast.error(`Microphone error: ${audioError}`)
  }, [socketError, audioError])

  // Listen to socket events via window event listener (mocking direct hook bindings for simplicity in this artifact)
  // Actually, useSocket sets up listeners. To map them to store, we should modify useSocket or pass callbacks.
  // Given we created useSocket without callback props in Step 4, let's fix it by adding a listener effect here that hooks into the socket instance.
  // Wait, `socket.ts` has a singleton. We can listen directly here.
  useEffect(() => {
    const socket = createSocket(accessToken)

    const onTranscript = (payload: any) => appendTranscriptDelta(payload)
    const onAnswer = (payload: any) => appendAnswerDelta(payload)
    const onSessionEnded = (payload: any) => {
      setStatus('ended')
      setSessionDuration(payload.duration)
      setShowSummary(true)
      stopAudio()
      pauseTimer()
    }

    socket.on('transcript_delta', onTranscript)
    socket.on('answer_delta', onAnswer)
    socket.on('session_ended', onSessionEnded)

    return () => {
      socket.off('transcript_delta', onTranscript)
      socket.off('answer_delta', onAnswer)
      socket.off('session_ended', onSessionEnded)
    }
  }, [accessToken, appendTranscriptDelta, appendAnswerDelta, setStatus, stopAudio, pauseTimer])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        if (isPaused) {
          resumeAudio()
          resumeTimer()
        } else if (isRecording) {
          pauseAudio()
          pauseTimer()
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        setShowStopDialog(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        const selection = window.getSelection()
        if (!selection?.toString()) {
          // Empty selection, let's copy last answer
          // Just a visual toast for now as true copy is handled in AnswerPanel
          toast('Use the copy button on the answer block.')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPaused, isRecording, resumeAudio, resumeTimer, pauseAudio, pauseTimer])

  const handleStopConfirm = () => {
    setShowStopDialog(false)
    setStatus('ending')
    endSession() // This emits end_session and disconnects socket. The server will emit session_ended to others, but we need to handle local state too.
    stopAudio()
    pauseTimer()
    setSessionDuration(seconds)
    setShowSummary(true)
  }

  const questionCount = transcriptBlocks.filter(b => b.isQuestion).length

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen bg-background">
      {/* TOP BAR */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
        <div className="flex items-center gap-4 w-1/3">
          <div className="font-mono text-lg font-medium tabular-nums">{formatted}</div>
          {status === 'ending' && <Badge variant="destructive" className="animate-pulse">Ending...</Badge>}
          <span className="text-xs text-muted-foreground">{debugMsg}</span>
        </div>

        <div className="flex items-center justify-center gap-2 w-1/3">
          <Badge variant="outline" className="uppercase">{initialSession.model}</Badge>
          <Badge variant="secondary" className="uppercase">{initialSession.language}</Badge>
        </div>

        <div className="flex items-center justify-end gap-2 w-1/3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (isPaused) { resumeAudio(); resumeTimer(); }
                    else { pauseAudio(); pauseTimer(); }
                  }}
                  disabled={!isRecording || status === 'ending'}
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              } />
              <TooltipContent><p>Space to toggle</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setShowStopDialog(true)}
                  disabled={status === 'ending' || status === 'ended'}
                >
                  <Square className="h-4 w-4 fill-current" />
                </Button>
              } />
              <TooltipContent><p>Cmd/Ctrl+S to stop</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex gap-0 overflow-hidden relative">
        {!hasStarted && status === 'active' && (
          <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <Button size="lg" onClick={handleStartSession} className="text-lg px-8 py-6 rounded-full shadow-lg shadow-primary/25 hover:scale-105 transition-transform">
              <Play className="mr-2 h-6 w-6" /> Start Interview
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">Click to enable microphone access and begin</p>
          </div>
        )}

        <div className="w-2/5 border-r flex flex-col bg-card/50">
          <div className="p-3 border-b bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
            Transcript
          </div>
          <TranscriptDisplay />
        </div>

        <div className="w-3/5 flex flex-col bg-card">
          <div className="p-3 border-b bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0 flex justify-between items-center">
            <span>AI Answer</span>
            <span className="text-[10px] lowercase text-muted-foreground opacity-50">Cmd+C to copy</span>
          </div>
          <AnswerPanel />
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="h-12 border-t flex items-center px-4 gap-4 bg-card shrink-0">
        <div className="w-32">
          <AudioLevelMeter level={audioLevel} isRecording={isRecording} isPaused={isPaused} />
        </div>

        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-1">
          {!isConnected ? (
            <><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Connecting...</>
          ) : isPaused ? (
            <><span className="w-2 h-2 rounded-full bg-amber-500" /> Paused</>
          ) : isRecording ? (
            <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Recording...</>
          ) : (
            <><span className="w-2 h-2 rounded-full bg-muted" /> Idle</>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Coins className="h-4 w-4 text-amber-500" />
          <span>{balance} credits</span>
        </div>
      </div>

      {/* DIALOGS */}
      <AlertDialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this interview session? You've been practicing for {formatted}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStopConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showSummary} onOpenChange={(v) => { if (!v) router.push('/dashboard') }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Session Complete
            </DialogTitle>
            <DialogDescription>
              Great job! Here's a quick summary of your session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="p-4 rounded-lg bg-muted text-center">
              <div className="text-2xl font-bold mb-1 tabular-nums">{Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Duration</div>
            </div>
            <div className="p-4 rounded-lg bg-muted text-center">
              <div className="text-2xl font-bold mb-1">{questionCount}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Questions Detected</div>
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="default" className="w-full" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
