import { Socket } from 'socket.io'

// Simple in-memory rate limiter for audio chunks
const RATE_LIMIT_MS = 200
const socketTimestamps = new Map<string, number>()

export const rateLimitMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  socket.use(([event, ...args], evtNext) => {
    if (event === 'audio_chunk') {
      const now = Date.now()
      const last = socketTimestamps.get(socket.id) || 0
      
      if (now - last < RATE_LIMIT_MS) {
        // Emit error back without throwing next(Error) to keep connection alive
        socket.emit('rate_limit_exceeded', { message: 'Too many audio chunks' })
        return // Stop propagation
      }
      socketTimestamps.set(socket.id, now)
    }
    evtNext()
  })

  socket.on('disconnect', () => {
    socketTimestamps.delete(socket.id)
  })

  next()
}
