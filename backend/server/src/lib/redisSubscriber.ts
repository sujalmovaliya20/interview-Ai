import { Redis } from 'ioredis'
import { Server } from 'socket.io'
import pino from 'pino'

const logger = pino()

export class RedisSubscriber {
  private subscriber: Redis
  private io: Server
  private activeSubscriptions: Map<string, boolean>

  constructor(io: Server) {
    this.io = io
    this.activeSubscriptions = new Map()
    
    this.subscriber = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      enableOfflineQueue: false,
    })
    
    this.subscriber.on('message', (channel, message) => {
      try {
        const payload = JSON.parse(message)
        const sessionId = channel.split(':')[1]
        
        if (payload.type === 'transcript_delta') {
          this.io.to('session:' + sessionId).emit('transcript_delta', {
            text: payload.text,
            isFinal: payload.isFinal,
            timestamp: payload.timestamp,
            provider: payload.provider,
            language: payload.language,
            latency_ms: payload.latency_ms
          })
        } else if (payload.type === 'transcription_error') {
          this.io.to('session:' + sessionId).emit('session_error', {
            code: 'TRANSCRIPTION_ERROR',
            message: payload.error,
            retryable: true
          })
        } else if (payload.type === 'answer_delta') {
          this.io.to('session:' + sessionId).emit('answer_delta', {
            id: payload.answerId,
            text: payload.text,
            isStreaming: payload.isStreaming,
            modelUsed: payload.modelUsed,
            timestamp: payload.timestamp
          })
        } else if (payload.type === 'answer_done') {
          this.io.to('session:' + sessionId).emit('answer_done', {
            id: payload.answerId,
            isStreaming: payload.isStreaming,
            timestamp: payload.timestamp
          })
        } else if (payload.type === 'answer_error') {
          this.io.to('session:' + sessionId).emit('session_error', {
            code: 'ANSWER_ERROR',
            message: payload.error,
            retryable: true
          })
        }
      } catch (err) {
        logger.error({ err, message }, 'Failed to process pub/sub message')
      }
    })
    
    this.subscriber.on('error', (err) => {
      logger.error(err, 'Redis subscriber error')
    })
  }

  async subscribeToSession(sessionId: string): Promise<void> {
    const transcriptChannel = `transcripts:${sessionId}`
    const answerChannel = `answers:${sessionId}`
    
    if (!this.activeSubscriptions.has(transcriptChannel)) {
      await this.subscriber.subscribe(transcriptChannel, answerChannel)
      this.activeSubscriptions.set(transcriptChannel, true)
      this.activeSubscriptions.set(answerChannel, true)
      logger.info({ sessionId }, 'Subscribed to session transcripts and answers')
    }
  }

  async unsubscribeFromSession(sessionId: string): Promise<void> {
    const transcriptChannel = `transcripts:${sessionId}`
    const answerChannel = `answers:${sessionId}`
    
    if (this.activeSubscriptions.has(transcriptChannel)) {
      await this.subscriber.unsubscribe(transcriptChannel, answerChannel)
      this.activeSubscriptions.delete(transcriptChannel)
      this.activeSubscriptions.delete(answerChannel)
      logger.info({ sessionId }, 'Unsubscribed from session transcripts and answers')
    }
  }

  async cleanup(): Promise<void> {
    const channels = Array.from(this.activeSubscriptions.keys())
    if (channels.length > 0) {
      await this.subscriber.unsubscribe(...channels)
    }
    this.activeSubscriptions.clear()
    this.subscriber.quit()
  }
}
