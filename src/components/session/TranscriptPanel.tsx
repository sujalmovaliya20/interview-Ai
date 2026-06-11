'use client'

import { useState, useRef, useEffect } from 'react'
import { HelpCircle, ChevronDown, Copy, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TranscriptBlock } from '@/store/sessionStore'
import { toast } from 'sonner'

interface TranscriptPanelProps {
  transcriptBlocks: TranscriptBlock[]
  status: string
}

export function TranscriptPanel({ transcriptBlocks, status }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [userScrolledUp, setUserScrolledUp] = useState(false)
  const [newContentWhileScrolledUp, setNewContentWhileScrolledUp] = useState(false)

  const questionCount = transcriptBlocks.filter(b => b.isQuestion).length

  const handleScroll = () => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setUserScrolledUp(distFromBottom > 80)
    if (distFromBottom <= 80) {
      setNewContentWhileScrolledUp(false)
    }
  }

  useEffect(() => {
    if (!scrollRef.current) return
    if (!userScrolledUp) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    } else {
      setNewContentWhileScrolledUp(true)
    }
  }, [transcriptBlocks, userScrolledUp])

  const jumpToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      setUserScrolledUp(false)
      setNewContentWhileScrolledUp(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied")
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* PANEL HEADER */}
      <div className="h-10 border-b flex items-center justify-between px-3 shrink-0 bg-muted/20">
        <span className="text-sm font-medium text-muted-foreground">Transcript</span>
        {questionCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {questionCount} question{questionCount !== 1 ? 's' : ''} detected
          </span>
        )}
      </div>

      {/* SCROLL AREA */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2 scroll-smooth"
      >
        {transcriptBlocks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Mic className="h-10 w-10 text-muted-foreground/30 mb-3" />
            {status === 'joining' ? (
              <p className="text-sm text-muted-foreground">Connecting to session...</p>
            ) : status === 'paused' ? (
              <p className="text-sm text-muted-foreground">Recording paused</p>
            ) : (
              <p className="text-sm text-muted-foreground">Waiting for audio...</p>
            )}
          </div>
        ) : (
          transcriptBlocks.map(block => (
            <div key={block.id} className="mb-2 group relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background shadow-sm border"
                onClick={() => handleCopy(block.text)}
              >
                <Copy className="h-3 w-3" />
              </Button>

              {block.isQuestion ? (
                <div className="rounded-lg p-2 bg-primary/5 border-l-2 border-primary">
                  <div className="text-sm text-primary font-medium flex items-start gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span className="leading-tight">
                      {block.text}
                      {!block.isFinal && <span className="streaming-cursor opacity-60"></span>}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground/60 pl-5">
                    {new Date(block.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
              ) : (
                <div className="px-1 py-0.5">
                  <span className={`text-sm ${!block.isFinal ? 'italic opacity-60' : 'text-muted-foreground'}`}>
                    {block.text}
                    {!block.isFinal && <span className="streaming-cursor"></span>}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* JUMP TO BOTTOM BUTTON */}
      {userScrolledUp && newContentWhileScrolledUp && (
        <div className="absolute bottom-4 right-3 z-10">
          <Button
            size="sm"
            onClick={jumpToBottom}
            className="rounded-full shadow-md animate-in fade-in slide-in-from-bottom-2 flex items-center gap-1 h-8"
          >
            <ChevronDown className="h-4 w-4" />
            <span className="text-xs">New</span>
          </Button>
        </div>
      )}
    </div>
  )
}
