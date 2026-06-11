import { desktopCapturer, ipcMain } from 'electron'
import { WindowManager } from './windowManager'

export class AudioCaptureManager {
  private isCapturing = false

  /**
   * Get system audio source for renderer.
   * Renderer uses this sourceId with getUserMedia to capture system audio.
   * Requires Screen Recording permission on Mac.
   */
  async getSystemAudioSource(): Promise<{ id: string; name: string } | null> {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 0, height: 0 }  // skip thumbnails for performance
      })
      
      const source = sources[0]
      if (source) {
        // MUST NOT return the full source object because it contains NativeImage properties 
        // which cannot be serialized over IPC and will cause 'bad IPC message, reason 263' crash
        return { id: source.id, name: source.name }
      }
      return null
    } catch (err) {
      console.error('Failed to get audio sources:', err)
      return null
    }
  }

  /**
   * Check if screen recording permission is granted (Mac only).
   * On Windows/Linux always returns true.
   */
  async checkPermission(): Promise<'granted' | 'denied' | 'not-determined'> {
    if (process.platform !== 'darwin') return 'granted'
    const { systemPreferences } = await import('electron')
    const status = systemPreferences.getMediaAccessStatus('screen')
    if (status === 'granted') return 'granted'
    if (status === 'denied') return 'denied'
    return 'not-determined'
  }
}
