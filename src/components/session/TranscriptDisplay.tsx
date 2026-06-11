'use client'

import { useEffect, useRef, useState } from 'react'
import { useSessionStore } from '@/store/sessionStore'
import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TranscriptDisplay() {
  const blocks = useSessionStore(state => state.transcriptBlocks)
  const isPaused = useSessionStore(state => state.isPaused)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [hasNewContent, setHasNewContent] = useState(false)

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    setAutoScroll(isAtBottom)
    if (isAtBottom) {
      setHasNewContent(false)
    }
  }

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    } else if (!autoScroll && blocks.length > 0) {
      setHasNewContent(true)
    }
  }, [blocks, autoScroll])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      setAutoScroll(true)
      setHasNewContent(false)
    }
  }

  if (blocks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center h-full">
        <div className="flex gap-1 items-center mb-4">
          <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"></span>
          <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse delay-75"></span>
          <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse delay-150"></span>
        </div>
        <p>Waiting for audio...</p>
      </div>
    )
  }

  return (
    <div className="relative flex-1 flex flex-col h-full min-h-0">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {blocks.map((block) => (
          <div 
            key={block.id}
            className={`p-3 rounded-md transition-all ${
              block.isQuestion 
                ? 'border-l-4 border-primary bg-primary/5 text-foreground font-medium' 
                : 'text-muted-foreground'
            } ${!block.isFinal ? 'italic opacity-70' : ''}`}
          >
            <p className="whitespace-pre-wrap leading-relaxed">
              {block.text}
              {block.isFinal && process.env.NODE_ENV === 'development' && block.provider && (
                <span 
                  className={`ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium border
                    ${block.provider === 'whisper' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                    }`}
                  title={`Transcribed by ${block.provider === 'whisper' ? 'Whisper' : 'Deepgram (Fallback)'} in ${block.latency_ms?.toFixed(0)}ms`}
                >
                  {block.provider === 'whisper' ? 'W' : 'D'}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {hasNewContent && !autoScroll && isPaused && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Button 
            size="sm" 
            variant="secondary" 
            className="rounded-full shadow-md"
            onClick={scrollToBottom}
          >
            <ArrowDown className="mr-2 h-4 w-4" />
            New transcript
          </Button>
        </div>
      )}
    </div>
  )
}
