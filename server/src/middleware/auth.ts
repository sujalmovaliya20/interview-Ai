import { Socket } from 'socket.io'
import { supabase } from '../lib/supabase'
import pino from 'pino'

const logger = pino()

export const authMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token
    if (!token) {
      logger.warn('Socket connection attempt without token')
      return next(new Error('UNAUTHORIZED'))
    }

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      logger.warn({ error }, 'Socket auth failed: Invalid token')
      return next(new Error('UNAUTHORIZED'))
    }

    socket.data.userId = user.id
    socket.data.userEmail = user.email

    logger.info({ userId: user.id }, 'Socket authenticated successfully')
    next()
  } catch (error) {
    logger.error(error, 'Unexpected error in auth middleware')
    next(new Error('UNAUTHORIZED'))
  }
}
