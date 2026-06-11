import { Server, Socket } from 'socket.io'
import { redis } from '../lib/redis'
import { supabase } from '../lib/supabase'
import { RedisSubscriber } from '../lib/redisSubscriber'
import pino from 'pino'
import fs from 'fs'

const logger = pino({ level: 'debug' })

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function registerSessionHandlers(io: Server, socket: Socket, redisSubscriber: RedisSubscriber) {
  const userId = socket.data.userId

  socket.on('join_session', async (payload: { sessionId: string }) => {
    try {
      const { sessionId } = payload
      
      if (!sessionId || !UUID_REGEX.test(sessionId)) {
        return socket.emit('session_error', { message: 'Invalid session ID format' })
      }

      // BYPASS SUPABASE FOR LOCAL DEV
      const session = {
        status: 'active',
        language: 'en',
        extra_context: '',
        role_hint: '',
        user_id: userId
      }

      const roomName = `session:${sessionId}`
      socket.join(roomName)
      
      // Store session metadata in Redis for Python workers
      if (session.language) {
        await redis.setex(`session:language:${sessionId}`, 3600, session.language)
      }
      await redis.setex(`session:user_id:${sessionId}`, 3600, session.user_id)
      if (session.extra_context) {
        await redis.setex(`session:extra_context:${sessionId}`, 3600, session.extra_context)
      }
      if (session.role_hint) {
        await redis.setex(`session:role_hint:${sessionId}`, 3600, session.role_hint)
      }
      
      // Subscribe to Python worker outputs
      await redisSubscriber.subscribeToSession(sessionId)

      logger.info({ userId, sessionId }, 'User joined session')
      socket.emit('session_joined', { sessionId, status: session.status })
    } catch (error) {
      logger.error(error, 'Error joining session')
      socket.emit('session_error', { message: 'Internal server error' })
    }
  })

  socket.on('audio_chunk', async (chunk: ArrayBuffer) => {
    try {
      logger.debug('Received audio_chunk size: ' + chunk.byteLength)
      const room = Array.from(socket.rooms).find(r => r.startsWith('session:'))
      if (!room) {
        logger.debug('No room found for socket!')
        return
      }

      const sessionId = room.split(':')[1]
      logger.debug('Room found: ' + sessionId)

      if (!chunk || chunk.byteLength < 100 || chunk.byteLength > 500000) {
        logger.debug('Invalid chunk size')
        return // Silently ignore invalid chunks
      }

      const queueKey = `audio:queue:${sessionId}`
      await redis.lpush(queueKey, Buffer.from(chunk))
      await redis.ltrim(queueKey, 0, 99) // Max 100 chunks
      
      // Notify python workers there is a chunk for this session
      await redis.lpush('audio:routing', sessionId)
      
      logger.debug('Pushed to redis and audio:routing')
    } catch (error) {
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
      await redisSubscriber.unsubscribeFromSession(sessionId)

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

  socket.on('manual_answer', async (payload: { sessionId: string; text: string }) => {
    const { sessionId, text } = payload
    if (!sessionId || !text) return

    // Verify session ownership
    const sessionRoom = `session:${sessionId}`
    if (!socket.rooms.has(sessionRoom)) {
      socket.emit('session_error', { code: 'NOT_IN_SESSION', message: 'Not in this session' })
      return
    }

    // Push manual question to Redis audio routing queue as a text override
    // The Python worker will treat this as a detected question and generate an answer
    await redis.set(`session:manual_question:${sessionId}`, text, 'EX', 30)
    await redis.publish(`transcripts:${sessionId}`, JSON.stringify({
      type: 'transcript_delta',
      sessionId,
      text: text,
      isFinal: true,
      timestamp: Date.now(),
      provider: 'manual'
    }))
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
