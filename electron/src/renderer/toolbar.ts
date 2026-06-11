/**
 * Toolbar renderer — builds and manages the compact top bar UI.
 * Handles: hover interaction, audio capture, tab switching,
 * timer, session state, transcript display below toolbar.
 */
import './toolbar.css'

const state = {
  isRecording: false,
  systemAudioOn: false,
  micOn: false,
  activeTab: 'ai-answer',
  sessionSeconds: 0,
  timerInterval: null as ReturnType<typeof setInterval> | null,
  socketStatus: 'disconnected',
  token: null as string | null,
  sessionId: null as string | null,
  audioContext: null as AudioContext | null,
  mediaStream: null as MediaStream | null,
  processorNode: null as ScriptProcessorNode | null,
  transcriptBuffer: [] as string[],
  manualTextBuffer: '',
  socketReady: false
}

async function init() {
  console.log('[Toolbar] Renderer init() called')
  buildUI()
  attachEvents()
  registerMainListeners()

  // Wait for main process IPC handlers to be ready
  // Small delay ensures registerIpcHandlers() has completed
  await new Promise(resolve => setTimeout(resolve, 150))

  try {
    const auth = await (window as any).api.getAuth()
    if (auth?.token) {
      state.token = auth.token
      state.sessionId = auth.sessionId
      if (auth.sessionId) {
        await connectSession(auth.token, auth.sessionId)
      }
    }
  } catch (err) {
    // Handler not ready yet — auth will come via deep link instead
    console.warn('[Toolbar] getAuth not ready yet, waiting for deep link auth')
  }
}

function buildUI() {
  const root = document.getElementById('toolbar-root')!
  root.innerHTML = `
    <button class="tb-icon-btn" id="btn-soundwave" title="Transcript">🎵</button>
    <button class="tb-icon-btn" id="btn-system-audio" title="System Audio">🔴</button>
    <button class="tb-icon-btn" id="btn-mic" title="Microphone">🎙️</button>
    
    <div class="tb-divider"></div>
    
    <div class="tb-tabs">
      <button class="tb-tab active" id="tab-ai">AI Answer ✨</button>
      <button class="tb-tab" id="tab-screen">Analyze Screen 🖥</button>
      <button class="tb-tab" id="tab-chat">Chat</button>
    </div>

    <div class="tb-spacer"></div>

    <div class="tb-right">
      <div class="tb-dot disconnected" id="status-dot"></div>
      <div class="tb-timer" id="timer">0:00</div>
      <button class="tb-icon-btn" id="btn-menu">⋮</button>
      <button class="tb-icon-btn" id="btn-drag" style="-webkit-app-region: drag">✥</button>
      <button class="tb-icon-btn" id="btn-collapse">∧</button>
    </div>
  `
}

function attachEvents() {
  document.getElementById('btn-system-audio')!.onclick = handleSystemAudioToggle
  document.getElementById('btn-mic')!.onclick = handleMicToggle
  document.getElementById('btn-soundwave')!.onclick = toggleTranscriptStrip
  document.getElementById('tab-ai')!.onclick = () => switchTab('ai-answer')
  document.getElementById('tab-screen')!.onclick = () => switchTab('analyze')
  document.getElementById('tab-chat')!.onclick = () => switchTab('chat')
  document.getElementById('btn-collapse')!.onclick = () => (window as any).api.collapseToolbar()
  document.getElementById('btn-menu')!.onclick = showMenu
}

function registerMainListeners() {
  // Auth received from main (deep link)
  ;(window as any).api.onAuthReceived(async (data: { token: string; sessionId: string | null }) => {
    console.log('[Toolbar] Auth received, token:', !!data.token, 'sessionId:', data.sessionId)
    state.token = data.token
    state.sessionId = data.sessionId

    if (data.sessionId) {
      // Full auth with session — connect immediately
      await connectSession(data.token, data.sessionId)
    } else {
      // Token only — user needs to create/select a session
      // Show session picker or use last active session
      showToast('Connected to app. Create a session to start.', 'success')
      // Try to get active session from server
      await tryGetActiveSession(data.token)
    }
  })

  // Socket status updates
  ;(window as any).api.onSocketStatus((status: string) => {
    state.socketStatus = status
    state.socketReady = (status === 'connected')
    updateStatusDot(status as any)
    console.log('[Toolbar] Socket status:', status)

    // If socket just connected AND audio buttons were clicked waiting
    // audio will start sending chunks now automatically (processor already running)
    if (status === 'connected') {
      showToast('Connected — ready to assist', 'success')
    }
  })

  // Session joined — start timer
  ;(window as any).api.onSessionJoined((_data: any) => {
    startTimer()
    updateStatusDot('connected')
  })

  // Transcript updates
  ;(window as any).api.onTranscriptDelta((payload: any) => {
    state.transcriptBuffer.push(payload.text)
    if (state.transcriptBuffer.length > 50) state.transcriptBuffer.shift()
    updateTranscriptStrip(payload.text)
    // Track last few words for manual trigger context
    state.manualTextBuffer = state.transcriptBuffer.slice(-5).join(' ')
  })

  // Error display
  ;(window as any).api.onSessionError((payload: any) => {
    showToast(`Error: ${payload.message}`, 'error')
  })

  // Keyboard shortcut from main → trigger AI answer
  ;(window as any).api.onShortcutTriggerAi(() => {
    handleManualTrigger()
  })

  // Keyboard shortcut from main → analyze screen
  ;(window as any).api.onShortcutAnalyzeScreen(() => {
    handleAnalyzeScreen()
  })
}

async function tryGetActiveSession(token: string) {
  try {
    // Fetch most recent active session from Next.js API
    const APP_URL = process.env.APP_URL || 'http://localhost:3000'
    const resp = await fetch(`${APP_URL}/api/sessions/active`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (resp.ok) {
      const data = await resp.json() as { sessionId: string | null }
      if (data.sessionId) {
        state.sessionId = data.sessionId
        console.log('[Toolbar] Found active session:', data.sessionId)
        await connectSession(token, data.sessionId)
      }
    }
  } catch (e) {
    console.warn('[Toolbar] Could not fetch active session:', e)
    // That is OK — user will click "Open in Desktop App" from session page
  }
}

async function connectSession(token: string, sessionId: string) {
  console.log('[Toolbar] connectSession called, token:', !!token, 'sessionId:', sessionId)
  console.log('[Toolbar] Connecting session:', sessionId)
  updateStatusDot('connecting')
  const result = await (window as any).api.startSession({ token, sessionId })
  if (result.connected) {
    console.log('[Toolbar] Session connected!')
  } else {
    showToast('Could not connect to server. Check server is running.', 'error')
    updateStatusDot('disconnected')
  }
}

async function handleSystemAudioToggle() {
  const btn = document.getElementById('btn-system-audio')!
  if (state.systemAudioOn) {
    await stopCapture()
    btn.classList.remove('active')
    state.systemAudioOn = false
  } else {
    const source = await (window as any).api.getAudioSource()
    const started = await startCapture(source?.id || null)
    if (started) {
      btn.classList.add('active')
      state.systemAudioOn = true
      ;(window as any).api.setRecording(true)
    } else {
      showToast('System audio unavailable. Grant Screen Recording permission.', 'warning')
    }
  }
}

async function handleMicToggle() {
  const btn = document.getElementById('btn-mic')!
  if (state.micOn) {
    await stopCapture()
    btn.classList.remove('active')
    state.micOn = false
  } else {
    const started = await startCapture(null)  // null = mic mode
    if (started) {
      btn.classList.add('active')
      state.micOn = true
      ;(window as any).api.setRecording(true)
    }
  }
}

async function ensureAuth(): Promise<boolean> {
  // BYPASS AUTH FOR LOCAL DEV
  state.token = 'dummy-token'
  state.sessionId = '00000000-0000-0000-0000-000000000000'
  return true
}

async function startCapture(sourceId: string | null): Promise<boolean> {
  // CRITICAL: connect socket first if not connected
  if (!state.socketReady) {
    const hasAuth = await ensureAuth()
    if (!hasAuth) return false

    showToast('Connecting to server first...', 'warning')
    await connectSession(state.token!, state.sessionId!)
    // Wait up to 3 seconds for connection
    let waited = 0
    while (!state.socketReady && waited < 3000) {
      await new Promise(r => setTimeout(r, 200))
      waited += 200
    }
    if (!state.socketReady) {
      showToast('Could not connect to server. Is it running?', 'error')
      return false
    }
  }

  try {
    const constraints: MediaStreamConstraints = sourceId ? {
      audio: {
        // @ts-ignore — Electron-specific
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId
        }
      },
      video: false
    } : {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
        channelCount: 1
      },
      video: false
    }

    state.mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
    state.audioContext = new AudioContext({ sampleRate: 16000 })
    const source = state.audioContext.createMediaStreamSource(state.mediaStream)
    state.processorNode = state.audioContext.createScriptProcessor(4096, 1, 1)

    let accumulated: Float32Array[] = []
    let totalSamples = 0
    const targetSamples = 4000  // 250ms at 16kHz

    state.processorNode.onaudioprocess = (e) => {
      const data = new Float32Array(e.inputBuffer.getChannelData(0))
      accumulated.push(data)
      totalSamples += data.length
      if (totalSamples >= targetSamples) {
        const merged = merge(accumulated)
        ;(window as any).api.sendAudioChunk(merged.buffer)
        accumulated = []
        totalSamples = 0
      }
    }

    source.connect(state.processorNode)
    state.processorNode.connect(state.audioContext.destination)
    state.isRecording = true
    console.log('[Audio] Capture started, mode:', sourceId ? 'system' : 'mic')
    return true
  } catch (err: any) {
    console.error('[Audio] Capture failed:', err.message)
    showToast(err.message, 'error')
    return false
  }
}

async function stopCapture() {
  state.processorNode?.disconnect()
  await state.audioContext?.close()
  state.mediaStream?.getTracks().forEach(t => t.stop())
  state.processorNode = null
  state.audioContext = null
  state.mediaStream = null
  state.isRecording = false
  ;(window as any).api.setRecording(false)
}

function merge(arrays: Float32Array[]): Float32Array {
  const len = arrays.reduce((s, a) => s + a.length, 0)
  const out = new Float32Array(len)
  let off = 0
  for (const a of arrays) { out.set(a, off); off += a.length }
  return out
}

async function handleAnalyzeScreen() {
  const hasAuth = await ensureAuth()
  if (!hasAuth) return

  switchTab('analyze')
  await (window as any).api.showAnswerPanel()
  await (window as any).api.analyzeScreen()
}

async function handleManualTrigger() {
  if (!state.socketReady) {
    const hasAuth = await ensureAuth()
    if (!hasAuth) return

    showToast('Connecting to server first...', 'warning')
    await connectSession(state.token!, state.sessionId!)
    let waited = 0
    while (!state.socketReady && waited < 3000) {
      await new Promise(r => setTimeout(r, 200))
      waited += 200
    }
    if (!state.socketReady) {
      showToast('Could not connect to server. Is it running?', 'error')
      return
    }
  }

  const text = state.manualTextBuffer || 'Please provide a helpful interview answer'
  await (window as any).api.triggerAiAnswer({ text })
  await (window as any).api.showAnswerPanel()
}

function startTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval)
  state.sessionSeconds = 0
  state.timerInterval = setInterval(() => {
    state.sessionSeconds++
    const m = Math.floor(state.sessionSeconds / 60)
    const s = state.sessionSeconds % 60
    const el = document.getElementById('timer')
    if (el) {
      el.textContent = `${m}:${s.toString().padStart(2, '0')}`
      el.className = `tb-timer${state.sessionSeconds > 1740 ? ' danger' : state.sessionSeconds > 1500 ? ' warning' : ''}`
    }
  }, 1000)
}

function updateStatusDot(status: 'connected'|'disconnected'|'connecting'|'error') {
  const dot = document.getElementById('status-dot')
  if (!dot) return
  dot.className = 'tb-dot'
  if (status === 'disconnected' || status === 'error') dot.classList.add('disconnected')
  else if (status === 'connecting') dot.classList.add('connecting')
  // connected = green (default)
}

async function switchTab(tab: string) {
  state.activeTab = tab
  document.querySelectorAll('.tb-tab').forEach(t => t.classList.remove('active'))
  const map: Record<string, string> = {
    'ai-answer': 'tab-ai', 'analyze': 'tab-screen', 'chat': 'tab-chat'
  }
  document.getElementById(map[tab])?.classList.add('active')

  if (tab === 'ai-answer' || tab === 'analyze') {
    if (!state.socketReady) {
      const hasAuth = await ensureAuth()
      if (!hasAuth) return

      showToast('Connecting to server first...', 'warning')
      await connectSession(state.token!, state.sessionId!)
      let waited = 0
      while (!state.socketReady && waited < 3000) {
        await new Promise(r => setTimeout(r, 200))
        waited += 200
      }
      if (!state.socketReady) {
        showToast('Could not connect to server. Is it running?', 'error')
        return
      }
    }

    if (tab === 'ai-answer') {
      ;(window as any).api.showAnswerPanel()
    } else {
      handleAnalyzeScreen()
    }
  }
}

let transcriptStripVisible = false
function toggleTranscriptStrip() {
  transcriptStripVisible = !transcriptStripVisible
  let strip = document.getElementById('transcript-strip')
  if (transcriptStripVisible) {
    if (!strip) {
      strip = document.createElement('div')
      strip.id = 'transcript-strip'
      strip.style.cssText = `
        position:fixed; top:48px; left:0; right:0;
        background:rgba(18,18,18,0.9); backdrop-filter:blur(16px);
        border-radius:0 0 10px 10px; padding:6px 12px;
        font-size:11px; color:rgba(255,255,255,0.7);
        border:0.5px solid rgba(255,255,255,0.1); border-top:none;
        max-height:60px; overflow:hidden;
      `
      document.body.appendChild(strip)
    }
    strip.style.display = 'block'
  } else {
    if (strip) strip.style.display = 'none'
  }
}

function updateTranscriptStrip(text: string) {
  const strip = document.getElementById('transcript-strip')
  if (strip && transcriptStripVisible) {
    strip.textContent = text
  }
}

let menuOpen = false
function showMenu() {
  if (menuOpen) { closeMenu(); return }
  menuOpen = true
  const menu = document.createElement('div')
  menu.id = 'overflow-menu'
  menu.style.cssText = `
    position:fixed; top:48px; right:4px;
    background:rgba(22,22,22,0.96); backdrop-filter:blur(20px);
    border:0.5px solid rgba(255,255,255,0.12); border-radius:10px;
    padding:5px; min-width:190px; z-index:99999;
    box-shadow:0 8px 32px rgba(0,0,0,0.6);
    font-family:-apple-system,BlinkMacSystemFont,sans-serif;
  `
  const menuItems = [
    { icon:'📊', label:'Dashboard', action: () => (window as any).api.openDashboard() },
    { icon:'🌐', label:'Language: English', action: () => {} },
    { icon:'⚡', label:'Auto Generate', action: () => {}, toggle: true, on: true },
    {
      icon: '📋',
      label: 'Paste auth token',
      action: () => {
        closeMenu()
        showPasteTokenDialog()
      }
    },
    { type: 'sep' },
    { icon:'🚪', label:'End Session', action: async () => {
        await stopCapture()
        await (window as any).api.endSession()
        state.timerInterval && clearInterval(state.timerInterval)
        updateStatusDot('disconnected')
    }, danger: true }
  ]
  menuItems.forEach(item => {
    if ((item as any).type === 'sep') {
      const s = document.createElement('div')
      s.style.cssText = 'height:1px;background:rgba(255,255,255,0.08);margin:3px 0'
      menu.appendChild(s); return
    }
    const btn = document.createElement('button')
    btn.innerHTML = `${item.icon} ${item.label}`
    btn.style.cssText = `
      width:100%;text-align:left;padding:7px 10px;border:none;border-radius:6px;
      background:transparent;cursor:pointer;font-size:12px;display:flex;gap:6px;
      color:${(item as any).danger ? '#f87171' : 'rgba(255,255,255,0.85)'};
    `
    btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,0.08)'
    btn.onmouseleave = () => btn.style.background = 'transparent'
    btn.onclick = () => { (item as any).action?.(); closeMenu() }
    menu.appendChild(btn)
  })
  document.body.appendChild(menu)
  setTimeout(() => document.addEventListener('mousedown', closeMenuOnOutside), 50)
}

function closeMenuOnOutside(e: MouseEvent) {
  const menu = document.getElementById('overflow-menu')
  if (menu && !menu.contains(e.target as Node)) closeMenu()
}
function closeMenu() {
  document.getElementById('overflow-menu')?.remove()
  document.removeEventListener('mousedown', closeMenuOnOutside)
  menuOpen = false
}

function showPasteTokenDialog() {
  // Remove existing dialog if any
  document.getElementById('paste-dialog')?.remove()

  const overlay = document.createElement('div')
  overlay.id = 'paste-dialog'
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.75);
    display:flex;align-items:center;justify-content:center;z-index:999999;
    font-family:-apple-system,BlinkMacSystemFont,sans-serif;
  `
  overlay.innerHTML = `
    <div style="background:#1e1e1e;border:1px solid #333;border-radius:12px;padding:24px;width:320px;box-shadow:0 10px 40px rgba(0,0,0,0.8);">
      <h3 style="margin:0 0 8px 0;color:#fff;font-size:16px;">Connect Manually</h3>
      <p style="margin:0 0 16px 0;color:#aaa;font-size:12px;line-height:1.4;">
        Open the session page in your browser, copy the auth token, and paste it here.
      </p>
      <label style="display:block;margin-bottom:4px;color:#ccc;font-size:11px;">Auth Token</label>
      <textarea id="pt-token" style="width:100%;height:60px;background:#111;color:#fff;border:1px solid #333;border-radius:6px;padding:8px;margin-bottom:12px;font-family:monospace;font-size:10px;resize:none;" placeholder="Paste token here..."></textarea>
      
      <label style="display:block;margin-bottom:4px;color:#ccc;font-size:11px;">Session ID (from URL)</label>
      <input id="pt-session" type="text" style="width:100%;background:#111;color:#fff;border:1px solid #333;border-radius:6px;padding:8px;margin-bottom:20px;font-family:monospace;font-size:11px;" placeholder="e.g. 550e8400-e29b-41d4-a716..." />
      
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button id="pt-cancel" style="background:transparent;color:#aaa;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;">Cancel</button>
        <button id="pt-confirm" style="background:#3b82f6;color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;">Connect</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  // Focus token input
  setTimeout(() => (document.getElementById('pt-token') as HTMLTextAreaElement)?.focus(), 50)

  document.getElementById('pt-cancel')!.onclick = () => overlay.remove()

  document.getElementById('pt-confirm')!.onclick = async () => {
    const token = (document.getElementById('pt-token') as HTMLTextAreaElement).value.trim()
    const sessionId = (document.getElementById('pt-session') as HTMLInputElement).value.trim()

    if (!token) {
      showToast('Token is required', 'error')
      return
    }

    state.token = token
    state.sessionId = sessionId || null
    overlay.remove()

    if (sessionId) {
      showToast('Connecting...', 'success')
      await connectSession(token, sessionId)
    } else {
      showToast('Token saved. Enter session ID to connect.', 'success')
    }
  }

  // Close on backdrop click
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) overlay.remove()
  })
}

function showToast(msg: string, type: 'error'|'warning'|'success' = 'success') {
  const colors = { error:'#ef4444', warning:'#f59e0b', success:'#22c55e' }
  const el = document.createElement('div')
  el.textContent = msg
  el.style.cssText = `
    position:fixed;bottom:8px;left:50%;transform:translateX(-50%);
    background:${colors[type]};color:white;padding:6px 12px;
    border-radius:8px;font-size:11px;z-index:99999;
    pointer-events:none;max-width:400px;text-align:center;
  `
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 4000)
}

// Wait for DOM before calling init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init())
} else {
  init()
}
