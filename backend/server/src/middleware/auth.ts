import { Socket } from 'socket.io'
import { supabase } from '../lib/supabase'
import pino from 'pino'

const logger = pino()

export const authMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token

  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auth] Bypassing auth for local dev')
      socket.data.userId = '00000000-0000-0000-0000-000000000000'
      socket.data.userEmail = 'dev@local.host'
      return next()
    }
    return next(new Error('Authentication token required'))
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      logger.warn({ error }, 'Unauthorized WebSocket connection attempt')
      return next(new Error('Invalid or expired authentication token'))
    }

    socket.data.userId = user.id
    socket.data.userEmail = user.email || ''
    next()
  } catch (err: any) {
    logger.error(err, 'WebSocket authentication exception')
    next(new Error('Internal server error during authentication'))
  }
}

