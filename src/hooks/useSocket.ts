'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createSocket, destroySocket, ServerToClientEvents, ClientToServerEvents } from '../lib/socket'
import { Socket } from 'socket.io-client'

interface UseSocketProps {
  sessionId: string
  token: string
  enabled: boolean
}

export function useSocket({ sessionId, token, enabled }: UseSocketProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)

  useEffect(() => {
    if (!enabled || !token || !sessionId) return

    const socket = createSocket(token)
    socketRef.current = socket

    const onConnect = () => {
      setIsConnected(true)
      setIsJoining(true)
      setError(null)
      socket.emit('join_session', { sessionId })
    }

    const onDisconnect = () => {
      setIsConnected(false)
    }

    const onSessionJoined = () => {
      setIsJoining(false)
    }

    const onSessionError = (payload: { code: string; message: string }) => {
      console.error('Session Error:', payload)
      setError(payload.message)
      setIsJoining(false)
    }

    const onConnectError = (err: Error) => {
      console.error('Socket connection error:', err)
      setError('Failed to connect to real-time server')
      setIsConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('session_joined', onSessionJoined)
    socket.on('session_error', onSessionError)
    socket.on('connect_error', onConnectError)

    socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('session_joined', onSessionJoined)
      socket.off('session_error', onSessionError)
      socket.off('connect_error', onConnectError)
      
      destroySocket()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [enabled, token, sessionId])

  // Ping interval
  useEffect(() => {
    if (!isConnected || !sessionId) return

    const interval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('ping_session', { sessionId })
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isConnected, sessionId])

  const sendChunk = useCallback((buffer: ArrayBuffer) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('audio_chunk', buffer)
    }
  }, [])

  const endSession = useCallback(() => {
    if (socketRef.current?.connected && sessionId) {
      socketRef.current.emit('end_session', { sessionId })
      destroySocket()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [sessionId])

  return { isConnected, isJoining, error, sendChunk, endSession }
}
