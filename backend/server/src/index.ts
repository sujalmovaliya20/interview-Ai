import 'dotenv/config'
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import pino from 'pino'
import { authMiddleware } from './middleware/auth'
import { rateLimitMiddleware } from './middleware/rateLimit'
import { registerSessionHandlers } from './handlers/sessionHandler'
import { redis } from './lib/redis'
import { RedisSubscriber } from './lib/redisSubscriber'

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})

const app = express()
const server = http.createServer(app)

const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,      // Vercel production URL
  process.env.ALLOWED_ORIGIN,           // additional allowed origin
  'http://localhost:3000',              // local dev
  'null'                                // Electron app
].filter(Boolean) as string[]

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow if: no origin, in list, or null (Electron)
      if (!origin || allowedOrigins.includes(origin) || origin === 'null') {
        callback(null, true)
      } else {
        console.warn('[CORS] Blocked:', origin)
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
})

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connections: io.engine.clientsCount,
    timestamp: Date.now()
  })
})

io.use(authMiddleware)
io.use(rateLimitMiddleware)

const redisSubscriber = new RedisSubscriber(io)

io.on('connection', (socket) => {
  logger.info({ socketId: socket.id, userId: socket.data.userId }, 'New socket connection')
  
  registerSessionHandlers(io, socket, redisSubscriber)

  socket.on('disconnect', (reason) => {
    logger.info({ userId: socket.data.userId, reason }, 'Socket disconnected')
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`)
})

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...')
  io.close()
  server.close(async () => {
    await redisSubscriber.cleanup()
    await redis.quit()
    logger.info('Server shutdown complete')
    process.exit(0)
  })
  
  // Force exit if hanging
  setTimeout(() => {
    logger.error('Forcing exit after 10s timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
