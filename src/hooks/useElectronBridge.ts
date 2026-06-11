'use client'
/**
 * Detects if running inside Electron overlay.
 * Receives system audio sourceId from Electron main process.
 * Sends recording state back to Electron.
 */
import { useState, useEffect, useCallback } from 'react'

export function useElectronBridge() {
  const [isElectron, setIsElectron] = useState(false)
  const [audioSourceId, setAudioSourceId] = useState<string | null>(null)

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'ELECTRON_CONTEXT') {
        setIsElectron(true)
        window.parent.postMessage({ type: 'REQUEST_AUDIO_SOURCE' }, '*')
      }
      if (event.data?.type === 'AUDIO_SOURCE') {
        setIsElectron(true) // We know it's electron if we get this reply
        setAudioSourceId(event.data.sourceId)
      }
    }
    window.addEventListener('message', handler)
    
    // Proactively request it in case we missed the ELECTRON_CONTEXT event (SPA navigation)
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'REQUEST_AUDIO_SOURCE' }, '*')
    }
    
    return () => window.removeEventListener('message', handler)
  }, [])

  const notifyRecordingStarted = useCallback(() => {
    if (!isElectron) return
    window.parent.postMessage({ type: 'RECORDING_STARTED' }, '*')
  }, [isElectron])

  const notifyRecordingStopped = useCallback(() => {
    if (!isElectron) return
    window.parent.postMessage({ type: 'RECORDING_STOPPED' }, '*')
  }, [isElectron])

  const startSession = useCallback((urlPath?: string) => {
    if (!isElectron) return
    window.parent.postMessage({ type: 'START_SESSION', urlPath }, '*')
  }, [isElectron])

  const endSession = useCallback(() => {
    if (!isElectron) return
    window.parent.postMessage({ type: 'END_SESSION' }, '*')
  }, [isElectron])

  return { isElectron, audioSourceId, notifyRecordingStarted, notifyRecordingStopped, startSession, endSession }
}
