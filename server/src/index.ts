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

const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

app.use(cors({
  origin: [NEXT_PUBLIC_APP_URL, 'http://localhost:3000']
}))

const io = new Server(server, {
  cors: {
    origin: [NEXT_PUBLIC_APP_URL, 'http://localhost:3000'],
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

io.on('connection', (socket) => {
  logger.info({ socketId: socket.id, userId: socket.data.userId }, 'New socket connection')
  
  registerSessionHandlers(io, socket, redis)
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
