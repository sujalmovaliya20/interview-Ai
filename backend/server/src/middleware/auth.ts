import { Socket } from 'socket.io'
import { supabase } from '../lib/supabase'
import pino from 'pino'

const logger = pino()

export const authMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  console.log('[Auth] Bypassing auth for local dev')
  socket.data.userId = '00000000-0000-0000-0000-000000000000'
  socket.data.userEmail = 'dev@local.host'
  next()
}

