'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseAudioCaptureProps {
  onChunk: (buffer: ArrayBuffer) => void
  enabled: boolean
}

export function useAudioCapture({ onChunk, enabled }: UseAudioCaptureProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt')

  const contextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: SAMPLE_RATE,
        },
        video: false
      })

      streamRef.current = stream
      setPermissionState('granted')

      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
      const context = new AudioContextCtor({ sampleRate: SAMPLE_RATE })
      contextRef.current = context

      const source = context.createMediaStreamSource(stream)
      sourceRef.current = source

      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // ScriptProcessor is deprecated but easiest for 16kHz cross-browser
      const processor = context.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        if (!isRecording || isPaused) return

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

      source.connect(processor)
      processor.connect(context.destination)

      setIsRecording(true)
      setIsPaused(false)

      const updateLevel = () => {
        if (analyserRef.current && isRecording && !isPaused) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const average = sum / dataArray.length
          const level = Math.min(100, Math.round((average / 255) * 100))
          setAudioLevel(level)
        } else if (isPaused) {
          setAudioLevel(0)
        }
        
        animationRef.current = requestAnimationFrame(updateLevel)
      }
      
      updateLevel()

    } catch (err: any) {
      console.error('Mic error:', err)
      if (err.name === 'NotAllowedError') {
        setError('MICROPHONE_DENIED')
        setPermissionState('denied')
      } else if (err.name === 'NotFoundError') {
        setError('NO_MICROPHONE')
      } else {
        setError('UNKNOWN_ERROR')
      }
    }
  }, [onChunk, isRecording, isPaused])

  const stop = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (contextRef.current && contextRef.current.state !== 'closed') {
      contextRef.current.close()
      contextRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    setIsRecording(false)
    setIsPaused(false)
    setAudioLevel(0)
    sampleBufferRef.current = []
    accumulatedSamplesRef.current = 0
  }, [])

  const pause = useCallback(() => {
    if (contextRef.current && contextRef.current.state === 'running') {
      contextRef.current.suspend()
      setIsPaused(true)
    }
  }, [])

  const resume = useCallback(() => {
    if (contextRef.current && contextRef.current.state === 'suspended') {
      contextRef.current.resume()
      setIsPaused(false)
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
