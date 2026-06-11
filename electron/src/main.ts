import { app, BrowserWindow, screen, protocol } from 'electron'
import path from 'path'
import { WindowManager } from './lib/windowManager'
import { TrayManager } from './lib/trayManager'
import { ShortcutManager } from './lib/shortcutManager'
import { AudioCaptureManager } from './lib/audioCapture'
import { registerIpcHandlers } from './lib/ipcHandlers'
import { AuthManager } from './lib/authManager'
import { SocketClient } from './lib/socketClient'

// Handle Squirrel (Windows)
if (require('electron-squirrel-startup')) app.quit()

// Single instance
if (!app.requestSingleInstanceLock()) app.quit()

if (process.platform === 'win32') {
  app.setAsDefaultProtocolClient(
    'interviewai',
    process.execPath,
    app.isPackaged ? [] : [path.resolve(process.argv[1] || '')]
  )
} else {
  app.setAsDefaultProtocolClient('interviewai')
}

// Instantiate all services
const windowManager = new WindowManager()
const trayManager = new TrayManager(windowManager)
const audioCapture = new AudioCaptureManager()
const authManager = new AuthManager()
const socketClient = new SocketClient()
socketClient.setWindowManager(windowManager)
const shortcutManager = new ShortcutManager(windowManager, socketClient)

function getDeepLinkFromArgv(argv: string[]): string | undefined {
  // Deep link is the last arg starting with 'interviewai://'
  return [...argv].reverse().find(arg => arg.startsWith('interviewai://'))
}

app.whenReady().then(async () => {
  // Register IPC FIRST
  registerIpcHandlers(windowManager, trayManager, audioCapture, authManager, socketClient)
  shortcutManager.register()

  // Create windows
  await windowManager.createToolbar()
  await windowManager.createAnswerPanel()

  // Create tray
  trayManager.create()

  // Start hover detection AFTER windows created
  // Small delay ensures windows are fully shown
  setTimeout(() => startHoverDetection(windowManager), 500)

  // Check cold start deep link (Windows)
  const coldStartUrl = getDeepLinkFromArgv(process.argv)
  if (coldStartUrl) {
    console.log('[Main] Cold start deep link detected')
    setTimeout(() => {
      authManager.handleDeepLink(coldStartUrl, windowManager, socketClient)
    }, 1000)
  }
})

// Mac deep link
app.on('open-url', (event, url) => {
  event.preventDefault()
  authManager.handleDeepLink(url, windowManager, socketClient)
})

// Windows deep link (second instance)
app.on('second-instance', (_event, argv, _workingDir) => {
  console.log('[Main] Second instance, argv count:', argv.length)
  // Windows warm start: deep link URL passed in argv
  const url = getDeepLinkFromArgv(argv)
  if (url) {
    console.log('[Main] Second instance deep link:', url.slice(0, 60))
    authManager.handleDeepLink(url, windowManager, socketClient)
  }
  // Always bring window to front
  const toolbar = windowManager.getToolbar()
  if (toolbar) {
    if (toolbar.isMinimized()) toolbar.restore()
    toolbar.show()
    toolbar.setAlwaysOnTop(true, 'screen-saver')
    toolbar.focus()
  }
})

app.on('window-all-closed', () => {
  // Do nothing
})
app.on('will-quit', () => shortcutManager.unregister())

function startHoverDetection(wm: WindowManager) {
  console.log('[Main] Starting hover detection')
  const interval = setInterval(() => {
    const toolbar = wm.getToolbar()
    if (!toolbar || toolbar.isDestroyed()) {
      clearInterval(interval)
      return
    }
    // Only run if toolbar is visible
    if (!toolbar.isVisible()) return

    try {
      const cursor = screen.getCursorScreenPoint()
      const bounds = toolbar.getBounds()
      const isOver = (
        cursor.x >= bounds.x && cursor.x <= bounds.x + bounds.width &&
        cursor.y >= bounds.y && cursor.y <= bounds.y + bounds.height
      )
      toolbar.setIgnoreMouseEvents(!isOver, { forward: true })
    } catch (e) {
      // Ignore errors during window destruction
    }
  }, 80)

  // Clean up on quit
  app.on('will-quit', () => clearInterval(interval))
}
