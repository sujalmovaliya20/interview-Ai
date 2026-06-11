'use client'

import { useEffect, useState, useCallback } from 'react'
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
  const [retryCount, setRetryCount] = useState(0)

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

  const handleStartSession = async () => {
    if (isConnected && status === 'active' && !audioError) {
      const success = await startAudio()
      if (success) {
        setHasStarted(true)
        startTimer()
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
        <div className="absolute inset-0 z-40 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="text-center max-w-md p-6">
            <h2 className="text-2xl font-bold mb-2">Ready when you are</h2>
            <p className="text-muted-foreground mb-8 text-sm">
              Ensure your microphone is connected and you're in a quiet environment.
            </p>
            <Button size="lg" onClick={handleStartSession} className="text-lg px-8 py-6 rounded-full shadow-lg shadow-primary/25 hover:scale-105 transition-transform w-full">
              <Play className="mr-2 h-5 w-5" /> Start Interview
            </Button>
          </div>
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

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="w-full md:w-[40%] border-r h-[50%] md:h-full bg-card/50 flex flex-col">
          <TranscriptPanel transcriptBlocks={transcriptBlocks} status={status} />
        </div>
        
        <div className="w-full md:w-[60%] h-[50%] md:h-full bg-card flex flex-col">
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
