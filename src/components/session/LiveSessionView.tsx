'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/sessionStore'
import { useTimer } from '@/hooks/useTimer'
import { useSessionControls } from '@/hooks/useSessionControls'
import { createSocket } from '@/lib/socket'

import { SessionTopBar } from './SessionTopBar'
import { SessionBottomBar } from './SessionBottomBar'
import { ConnectionBanner } from './ConnectionBanner'
import { SessionSummaryDialog } from './SessionSummaryDialog'
import { TranscriptPanel } from './TranscriptPanel'
import { AnswerPanel } from './AnswerPanel'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { createBrowserClient } from '@supabase/ssr'

export function LiveSessionView({ sessionId, initialSession, accessToken }: { sessionId: string; initialSession: any; accessToken: string }) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Initialize store
  const resetSession = useSessionStore(state => state.resetSession)
  const setModel = useSessionStore(state => state.setModel)
  const setLanguage = useSessionStore(state => state.setLanguage)
  const setStatus = useSessionStore(state => state.setStatus)
  const appendTranscriptDelta = useSessionStore(state => state.appendTranscriptDelta)
  const appendAnswerDelta = useSessionStore(state => state.appendAnswerDelta)
  const setCreditBalance = useSessionStore(state => state.setCreditBalance)

  useEffect(() => {
    resetSession()
    setModel(initialSession.model)
    setLanguage(initialSession.language)
    setStatus(['completed', 'expired'].includes(initialSession.status) ? 'ended' : initialSession.status)
    return () => resetSession()
  }, [initialSession, resetSession, setModel, setLanguage, setStatus])

  // Timer
  const { seconds, formatted, start: startTimer, pause: pauseTimer, resume: resumeTimer } = useTimer()

  // Controls & state
  const controls = useSessionControls({ sessionId, accessToken })
  const {
    status, isRecording, isPaused, audioLevel, isConnected,
    transcriptBlocks, answerBlocks, creditBalance, isUnlimited,
    stopDialogOpen, setStopDialogOpen, summaryOpen,
    handlePause, handleResume, handleStop, confirmStop, handleSummaryClose,
    startAudio, audioError
  } = controls

  const [hasStarted, setHasStarted] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [prepProgress, setPrepProgress] = useState(0)
  const [prepStep, setPrepStep] = useState(0)
  const [retryCount, setRetryCount] = useState(0)

  // Mobile draggable panels state
  const [splitRatio, setSplitRatio] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleTouchStart = () => setIsDragging(true)
  const handleMouseDown = () => setIsDragging(true)

  const handleDrag = useCallback((clientY: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const relativeY = clientY - rect.top
    const percentage = (relativeY / rect.height) * 100
    // Clamp height percentage between 15% and 80%
    const clamped = Math.max(15, Math.min(80, percentage))
    setSplitRatio(clamped)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      handleDrag(e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleDrag(e.touches[0].clientY)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, handleDrag])

  // Credit Deduction Interval (0.5 every 30 mins)
  useEffect(() => {
    if (status !== 'active' || isPaused || isUnlimited) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/sessions/deduct-credit', {
          method: 'POST',
        })
        const data = await res.json()

        if (res.status === 402) {
          toast.error("You have run out of credits. Ending session.")
          confirmStop()
          return
        }

        if (res.ok && data.balance !== undefined) {
          setCreditBalance(data.balance)
        }
      } catch (e) {
        console.error("Failed to deduct credit", e)
      }
    }, 30 * 60 * 1000) // 30 minutes

    return () => clearInterval(interval)
  }, [status, isPaused, isUnlimited, confirmStop, setCreditBalance])

  // Initial fetch of credits
  useEffect(() => {
    async function loadCredits() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('credits').select('balance').eq('user_id', user.id).single()
      if (data) setCreditBalance(data.balance)
    }
    loadCredits()
  }, [supabase, setCreditBalance])

  const startPreparation = () => {
    setIsPreparing(true)
    setPrepProgress(0)
    setPrepStep(0)

    const duration = 20000 // 10 seconds
    const intervalTime = 50
    const steps = duration / intervalTime // 200 steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const progress = Math.min(100, Math.round((currentStep / steps) * 100))
      setPrepProgress(progress)

      // Update steps based on progress thresholds
      if (progress < 25) {
        setPrepStep(0) // Initializing AI Speech Engine
      } else if (progress < 55) {
        setPrepStep(1) // Calibrating Microphone
      } else if (progress < 80) {
        setPrepStep(2) // Optimizing Acoustic Model
      } else {
        setPrepStep(3) // Finalizing Connection
      }

      if (currentStep >= steps) {
        clearInterval(timer)
        setHasStarted(true)
        setIsPreparing(false)
        startTimer()
      }
    }, intervalTime)
  }

  const handleStartSession = async () => {
    if (isConnected && status === 'active' && !audioError) {
      const success = await startAudio()
      if (success) {
        startPreparation()
      } else {
        toast.error('Cannot start: Microphone is either in use by another app (e.g. Zoom) or unavailable.')
      }
    } else if (audioError) {
      if (audioError === 'MICROPHONE_IN_USE') {
        toast.error('Cannot start: Microphone is currently in use by another application.')
      } else {
        toast.error('Cannot start: Microphone access denied or not found.')
      }
    } else {
      toast.error('Cannot start: Connecting to server...')
    }
  }

  // Socket Listeners
  useEffect(() => {
    const socket = createSocket(accessToken)

    const onTranscript = (payload: any) => appendTranscriptDelta(payload)
    const onAnswer = (payload: any) => appendAnswerDelta(payload)
    const onAnswerDone = (payload: any) => useSessionStore.getState().finalizeAnswer(payload.id)

    // We get disconnects, reconnects etc
    const onDisconnect = () => {
      setRetryCount(r => r + 1)
      if (status === 'active') setStatus('reconnecting')
    }
    const onReconnect = () => {
      setRetryCount(0)
      if (status === 'reconnecting') setStatus('active')
    }

    socket.on('transcript_delta', onTranscript)
    socket.on('answer_delta', onAnswer)
    socket.on('answer_done', onAnswerDone)
    socket.on('disconnect', onDisconnect)
    socket.on('connect', onReconnect)

    return () => {
      socket.off('transcript_delta', onTranscript)
      socket.off('answer_delta', onAnswer)
      socket.off('answer_done', onAnswerDone)
      socket.off('disconnect', onDisconnect)
      socket.off('connect', onReconnect)
    }
  }, [accessToken, appendTranscriptDelta, appendAnswerDelta, setStatus, status])

  const questionsAnswered = transcriptBlocks.filter(b => b.isQuestion).length

  const handleTogglePause = () => {
    if (isPaused) {
      handleResume()
      resumeTimer()
    } else {
      handlePause()
      pauseTimer()
    }
  }

  const handleStopWithTimer = () => {
    pauseTimer()
    confirmStop()
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background overflow-hidden relative">
      <ConnectionBanner
        status={status}
        retryCount={retryCount}
        onRetry={() => window.location.reload()}
      />

      {/* OVERLAY for starting */}
      {!hasStarted && status !== 'ended' && status !== 'error' && (
        <div className="absolute inset-0 z-40 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-500">
          {isPreparing ? (
            /* AI Calibration Loader */
            <div className="text-center max-w-md p-6 flex flex-col items-center animate-fade-in">
              {/* Circular Progress Indicator with Siri Sound Wave */}
              <div className="relative flex items-center justify-center h-44 w-44 mb-8">
                {/* SVG Progress Circle */}
                <svg className="w-40 h-40 transform -rotate-90 absolute">
                  <circle cx="80" cy="80" r="72" stroke="currentColor" className="text-muted/15" strokeWidth="4" fill="transparent" />
                  <circle cx="80" cy="80" r="72" stroke="currentColor" className="text-primary transition-all duration-75" strokeWidth="4" fill="transparent"
                    strokeDasharray={2 * Math.PI * 72}
                    strokeDashoffset={2 * Math.PI * 72 * (1 - prepProgress / 100)}
                    strokeLinecap="round" />
                </svg>
                {/* Center Siri-style Sound Wave */}
                <div className="relative flex items-center justify-center h-28 w-28 rounded-full bg-card border border-border/40 shadow-inner backdrop-blur-sm z-10">
                  <div className="flex items-center justify-center gap-1.5 h-12">
                    <div className="w-1 bg-primary/85 rounded-full animate-wave" style={{ animationDelay: '0.1s', minHeight: '12px' }} />
                    <div className="w-1 bg-primary/95 rounded-full animate-wave" style={{ animationDelay: '0.4s', minHeight: '12px' }} />
                    <div className="w-1 bg-primary/90 rounded-full animate-wave" style={{ animationDelay: '0.2s', minHeight: '12px' }} />
                    <div className="w-1 bg-primary/95 rounded-full animate-wave" style={{ animationDelay: '0.6s', minHeight: '12px' }} />
                    <div className="w-1 bg-primary/85 rounded-full animate-wave" style={{ animationDelay: '0.3s', minHeight: '12px' }} />
                  </div>
                </div>
                {/* Floating percentage label */}
                <div className="absolute -bottom-2 bg-primary text-primary-foreground font-mono text-xs px-2.5 py-1 rounded-full shadow-md z-20">
                  {prepProgress}%
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-3 tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Calibrating Interview Room
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-6">
                Please wait while we initialize your AI coach and test acoustic levels.
              </p>

              {/* Progress Checklist */}
              <div className="w-full max-w-sm space-y-3 p-5 rounded-2xl bg-card/60 border border-border/80 shadow-sm text-left">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Calibration Checklist:</h3>

                <div className="flex items-center gap-3 text-sm">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center border text-xs font-semibold transition-all duration-300 ${prepStep > 0 ? 'border-primary bg-primary text-primary-foreground' : prepStep === 0 ? 'border-primary bg-primary/10 text-primary animate-pulse' : 'border-muted text-muted'}`}>
                    {prepStep > 0 ? '✓' : '1'}
                  </div>
                  <span className={prepStep === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}>Initializing AI Speech Brain</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center border text-xs font-semibold transition-all duration-300 ${prepStep > 1 ? 'border-primary bg-primary text-primary-foreground' : prepStep === 1 ? 'border-primary bg-primary/10 text-primary animate-pulse' : 'border-muted text-muted'}`}>
                    {prepStep > 1 ? '✓' : '2'}
                  </div>
                  <span className={prepStep === 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}>Calibrating Microphone Levels</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center border text-xs font-semibold transition-all duration-300 ${prepStep > 2 ? 'border-primary bg-primary text-primary-foreground' : prepStep === 2 ? 'border-primary bg-primary/10 text-primary animate-pulse' : 'border-muted text-muted'}`}>
                    {prepStep > 2 ? '✓' : '3'}
                  </div>
                  <span className={prepStep === 2 ? 'font-medium text-foreground' : 'text-muted-foreground'}>Optimizing Acoustic Model</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center border text-xs font-semibold transition-all duration-300 ${prepProgress === 100 ? 'border-primary bg-primary text-primary-foreground' : prepStep === 3 ? 'border-primary bg-primary/10 text-primary animate-pulse' : 'border-muted text-muted'}`}>
                    {prepProgress === 100 ? '✓' : '4'}
                  </div>
                  <span className={prepStep === 3 ? 'font-medium text-foreground' : 'text-muted-foreground'}>Finalizing Stream Connection</span>
                </div>
              </div>
            </div>
          ) : !isConnected ? (
            /* Server Connection Loader */
            <div className="text-center max-w-md p-6 flex flex-col items-center animate-fade-in">
              {/* Connection Loader Icon */}
              <div className="relative flex items-center justify-center h-36 w-36 mb-8">
                {/* Sonar Pulsing Rings */}
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-sonar" style={{ animationDelay: '0s' }} />
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-sonar" style={{ animationDelay: '1s' }} />
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-sonar" style={{ animationDelay: '2s' }} />

                {/* Center Glass Sphere */}
                <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 border border-primary/20 shadow-2xl shadow-primary/20 backdrop-blur-md">
                  <div className="relative flex items-center justify-center h-10 w-10">
                    {/* Spinning loader */}
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                    <Play className="h-5 w-5 text-primary/40 animate-pulse" />
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-3 tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Connecting to Server
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-6">
                Establishing a secure real-time audio connection for your interview.
              </p>

              {/* Server Wakeup Info */}
              <div className="px-4 py-3 rounded-2xl bg-card/60 border border-border/80 shadow-sm max-w-sm flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <p className="text-xs text-muted-foreground text-left">
                  <span className="font-semibold text-foreground">First-time load?</span> The server takes up to 45 seconds to wake up from standby. Please stay on this screen.
                </p>
              </div>
            </div>
          ) : (
            /* Ready/Start Screen */
            <div className="text-center max-w-md p-6 flex flex-col items-center animate-scale-in">
              <h2 className="text-2xl font-bold mb-2">Ready when you are</h2>
              <p className="text-muted-foreground mb-8 text-sm">
                Ensure your microphone is connected and you're in a quiet environment.
              </p>
              <Button size="lg" onClick={handleStartSession} className="text-lg px-8 py-6 rounded-full shadow-lg shadow-primary/25 hover:scale-105 transition-transform w-full cursor-pointer">
                <Play className="mr-2 h-5 w-5" /> Start Interview
              </Button>
            </div>
          )}
        </div>
      )}

      {/* APP LAYOUT */}
      <SessionTopBar
        sessionId={sessionId}
        model={initialSession.model}
        language={initialSession.language}
        status={status}
        timer={{ formatted, seconds }}
        creditBalance={creditBalance}
        isUnlimited={isUnlimited}
        onPause={() => { handlePause(); pauseTimer(); }}
        onResume={() => { handleResume(); resumeTimer(); }}
        onStop={handleStop}
        isPaused={isPaused}
        isConnected={isConnected}
        onBack={() => router.push('/dashboard')}
      />

      <div
        ref={containerRef}
        className={`flex-1 flex flex-col md:flex-row overflow-hidden relative ${isDragging ? 'select-none' : ''}`}
      >
        <div
          className="w-full md:w-[40%] border-r bg-card/50 flex flex-col overflow-hidden"
          style={isMobile ? { height: `${splitRatio}%` } : undefined}
        >
          <TranscriptPanel transcriptBlocks={transcriptBlocks} status={status} />
        </div>

        {/* Draggable Divider Handle for Mobile */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="md:hidden h-3 bg-border hover:bg-primary/20 active:bg-primary/40 cursor-ns-resize flex items-center justify-center touch-none select-none z-10 transition-colors py-0.5"
        >
          <div className="w-12 h-1 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors" />
        </div>

        <div
          className="w-full md:w-[60%] bg-card flex flex-col overflow-hidden"
          style={isMobile ? { height: `${100 - splitRatio}%` } : undefined}
        >
          <AnswerPanel
            answerBlocks={answerBlocks}
            status={status}
            onClearAnswers={() => useSessionStore.setState({ answerBlocks: [] })}
          />
        </div>
      </div>

      <SessionBottomBar
        audioLevel={audioLevel}
        isRecording={isRecording}
        isPaused={isPaused}
        status={status}
        onTogglePause={handleTogglePause}
      />

      {/* MODALS */}
      <AlertDialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End interview session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this interview? The session transcript will be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStopWithTimer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SessionSummaryDialog
        open={summaryOpen}
        sessionId={sessionId}
        duration={seconds}
        questionsAnswered={questionsAnswered}
        model={initialSession.model}
        transcriptBlocks={transcriptBlocks}
        answerBlocks={answerBlocks}
        onClose={handleSummaryClose}
        onGoToDashboard={handleSummaryClose}
      />
    </div>
  )
}
