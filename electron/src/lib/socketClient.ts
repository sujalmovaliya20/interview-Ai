// eslint-disable-next-line @typescript-eslint/no-var-requires
const { io } = require('socket.io-client') as typeof import('socket.io-client')
type Socket = import('socket.io-client').Socket
import { BrowserWindow, ipcMain } from 'electron'

export class SocketClient {
  private socket: Socket | null = null
  private sessionId: string | null = null
  private windowManager: any = null
  private reconnectAttempts = 0

  setWindowManager(wm: any) { this.windowManager = wm }

  async connect(token: string, sessionId: string): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('[Socket] connect() called with token length:', token?.length, 'sessionId:', sessionId)
      const SERVER_URL = (
        process.env.SERVER_URL ||
        process.env.VITE_SERVER_URL ||
        'http://localhost:3001'
      )
      console.log('[Socket] Connecting to:', SERVER_URL)

      // Disconnect existing socket if any
      if (this.socket?.connected) {
        this.socket.disconnect()
      }

      this.sessionId = sessionId
      this.socket = io(SERVER_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      })
      // EXPLICIT connect call — do not rely on autoConnect
      this.socket.connect()

      this.socket.on('connect', () => {
        console.log('[Socket] Connected, joining session:', sessionId)
        this.socket?.emit('join_session', { sessionId })
        this.reconnectAttempts = 0
        // Update toolbar status
        this.windowManager?.getToolbar()?.webContents.send('socket-status', 'connected')
        resolve(true)
      })

      this.socket.on('session_joined', (data: any) => {
        console.log('[Socket] Session joined:', data)
        this.windowManager?.getToolbar()?.webContents.send('session-joined', data)
      })

      this.socket.on('transcript_delta', (payload: any) => {
        console.log('[Socket] Transcript delta:', payload.text?.slice(0, 40))
        this.windowManager?.getToolbar()?.webContents.send('transcript-delta', payload)
      })

      this.socket.on('answer_delta', (payload: any) => {
        console.log('[Socket] Answer delta received')
        this.windowManager?.getAnswerPanel()?.webContents.send('answer-delta', payload)
        this.windowManager?.showAnswerPanel()
      })

      this.socket.on('answer_done', (payload: any) => {
        this.windowManager?.getAnswerPanel()?.webContents.send('answer-done', payload)
      })

      this.socket.on('session_error', (payload: any) => {
        console.error('[Socket] Session error:', payload)
        this.windowManager?.getToolbar()?.webContents.send('session-error', payload)
      })

      this.socket.on('disconnect', (reason: string) => {
        console.log('[Socket] Disconnected:', reason)
        this.windowManager?.getToolbar()?.webContents.send('socket-status', 'disconnected')
      })

      this.socket.on('connect_error', (err: Error) => {
        console.error('[Socket] Connect error:', err.message)
        this.windowManager?.getToolbar()?.webContents.send('socket-status', 'error')
        if (this.reconnectAttempts === 0) resolve(false)
        this.reconnectAttempts++
      })
    })
  }

  sendAudioChunk(buffer: ArrayBuffer): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Cannot send chunk — not connected')
      return
    }
    this.socket.emit('audio_chunk', buffer)
  }

  endSession(): void {
    if (this.sessionId && this.socket?.connected) {
      this.socket.emit('end_session', { sessionId: this.sessionId })
    }
    this.socket?.disconnect()
    this.socket = null
    this.sessionId = null
    this.windowManager?.getToolbar()?.webContents.send('socket-status', 'disconnected')
  }

  isConnected(): boolean { return this.socket?.connected || false }
  getSessionId(): string | null { return this.sessionId }
}
