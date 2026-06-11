import { globalShortcut, ipcMain } from 'electron'
import { WindowManager } from './windowManager'
import { SocketClient } from './socketClient'

export class ShortcutManager {
  constructor(
    private windowManager: WindowManager,
    private socketClient: SocketClient
  ) {}

  register(): void {
    // Cmd+Enter — manual AI answer trigger
    globalShortcut.register('CommandOrControl+Return', () => {
      console.log('[Shortcut] Manual AI trigger')
      // Get transcript from toolbar renderer
      this.windowManager.getToolbar()?.webContents.send('shortcut-trigger-ai', {})
      this.windowManager.showAnswerPanel()
    })

    // Cmd+Shift+Enter — analyze screen
    globalShortcut.register('CommandOrControl+Shift+Return', () => {
      console.log('[Shortcut] Analyze screen')
      this.windowManager.getToolbar()?.webContents.send('shortcut-analyze-screen', {})
    })

    // Move toolbar
    globalShortcut.register('CommandOrControl+Up', () => {
      this.windowManager.moveToolbar('up', 20)
    })
    globalShortcut.register('CommandOrControl+Down', () => {
      this.windowManager.moveToolbar('down', 20)
    })
    globalShortcut.register('CommandOrControl+Shift+Up', () => {
      this.windowManager.moveToolbar('up', 5)
    })
    globalShortcut.register('CommandOrControl+Shift+Down', () => {
      this.windowManager.moveToolbar('down', 5)
    })

    // Navigate answers
    globalShortcut.register('CommandOrControl+Right', () => {
      this.windowManager.getAnswerPanel()?.webContents.send('navigate-answer', { dir: 1 })
    })
    globalShortcut.register('CommandOrControl+Left', () => {
      this.windowManager.getAnswerPanel()?.webContents.send('navigate-answer', { dir: -1 })
    })

    // Show/hide
    globalShortcut.register('CommandOrControl+Shift+H', () => {
      const toolbar = this.windowManager.getToolbar()
      if (toolbar?.isVisible()) {
        toolbar.hide()
        this.windowManager.hideAnswerPanel()
      } else {
        toolbar?.show()
      }
    })
  }

  unregister(): void { globalShortcut.unregisterAll() }
}
