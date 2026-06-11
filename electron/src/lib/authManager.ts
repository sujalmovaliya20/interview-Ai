export class AuthManager {
  private token: string | null = null
  private sessionId: string | null = null

  handleDeepLink(url: string, windowManager: any, socketClient: any): void {
    try {
      console.log('[Auth] handleDeepLink called')
      console.log('[Auth] Raw URL (first 80 chars):', url.slice(0, 80))

      // FIX D: interviewai:// is not a valid URL scheme for the URL constructor
      // Replace scheme with http:// for parsing only
      const parseableUrl = url
        .replace(/^interviewai:\/\/\//, 'http://interviewai.app/')  // triple slash
        .replace(/^interviewai:\/\//, 'http://interviewai.app/')     // double slash

      const urlObj = new URL(parseableUrl)
      const rawToken = urlObj.searchParams.get('token')
      const rawSessionId = urlObj.searchParams.get('sessionId')

      if (!rawToken) {
        console.error('[Auth] No token found in URL params')
        console.error('[Auth] Params were:', urlObj.searchParams.toString().slice(0, 100))
        return
      }

      // FIX A: decode URI components — token was encoded with encodeURIComponent
      const token = decodeURIComponent(rawToken)
      const sessionId = rawSessionId ? decodeURIComponent(rawSessionId) : null

      console.log('[Auth] Token decoded successfully, length:', token.length)
      console.log('[Auth] SessionId:', sessionId)

      this.token = token
      this.sessionId = sessionId

      // Bring overlay to front
      windowManager.showToolbar()
      windowManager.expandToolbar()

      // Send to toolbar renderer
      windowManager.getToolbar()?.webContents.send('auth-received', {
        token,
        sessionId
      })

      // Auto-connect if session ID present
      if (sessionId) {
        console.log('[Auth] SessionId found — auto-connecting socket')
        socketClient.connect(token, sessionId).then((connected: boolean) => {
          console.log('[Auth] Socket auto-connect:', connected ? 'SUCCESS' : 'FAILED')
          if (!connected) {
            windowManager.getToolbar()?.webContents.send('socket-status', 'error')
          }
        })
      } else {
        console.log('[Auth] No sessionId in deep link — awaiting session selection')
        windowManager.getToolbar()?.webContents.send('auth-received', { token, sessionId: null })
      }

    } catch (err: any) {
      console.error('[Auth] handleDeepLink error:', err.message)
      console.error('[Auth] Problematic URL was:', url.slice(0, 120))
    }
  }

  setSession(token: string, sessionId: string | null): void {
    this.token = token
    this.sessionId = sessionId
  }

  getToken(): string | null { return this.token }
  getSessionId(): string | null { return this.sessionId }
  clearAuth(): void { this.token = null; this.sessionId = null }
}
