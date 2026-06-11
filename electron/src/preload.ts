import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Session
  startSession: (p: any) => ipcRenderer.invoke('start-session', p),
  endSession: () => ipcRenderer.invoke('end-session'),
  getConnectionStatus: () => ipcRenderer.invoke('get-connection-status'),
  triggerAiAnswer: (p: any) => ipcRenderer.invoke('trigger-ai-answer', p),

  // Audio — CRITICAL: use transfer for ArrayBuffer
  sendAudioChunk: (buffer: ArrayBuffer) => {
    ipcRenderer.send('audio-chunk', buffer)
  },

  // Screen
  analyzeScreen: () => ipcRenderer.invoke('analyze-screen'),
  getAudioSource: () => ipcRenderer.invoke('get-audio-source'),
  checkPermission: () => ipcRenderer.invoke('check-permission'),

  // Window
  showAnswerPanel: () => ipcRenderer.invoke('show-answer-panel'),
  hideAnswerPanel: () => ipcRenderer.invoke('hide-answer-panel'),
  collapseToolbar: () => ipcRenderer.invoke('collapse-toolbar'),
  expandToolbar: () => ipcRenderer.invoke('expand-toolbar'),
  moveToolbar: (dir: string, amount: number) => ipcRenderer.invoke('move-toolbar', { dir, amount }),

  // Auth
  getAuth: () => ipcRenderer.invoke('get-auth'),
  clearAuth: () => ipcRenderer.invoke('clear-auth'),
  getClipboard: () => ipcRenderer.invoke('get-clipboard'),

  // Utility
  copyText: (t: string) => ipcRenderer.invoke('copy-text', t),
  openDashboard: () => ipcRenderer.send('open-dashboard'),
  getVersion: () => ipcRenderer.invoke('get-version'),
  setRecording: (v: boolean) => ipcRenderer.send('set-recording', v),

  // Events FROM main → renderer
  onAuthReceived: (cb: (d: any) => void) => ipcRenderer.on('auth-received', (_e, d) => cb(d)),
  onTranscriptDelta: (cb: (d: any) => void) => ipcRenderer.on('transcript-delta', (_e, d) => cb(d)),
  onAnswerDelta: (cb: (d: any) => void) => ipcRenderer.on('answer-delta', (_e, d) => cb(d)),
  onAnswerDone: (cb: (d: any) => void) => ipcRenderer.on('answer-done', (_e, d) => cb(d)),
  onSessionError: (cb: (d: any) => void) => ipcRenderer.on('session-error', (_e, d) => cb(d)),
  onSessionJoined: (cb: (d: any) => void) => ipcRenderer.on('session-joined', (_e, d) => cb(d)),
  onSocketStatus: (cb: (s: string) => void) => ipcRenderer.on('socket-status', (_e, s) => cb(s)),
  onShortcutTriggerAi: (cb: () => void) => ipcRenderer.on('shortcut-trigger-ai', () => cb()),
  onShortcutAnalyzeScreen: (cb: () => void) => ipcRenderer.on('shortcut-analyze-screen', () => cb()),
  onScreenAnalyzing: (cb: (d: any) => void) => ipcRenderer.on('screen-analyzing', (_e, d) => cb(d)),
  onNavigateAnswer: (cb: (d: any) => void) => ipcRenderer.on('navigate-answer', (_e, d) => cb(d)),

  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
  platform: process.platform
})
