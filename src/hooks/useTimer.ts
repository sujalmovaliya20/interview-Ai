'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer() {
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const start = useCallback(() => {
    setIsActive(true)
  }, [])

  const pause = useCallback(() => {
    setIsActive(false)
  }, [])

  const resume = useCallback(() => {
    setIsActive(true)
  }, [])

  const reset = useCallback(() => {
    setIsActive(false)
    setSeconds(0)
  }, [])

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    } else if (!isActive && intervalRef.current !== null) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive])

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
    const secs = (totalSeconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  return {
    seconds,
    formatted: formatTime(seconds),
    start,
    pause,
    resume,
    reset,
    isActive
  }
}
