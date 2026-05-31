'use client'

import { useEffect, useRef, useState } from 'react'
import { useSessionStore } from '@/store/sessionStore'
import { Sparkles, ArrowDown, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css' // We can include highlight CSS directly
import { toast } from 'sonner'

export function AnswerPanel() {
  const blocks = useSessionStore(state => state.answerBlocks)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [hasNewContent, setHasNewContent] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (blocks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center h-full">
        <Sparkles className="h-8 w-8 mb-4 opacity-50" />
        <p>Answers will appear here</p>
      </div>
    )
  }

  return (
    <div className="relative flex-1 flex flex-col h-full min-h-0">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/10"
      >
        {blocks.map((block) => (
          <div key={block.id} className="group relative bg-card border rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="uppercase text-[10px] tracking-wider">
                  {block.modelUsed}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(block.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleCopy(block.id, block.text)}
              >
                {copiedId === block.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-[#0d1117] prose-pre:p-4">
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {block.text}
              </ReactMarkdown>
              {block.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-foreground animate-pulse align-middle" />
              )}
            </div>
          </div>
        ))}
      </div>

      {hasNewContent && !autoScroll && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Button 
            size="sm" 
            variant="secondary" 
            className="rounded-full shadow-md"
            onClick={scrollToBottom}
          >
            <ArrowDown className="mr-2 h-4 w-4" />
            New answer
          </Button>
        </div>
      )}
    </div>
  )
}
