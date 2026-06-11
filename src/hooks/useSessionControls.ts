'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/sessionStore'
import { useSocket } from './useSocket'
import { useAudioCapture } from './useAudioCapture'
import { useElectronBridge } from './useElectronBridge'

interface UseSessionControlsProps {
  sessionId: string
  accessToken: string
}

export function useSessionControls({ sessionId, accessToken }: UseSessionControlsProps) {
  const router = useRouter()
  
  // Local state for dialogs
  const [stopDialogOpen, setStopDialogOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)

  // Store selectors
  const status = useSessionStore(state => state.status)
  const setStatus = useSessionStore(state => state.setStatus)
  const isRecording = useSessionStore(state => state.isRecording)
  const isPaused = useSessionStore(state => state.isPaused)
  const setIsPaused = useSessionStore(state => state.setIsPaused)
  const audioLevel = useSessionStore(state => state.audioLevel)
  const isConnected = useSessionStore(state => state.isConnected)
  const transcriptBlocks = useSessionStore(state => state.transcriptBlocks)
  const answerBlocks = useSessionStore(state => state.answerBlocks)
  const creditBalance = useSessionStore(state => state.creditBalance)

  // We will assume isUnlimited is passed from outside or stored if needed.
  // For now, let's derive it or default to false if not in store.
  const isUnlimited = false // Or get from store if added

  // Electron Bridge
  const { isElectron, audioSourceId, notifyRecordingStarted, notifyRecordingStopped } = useElectronBridge()

  // Sync recording state to Electron tray
  useEffect(() => {
    if (status === 'active' && !isPaused) {
      notifyRecordingStarted()
    } else {
      notifyRecordingStopped()
    }
  }, [status, isPaused, notifyRecordingStarted, notifyRecordingStopped])

  // Socket
  const { isConnected: socketConnected, sendChunk, endSession } = useSocket({
    sessionId,
    token: accessToken,
    enabled: status !== 'idle' && status !== 'ended' && status !== 'error'
  })

  // Audio capture
  const { start: startAudio, pause: pauseAudio, resume: resumeAudio, stop: stopAudio, error: audioError } = useAudioCapture({
    onChunk: (buffer) => {
      if (socketConnected && !isPaused) {
        sendChunk(buffer)
      }
    },
    enabled: status === 'active',
    electronSourceId: audioSourceId
  })

  const handlePause = useCallback(() => {
    setIsPaused(true)
    pauseAudio()
  }, [setIsPaused, pauseAudio])

  const handleResume = useCallback(() => {
    setIsPaused(false)
    resumeAudio()
  }, [setIsPaused, resumeAudio])

  const handleStop = useCallback(() => {
    setStopDialogOpen(true)
  }, [])

  const confirmStop = useCallback(() => {
    setStopDialogOpen(false)
    setStatus('ending')
    endSession()
    stopAudio()
    
    // Simulate a tiny delay for backend processing then show summary
    setTimeout(() => {
      setStatus('ended')
      setSummaryOpen(true)
    }, 1500)
  }, [endSession, stopAudio, setStatus])

  const handleSummaryClose = useCallback(() => {
    setSummaryOpen(false)
    if (isElectron) {
      // Need to destructure endSession from useElectronBridge above
      window.parent.postMessage({ type: 'END_SESSION' }, '*')
    } else {
      router.push('/dashboard')
    }
  }, [router, isElectron])

  return {
    status,
    isRecording,
    isPaused,
    audioLevel,
    isConnected: socketConnected,
    transcriptBlocks,
    answerBlocks,
    creditBalance,
    isUnlimited,
    stopDialogOpen,
    setStopDialogOpen,
    summaryOpen,
    handlePause,
    handleResume,
    handleStop,
    confirmStop,
    handleSummaryClose,
    startAudio,
    audioError,
  }
}
