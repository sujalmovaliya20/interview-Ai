'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Copy, Trash2, Volume2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AnswerBlock } from '@/store/sessionStore'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { format } from 'date-fns'

interface AnswerPanelProps {
  answerBlocks: AnswerBlock[]
  status: string
  onClearAnswers?: () => void
}

const MODEL_NAMES: Record<string, { name: string; color: string }> = {
  'meta/llama-3.1-70b-instruct': { name: 'Llama 3.1 70B', color: 'bg-green-500/10 text-green-500' },
  'mistralai/mistral-large': { name: 'Mistral Large', color: 'bg-blue-500/10 text-blue-500' },
  'abacusai/dracarys-llama-3.1-70b-instruct': { name: 'Dracarys 70B', color: 'bg-purple-500/10 text-purple-500' },
}

export function AnswerPanel({ answerBlocks, status, onClearAnswers }: AnswerPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [userScrolledUp, setUserScrolledUp] = useState(false)
  const [newContentWhileScrolledUp, setNewContentWhileScrolledUp] = useState(false)

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
  }, [answerBlocks, userScrolledUp])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied")
  }

  const handleSpeak = (text: string) => {
    window.speechSynthesis.cancel() // Stop current
    const utterance = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(utterance)
  }

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* PANEL HEADER */}
      <div className="h-10 border-b flex items-center justify-between px-3 shrink-0 bg-muted/20">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Answer</span>
        </div>
        <div className="flex items-center gap-2">
          {answerBlocks.length > 0 && (
            <span className="text-xs text-muted-foreground mr-2">
              {answerBlocks.length} answer{answerBlocks.length !== 1 ? 's' : ''}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={answerBlocks.length === 0}
            onClick={() => handleCopy(answerBlocks[answerBlocks.length - 1]?.text || '')}
            title="Copy last answer"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>

          {onClearAnswers && (
            <Popover>
              <PopoverTrigger render={
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" disabled={answerBlocks.length === 0}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              } />
              <PopoverContent className="w-48 p-3" align="end">
                <p className="text-sm font-medium mb-3">Clear all answers?</p>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="destructive" onClick={onClearAnswers}>Clear</Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* SCROLL AREA */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4 scroll-smooth bg-muted/5"
      >
        {answerBlocks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="text-muted-foreground font-medium mb-1">Answers appear here</h3>
            {status === 'joining' ? (
              <p className="text-sm text-muted-foreground/80">Setting up AI...</p>
            ) : (
              <p className="text-sm text-muted-foreground/80">Ask a question &mdash; AI will answer in real time</p>
            )}
          </div>
        ) : (
          answerBlocks.map(block => {
            const modelInfo = MODEL_NAMES[block.modelUsed] || { name: block.modelUsed, color: 'bg-primary/10 text-primary' }
            const isGenerating = block.isStreaming
            const textToRender = block.text

            return (
              <div key={block.id} className="mb-4 rounded-xl border bg-card overflow-hidden shadow-sm">
                
                {/* BLOCK HEADER */}
                <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${modelInfo.color}`}>
                      {modelInfo.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(block.timestamp), 'h:mm:ss a')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGenerating && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleCopy(block.text)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* BLOCK BODY */}
                <div className="px-4 py-3 relative">
                  {isGenerating && block.text === '' ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                        {textToRender + (isGenerating ? ' ▋' : '')}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* BLOCK FOOTER */}
                <div className="px-3 py-2 border-t bg-muted/10 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    ~{countWords(block.text)} words
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                    disabled={isGenerating || block.text.trim() === ''}
                    onClick={() => handleSpeak(block.text)}
                    title="Read answer aloud"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span className="text-xs">Speak</span>
                  </Button>
                </div>

              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
