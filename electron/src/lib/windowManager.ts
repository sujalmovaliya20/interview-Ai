import { BrowserWindow, screen } from 'electron'

declare const TOOLBAR_WEBPACK_ENTRY: string;
declare const ANSWER_PANEL_WEBPACK_ENTRY: string;
declare const TOOLBAR_PRELOAD_WEBPACK_ENTRY: string;
declare const ANSWER_PANEL_PRELOAD_WEBPACK_ENTRY: string;

export class WindowManager {
  private toolbar: BrowserWindow | null = null
  private answerPanel: BrowserWindow | null = null
  private transcriptStrip: BrowserWindow | null = null

  async createToolbar(): Promise<BrowserWindow> {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width } = primaryDisplay.workAreaSize
    const scaleFactor = primaryDisplay.scaleFactor || 1

    // Account for Windows DPI scaling
    const toolbarWidth = 520
    const toolbarHeight = 44
    const xPos = Math.floor((width - toolbarWidth) / 2)
    const yPos = 12  // 12px from top

    console.log('[WindowManager] Creating toolbar at:', xPos, yPos,
      'scale:', scaleFactor, 'display width:', width)

    this.toolbar = new BrowserWindow({
      width: toolbarWidth,
      height: toolbarHeight,
      x: xPos,
      y: yPos,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      hasShadow: false,
      resizable: false,
      movable: true,           // ← allow dragging
      focusable: true,         // ← START focusable (fix later)
      show: false,             // ← start hidden, show after load
      webPreferences: {
        preload: TOOLBAR_PRELOAD_WEBPACK_ENTRY,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        devTools: true          // ← enable for debugging
      }
    })

    // Load the toolbar HTML
    await this.toolbar.loadURL(TOOLBAR_WEBPACK_ENTRY)

    // CRITICAL ORDER — must be: load → show → setContentProtection → setIgnoreMouseEvents
    // Wrong order = invisible window

    // Step 1: Show window FIRST (must happen before content protection)
    this.toolbar.show()
    console.log('[WindowManager] Toolbar shown')

    // Step 2: Set always on top AFTER show
    this.toolbar.setAlwaysOnTop(true, 'screen-saver', 1)

    // Step 3: Content protection AFTER show (before = invisible on some Windows)
    this.toolbar.setContentProtection(true)

    // Step 4: Mouse passthrough AFTER show
    this.toolbar.setIgnoreMouseEvents(true, { forward: true })

    console.log('[WindowManager] Toolbar bounds:', this.toolbar.getBounds())
    return this.toolbar
  }

  async createAnswerPanel(): Promise<BrowserWindow> {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width } = primaryDisplay.workAreaSize

    const toolbarBounds = this.toolbar?.getBounds()
    const xPos = toolbarBounds?.x ?? Math.floor((width - 520) / 2)
    const yPos = (toolbarBounds?.y ?? 12) + (toolbarBounds?.height ?? 44) + 4

    this.answerPanel = new BrowserWindow({
      width: 520,
      height: 400,
      x: xPos,
      y: yPos,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      hasShadow: false,
      resizable: false,
      focusable: true,
      show: false,            // hidden until needed
      webPreferences: {
        preload: ANSWER_PANEL_PRELOAD_WEBPACK_ENTRY,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        devTools: true
      }
    })

    await this.answerPanel.loadURL(ANSWER_PANEL_WEBPACK_ENTRY)
    this.answerPanel.setAlwaysOnTop(true, 'screen-saver', 1)
    // Do NOT show() here — shown only when answer arrives
    console.log('[WindowManager] Answer panel created (hidden)')
    return this.answerPanel
  }

  showToolbar(): void {
    if (!this.toolbar || this.toolbar.isDestroyed()) return
    this.toolbar.show()
    this.toolbar.setAlwaysOnTop(true, 'screen-saver', 1)
    this.toolbar.focus()
    console.log('[WindowManager] showToolbar called, bounds:', this.toolbar.getBounds())
  }

  showAnswerPanel(): void {
    if (!this.answerPanel || this.answerPanel.isDestroyed()) return
    if (this.answerPanel.isVisible() && this.answerPanel.getSize()[1] > 100) {
      return // Already shown
    }
    
    const toolbarBounds = this.toolbar?.getBounds()
    if (toolbarBounds) {
      this.answerPanel.setPosition(
        toolbarBounds.x,
        toolbarBounds.y + toolbarBounds.height + 4
      )
    }
    this.answerPanel.setSize(520, 380)
    this.answerPanel.show()
    this.answerPanel.setAlwaysOnTop(true, 'screen-saver', 1)
    this.answerPanel.setIgnoreMouseEvents(false)
    this.answerPanel.setFocusable(true)
    console.log('[WindowManager] Answer panel shown')
  }

  hideAnswerPanel(): void {
    if (!this.answerPanel) return
    this.answerPanel.hide()
    this.answerPanel.setSize(520, 0)
  }

  // Make toolbar interactive on hover
  setToolbarInteractive(interactive: boolean): void {
    if (!this.toolbar) return
    if (interactive) {
      this.toolbar.setIgnoreMouseEvents(false)
      this.toolbar.setFocusable(true)
    } else {
      this.toolbar.setIgnoreMouseEvents(true, { forward: true })
      this.toolbar.setFocusable(false)
    }
  }

  moveToolbar(direction: 'up'|'down'|'left'|'right', amount: number = 20): void {
    if (!this.toolbar) return
    const bounds = this.toolbar.getBounds()
    const newBounds = { ...bounds }
    if (direction === 'up') newBounds.y -= amount
    if (direction === 'down') newBounds.y += amount
    if (direction === 'left') newBounds.x -= amount
    if (direction === 'right') newBounds.x += amount
    this.toolbar.setBounds(newBounds)
    // Move answer panel to follow
    if (this.answerPanel?.isVisible()) {
      this.answerPanel.setBounds({
        ...this.answerPanel.getBounds(),
        x: newBounds.x,
        y: newBounds.y + newBounds.height + 4
      })
    }
  }

  collapseToolbar(): void {
    if (!this.toolbar) return
    this.toolbar.setSize(16, 16)
    // Show tiny dot indicator in tray instead
  }

  expandToolbar(): void {
    if (!this.toolbar) return
    this.toolbar.setSize(520, 44)
  }

  getToolbar() { return this.toolbar }
  getAnswerPanel() { return this.answerPanel }
}
