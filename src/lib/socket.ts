import { io, Socket } from 'socket.io-client'

export interface ServerToClientEvents {
  transcript_delta: (payload: { text: string; isFinal: boolean; timestamp: number; provider?: 'whisper' | 'deepgram'; language?: string; latency_ms?: number }) => void
  answer_delta: (payload: { id: string; text: string; isStreaming: boolean; modelUsed: string; timestamp?: number }) => void
  answer_done: (payload: { id: string; isStreaming: boolean; timestamp?: number }) => void
  session_joined: (payload: { sessionId: string; joinedAt: number }) => void
  session_ended: (payload: { sessionId: string; duration: number }) => void
  session_error: (payload: { code: string; message: string }) => void
  pong_session: (payload: { timestamp: number }) => void
  rate_limit_exceeded: (payload: { message: string }) => void
}

export interface ClientToServerEvents {
  join_session: (payload: { sessionId: string }) => void
  audio_chunk: (chunk: ArrayBuffer) => void
  end_session: (payload: { sessionId: string }) => void
  ping_session: (payload: { sessionId: string }) => void
}

let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

export function createSocket(token: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socketInstance) {
    if (socketInstance.auth && typeof socketInstance.auth === 'object' && 'token' in socketInstance.auth && socketInstance.auth.token !== token) {
      // Re-authenticate if token changed
      socketInstance.auth = { token }
      socketInstance.disconnect()
      socketInstance.connect()
    }
    return socketInstance
  }

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

  socketInstance = io(SOCKET_URL, {
    auth: { token },
    transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
    timeout: 60000,                      // 60s timeout to tolerate cold starts
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: false // We connect manually
  })

  return socketInstance
}

export function destroySocket(): void {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}
