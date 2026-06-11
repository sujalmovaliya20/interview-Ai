import {
  ipcMain, desktopCapturer, clipboard, shell, screen, app
} from 'electron'
import { WindowManager } from './windowManager'
import { TrayManager } from './trayManager'
import { AudioCaptureManager } from './audioCapture'
import { AuthManager } from './authManager'
import { SocketClient } from './socketClient'

export function registerIpcHandlers(
  windowManager: WindowManager,
  trayManager: TrayManager,
  audioCapture: AudioCaptureManager,
  authManager: AuthManager,
  socketClient: SocketClient
): void {

  // ── AUDIO CHUNKS (renderer → main → socket) ──
  ipcMain.on('audio-chunk', (_e, buffer: ArrayBuffer) => {
    socketClient.sendAudioChunk(buffer)
  })

  // ── SESSION MANAGEMENT ──
  ipcMain.handle('start-session', async (_e, payload: {
    token: string; sessionId: string; model?: string; language?: string
  }) => {
    console.log('[IPC] start-session called with:', payload.sessionId)
    authManager.setSession(payload.token, payload.sessionId)
    const connected = await socketClient.connect(payload.token, payload.sessionId)
    if (connected) {
      trayManager.setRecordingState(true)
      windowManager.getToolbar()?.webContents.send('socket-status', 'connected')
    }
    return { connected }
  })

  ipcMain.handle('end-session', async () => {
    socketClient.endSession()
    trayManager.setRecordingState(false)
    windowManager.hideAnswerPanel()
    authManager.clearAuth()
    return { ended: true }
  })

  ipcMain.handle('get-connection-status', () => ({
    connected: socketClient.isConnected(),
    sessionId: socketClient.getSessionId()
  }))

  // ── WINDOW CONTROL ──
  ipcMain.handle('show-answer-panel', () => {
    // Only show if socket is connected
    if (!socketClient.isConnected()) {
      console.warn('[IPC] show-answer-panel called but socket not connected')
      // Send error back to toolbar
      windowManager.getToolbar()?.webContents.send('session-error', {
        code: 'NOT_CONNECTED',
        message: 'Not connected to a session. Use "Open in Desktop App" from the browser.'
      })
      return { shown: false }
    }
    windowManager.showAnswerPanel()
    return { shown: true }
  })
  ipcMain.handle('hide-answer-panel', () => windowManager.hideAnswerPanel())
  ipcMain.handle('collapse-toolbar', () => windowManager.collapseToolbar())
  ipcMain.handle('expand-toolbar', () => windowManager.expandToolbar())
  ipcMain.handle('move-toolbar', (_e, { dir, amount }: { dir: string; amount: number }) => {
    windowManager.moveToolbar(dir as any, amount)
  })

  // ── AUDIO SOURCE ──
  ipcMain.handle('get-audio-source', async () => {
    const source = await audioCapture.getSystemAudioSource()
    return source ? { id: source.id, name: source.name } : null
  })

  ipcMain.handle('check-permission', async () => {
    return audioCapture.checkPermission()
  })

  // ── ANALYZE SCREEN ──
  ipcMain.handle('analyze-screen', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      })

      if (!sources[0]) return { error: 'No screen source found' }

      const screenshot = sources[0].thumbnail.toPNG()
      const base64 = screenshot.toString('base64')

      // Show answer panel with loading state
      windowManager.showAnswerPanel()
      const answerId = Date.now().toString()
      windowManager.getAnswerPanel()?.webContents.send('screen-analyzing', { answerId })

      // Call FastAPI analyze-screen endpoint
      const TRANSCRIPTION_URL = process.env.TRANSCRIPTION_URL || 'http://localhost:8000'
      const sessionId = authManager.getSessionId()

      const resp = await fetch(`${TRANSCRIPTION_URL}/analyze-screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64, session_id: sessionId || 'direct' })
      })

      if (!resp.ok) throw new Error(`API error: ${resp.status}`)
      const data = await resp.json() as { answer: string }

      windowManager.getAnswerPanel()?.webContents.send('answer-delta', {
        answerId,
        text: data.answer,
        isStreaming: false,
        modelUsed: 'vision'
      })
      windowManager.getAnswerPanel()?.webContents.send('answer-done', { answerId })
      return { started: true }

    } catch (err: any) {
      console.error('[AnalyzeScreen] Error:', err)
      windowManager.getAnswerPanel()?.webContents.send('session-error', {
        code: 'ANALYZE_FAILED',
        message: err.message
      })
      return { error: err.message }
    }
  })

  // ── MANUAL AI TRIGGER (Cmd+Enter) ──
  ipcMain.handle('trigger-ai-answer', async (_e, { text }: { text: string }) => {
    // Send manual question text via socket
    // The socket server will process it through the answer engine
    if (!socketClient.isConnected()) return { error: 'Not connected' }
    // Emit a special manual trigger event
    // (Add this event handler to server/src/handlers/sessionHandler.ts)
    ;(socketClient as any).socket?.emit('manual_answer', {
      sessionId: socketClient.getSessionId(),
      text: text || 'Generate a helpful answer for the current context'
    })
    windowManager.showAnswerPanel()
    return { triggered: true }
  })

  // ── AUTH ──
  ipcMain.handle('get-auth', () => ({
    token: authManager.getToken(),
    sessionId: authManager.getSessionId()
  }))

  ipcMain.handle('clear-auth', () => { authManager.clearAuth() })

  // ── UTILITY ──
  ipcMain.handle('copy-text', (_e, text: string) => {
    clipboard.writeText(text)
    return true
  })

  ipcMain.on('open-dashboard', () => {
    const APP_URL = process.env.APP_URL || 'http://localhost:3000'
    shell.openExternal(`${APP_URL}/dashboard`)
  })

  ipcMain.handle('get-version', () => app.getVersion())

  ipcMain.handle('get-clipboard', () => {
    return clipboard.readText()
  })

  ipcMain.on('set-recording', (_e, isRecording: boolean) => {
    trayManager.setRecordingState(isRecording)
  })
}
