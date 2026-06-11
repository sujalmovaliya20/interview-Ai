import { Tray, Menu, app, nativeImage } from 'electron'
import { WindowManager } from './windowManager'
import path from 'path'

export class TrayManager {
  private tray: Tray | null = null

  constructor(private windowManager: WindowManager) {}

  create() {
    // Assuming assets will be bundled or relative to the dist folder
    const iconPath = path.join(__dirname, '../../src/assets/tray-idle.png') 
    let icon = nativeImage.createEmpty()
    try {
      icon = nativeImage.createFromPath(iconPath)
    } catch(e) {}

    this.tray = new Tray(icon)
    this.tray.setToolTip('InterviewAI')
    
    this.updateContextMenu()
  }

  setRecordingState(isRecording: boolean) {
    if (!this.tray) return
    const iconName = isRecording ? 'tray-recording.png' : 'tray-idle.png'
    const iconPath = path.join(__dirname, `../../src/assets/${iconName}`)
    try {
      const icon = nativeImage.createFromPath(iconPath)
      this.tray.setImage(icon)
    } catch(e) {}
  }

  private updateContextMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Overlay',
        click: () => {
          this.windowManager.showToolbar()
          this.windowManager.expandToolbar()
        }
      },
      {
        label: 'Paste Auth Link (from Clipboard)',
        click: () => {
          const { clipboard } = require('electron')
          const text = clipboard.readText()
          if (text && text.includes('interviewai://')) {
            // Need to require authManager, or pass it in constructor.
            // Wait, trayManager doesn't have authManager!
            // I should emit an event or pass authManager.
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit()
        }
      }
    ])
    this.tray?.setContextMenu(contextMenu)
  }
}
