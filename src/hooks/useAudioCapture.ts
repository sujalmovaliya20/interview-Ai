'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseAudioCaptureProps {
  onChunk: (buffer: ArrayBuffer) => void
  enabled: boolean
  electronSourceId?: string | null
}

export function useAudioCapture({ onChunk, enabled, electronSourceId }: UseAudioCaptureProps) {
  const [isRecording, setIsRecording] = useState(false)
  const isRecordingRef = useRef(false)
  const [isPaused, setIsPaused] = useState(false)
  const isPausedRef = useRef(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt')

  const contextRef = useRef<AudioContext | null>(null)
  const streamsRef = useRef<MediaStream[]>([])
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceNodesRef = useRef<MediaStreamAudioSourceNode[]>([])
  const animationRef = useRef<number>(0)
  const sampleBufferRef = useRef<Float32Array[]>([])
  const accumulatedSamplesRef = useRef<number>(0)

  // Desired config
  const SAMPLE_RATE = 16000
  const CHUNK_DURATION_MS = 250
  const SAMPLES_PER_CHUNK = (SAMPLE_RATE * CHUNK_DURATION_MS) / 1000

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
        setPermissionState(result.state)
        result.onchange = () => {
          setPermissionState(result.state)
        }
      }).catch(() => {
        // Ignore fallback
      })
    }
  }, [])

  const start = useCallback(async () => {
    try {
      setError(null)
      let desktopStream: MediaStream | null = null
      let micStream: MediaStream | null = null

      // Always try to capture microphone (interviewee)
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: { ideal: SAMPLE_RATE }
          },
          video: false
        })
      } catch (err: any) {
        console.warn('Constrained mic access failed, trying fallback:', err)
        try {
          // Fallback: ask for bare minimum to bypass driver crashes
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          })
        } catch (fallbackErr: any) {
          console.error('Fallback mic access failed:', fallbackErr)
          throw fallbackErr // If even this fails, it's truly blocked
        }
      }

      // If running in Electron with system audio source, also capture desktop (interviewer)
      if (electronSourceId) {
        try {
          desktopStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              // @ts-ignore — Electron-specific constraint
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: electronSourceId
              }
            },
            video: false
          })
        } catch (err) {
          console.warn('Desktop audio access failed:', err)
        }
      }

      if (!micStream && !desktopStream) {
        throw new Error('NO_AUDIO_SOURCES')
      }

      if (micStream) streamsRef.current.push(micStream)
      if (desktopStream) streamsRef.current.push(desktopStream)

      setPermissionState('granted')

      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
      const context = new AudioContextCtor({ sampleRate: SAMPLE_RATE })
      
      if (context.state === 'suspended') {
        await context.resume()
      }
      
      contextRef.current = context

      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      // Mixer node to safely combine streams for the processor
      const mixerNode = context.createGain()
      mixerNode.gain.value = 1.0

      // Connect both streams to the analyser to mix them
      if (micStream) {
        const micSource = context.createMediaStreamSource(micStream)
        micSource.connect(mixerNode)
        micSource.connect(analyser)
        sourceNodesRef.current.push(micSource)
      }
      
      if (desktopStream) {
        const desktopSource = context.createMediaStreamSource(desktopStream)
        desktopSource.connect(mixerNode)
        desktopSource.connect(analyser)
        sourceNodesRef.current.push(desktopSource)
      }

      // ScriptProcessor is deprecated but easiest for 16kHz cross-browser
      const processor = context.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        if (!isRecordingRef.current || isPausedRef.current) return

        const inputData = e.inputBuffer.getChannelData(0)
        // clone the array because underlying buffer is reused
        sampleBufferRef.current.push(new Float32Array(inputData))
        accumulatedSamplesRef.current += inputData.length

        if (accumulatedSamplesRef.current >= SAMPLES_PER_CHUNK) {
          // Merge arrays
          let offset = 0
          const merged = new Float32Array(accumulatedSamplesRef.current)
          for (const buf of sampleBufferRef.current) {
            merged.set(buf, offset)
            offset += buf.length
          }

          // Emit ArrayBuffer
          onChunk(merged.buffer)

          // Reset
          sampleBufferRef.current = []
          accumulatedSamplesRef.current = 0
        }
      }

      // Gain node for audio process connection
      const gainNode = context.createGain()
      gainNode.gain.value = 0

      mixerNode.connect(processor)
      processor.connect(gainNode)
      gainNode.connect(context.destination)

      setIsRecording(true)
      isRecordingRef.current = true
      setIsPaused(false)
      isPausedRef.current = false

      const updateLevel = () => {
        if (analyserRef.current && isRecordingRef.current && !isPausedRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const average = sum / dataArray.length
          const level = Math.min(100, Math.round((average / 255) * 100))
          setAudioLevel(level)
        } else if (isPausedRef.current) {
          setAudioLevel(0)
        }
        
        animationRef.current = requestAnimationFrame(updateLevel)
      }
      
      updateLevel()
      return true

    } catch (err: any) {
      console.error('Audio capture error:', err)
      if (err?.name === 'NotAllowedError') {
        setError('MICROPHONE_DENIED')
        setPermissionState('denied')
      } else if (err?.name === 'NotFoundError' || err?.message === 'NO_AUDIO_SOURCES') {
        setError('NO_MICROPHONE')
      } else if (err?.name === 'NotReadableError') {
        setError('MICROPHONE_IN_USE') // Hardware error / exclusive use
      } else {
        setError('UNKNOWN_ERROR')
      }
      return false
    }
  }, [onChunk, electronSourceId])

  const stop = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    sourceNodesRef.current.forEach(source => source.disconnect())
    sourceNodesRef.current = []
    
    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
    }
    
    streamsRef.current.forEach(stream => stream.getTracks().forEach(track => track.stop()))
    streamsRef.current = []
    
    if (contextRef.current && contextRef.current.state !== 'closed') {
      contextRef.current.close()
      contextRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    setIsRecording(false)
    isRecordingRef.current = false
    setIsPaused(false)
    isPausedRef.current = false
    setAudioLevel(0)
    sampleBufferRef.current = []
    accumulatedSamplesRef.current = 0
  }, [])

  const pause = useCallback(() => {
    if (contextRef.current && contextRef.current.state === 'running') {
      contextRef.current.suspend()
      setIsPaused(true)
      isPausedRef.current = true
    }
  }, [])

  const resume = useCallback(() => {
    if (contextRef.current && contextRef.current.state === 'suspended') {
      contextRef.current.resume()
      setIsPaused(false)
      isPausedRef.current = false
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    isRecording,
    isPaused,
    audioLevel,
    error,
    start,
    pause,
    resume,
    stop,
    permissionState
  }
}
