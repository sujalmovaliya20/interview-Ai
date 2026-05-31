import Redis from 'ioredis'
import pino from 'pino'

const logger = pino()

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(REDIS_URL, {
  retryStrategy: (times) => {
    logger.warn(`Redis connection retrying (attempt ${times})...`)
    return Math.min(times * 50, 2000)
  }
})

redis.on('connect', () => {
  logger.info('Redis connected successfully')
})

redis.on('error', (err) => {
  logger.error(err, 'Redis connection error')
})
