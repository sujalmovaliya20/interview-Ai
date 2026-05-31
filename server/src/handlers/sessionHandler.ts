import { Server, Socket } from 'socket.io'
import { Redis } from 'ioredis'
import { supabase } from '../lib/supabase'
import pino from 'pino'
import fs from 'fs'

const logger = pino()
const debugLog = (msg: string) => fs.appendFileSync('d:/Aiinterview/server_debug.log', new Date().toISOString() + ': ' + msg + '\n')

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function registerSessionHandlers(io: Server, socket: Socket, redis: Redis) {
  const userId = socket.data.userId

  socket.on('join_session', async (payload: { sessionId: string }) => {
    try {
      const { sessionId } = payload
      
      if (!sessionId || !UUID_REGEX.test(sessionId)) {
        socket.emit('session_error', { code: 'INVALID_SESSION_ID', message: 'Invalid session ID format' })
        return
      }

      const { data: session, error } = await supabase
        .from('sessions')
        .select('id, user_id, status')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single()

      if (error || !session) {
        socket.emit('session_error', { code: 'SESSION_NOT_FOUND', message: 'Session not found or access denied' })
        return
      }

      if (session.status === 'completed') {
        socket.emit('session_error', { code: 'SESSION_ENDED', message: 'This session has already ended' })
        return
      }

      const roomName = `session:${sessionId}`
      socket.join(roomName)

      await redis.setex(`session:active:${sessionId}`, 3600, userId)

      socket.emit('session_joined', { sessionId, joinedAt: Date.now() })
      logger.info({ userId, sessionId }, 'User joined session')
    } catch (error) {
      logger.error(error, 'Error joining session')
      socket.emit('session_error', { code: 'INTERNAL_ERROR', message: 'An internal error occurred' })
    }
  })

  socket.on('audio_chunk', async (chunk: ArrayBuffer) => {
    try {
      debugLog('Received audio_chunk size: ' + chunk.byteLength)
      const room = Array.from(socket.rooms).find(r => r.startsWith('session:'))
      if (!room) {
        debugLog('No room found for socket!')
        return
      }

      const sessionId = room.split(':')[1]
      debugLog('Room found: ' + sessionId)

      if (!chunk || chunk.byteLength < 100 || chunk.byteLength > 500000) {
        debugLog('Invalid chunk size')
        return // Silently ignore invalid chunks
      }

      const queueKey = `audio:queue:${sessionId}`
      await redis.lpush(queueKey, Buffer.from(chunk))
      await redis.ltrim(queueKey, 0, 99) // Max 100 chunks
      debugLog('Pushed to redis, setting timeout for transcript_delta')

      // Phase 3 MOCK TRANSCRIPTION
      setTimeout(() => {
        debugLog('Emitting transcript_delta to ' + room)
        io.to(room).emit('transcript_delta', {
          text: '[Transcribing...] ' + new Date().toISOString(),
          isFinal: true,
          timestamp: Date.now()
        })
      }, 300)
    } catch (error) {
      debugLog('Error processing chunk: ' + error)
      logger.error(error, 'Error processing audio chunk')
    }
  })

  socket.on('end_session', async (payload: { sessionId: string }) => {
    try {
      const { sessionId } = payload
      if (!sessionId || !UUID_REGEX.test(sessionId)) return

      const { data: session } = await supabase
        .from('sessions')
        .select('created_at, user_id')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single()

      if (!session) return

      const createdAt = new Date(session.created_at).getTime()
      const durationSeconds = Math.floor((Date.now() - createdAt) / 1000)

      await supabase
        .from('sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds
        })
        .eq('id', sessionId)

      await redis.del(`session:active:${sessionId}`, `audio:queue:${sessionId}`)

      const roomName = `session:${sessionId}`
      socket.leave(roomName)
      socket.emit('session_ended', { sessionId, duration: durationSeconds })
      io.socketsLeave(roomName)

      logger.info({ userId, sessionId, durationSeconds }, 'Session ended')
    } catch (error) {
      logger.error(error, 'Error ending session')
    }
  })

  socket.on('ping_session', async (payload: { sessionId: string }) => {
    const { sessionId } = payload
    if (sessionId && UUID_REGEX.test(sessionId)) {
      await redis.expire(`session:active:${sessionId}`, 3600)
      socket.emit('pong_session', { timestamp: Date.now() })
    }
  })

  socket.on('disconnect', () => {
    logger.info({ userId, reason: socket.disconnected }, 'Socket disconnected')
    // Find active session room
    const sessionRoom = Array.from(socket.rooms).find(r => r.startsWith('session:'))
    if (sessionRoom) {
      // In a real app we might handle sudden drops differently
      socket.emit('session_error', { code: 'DISCONNECTED', message: 'Socket disconnected unexpectedly' })
    }
  })
}
