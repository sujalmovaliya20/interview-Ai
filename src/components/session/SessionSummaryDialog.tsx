'use client'

import { CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { TranscriptBlock, AnswerBlock } from '@/store/sessionStore'
import { format } from 'date-fns'

interface SessionSummaryDialogProps {
  open: boolean
  sessionId: string
  duration: number
  questionsAnswered: number
  model: string
  transcriptBlocks: TranscriptBlock[]
  answerBlocks: AnswerBlock[]
  onClose: () => void
  onGoToDashboard: () => void
}

const MODEL_NAMES: Record<string, string> = {
  'meta/llama-3.1-70b-instruct': 'Llama 3.1 70B',
  'mistralai/mistral-large': 'Mistral Large',
  'abacusai/dracarys-llama-3.1-70b-instruct': 'Dracarys 70B',
}

export function SessionSummaryDialog({
  open,
  sessionId,
  duration,
  questionsAnswered,
  model,
  transcriptBlocks,
  answerBlocks,
  onGoToDashboard
}: SessionSummaryDialogProps) {
  
  const formatDuration = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    if (m === 0) return `${s}s`
    return `${m}m ${s}s`
  }

  const downloadTranscript = () => {
    const dateStr = format(new Date(), 'PPpp')
    const formattedDuration = formatDuration(duration)
    const friendlyModel = MODEL_NAMES[model] || model

    let content = `InterviewAI Session Transcript\n`
    content += `Date: ${dateStr}\n`
    content += `Duration: ${formattedDuration}\n`
    content += `Model: ${friendlyModel}\n`
    content += `---\n\n`
    
    content += `TRANSCRIPT:\n`
    transcriptBlocks.forEach(b => {
      content += b.isQuestion ? `[Q] ${b.text}\n` : `    ${b.text}\n`
    })

    content += `\n---\nANSWERS:\n`
    answerBlocks.forEach((b, i) => {
      content += `A${i + 1}: ${b.text}\n\n`
    })

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-${sessionId}-${format(new Date(), 'yyyy-MM-dd')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      {/* preventDefault on InteractOutside is handled by onOpenChange being a no-op when they try to close it */}
      <DialogContent 
        className="sm:max-w-md"
      >
        <DialogHeader className="flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
          <DialogTitle className="text-2xl font-bold">Session Complete</DialogTitle>
          <DialogDescription className="text-xs truncate w-full max-w-[200px]">
            {sessionId}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <div className="text-xs text-muted-foreground mb-1">Duration</div>
            <div className="font-semibold text-lg">{formatDuration(duration)}</div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <div className="text-xs text-muted-foreground mb-1">Questions</div>
            <div className="font-semibold text-lg">{questionsAnswered}</div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <div className="text-xs text-muted-foreground mb-1">Answers</div>
            <div className="font-semibold text-lg">{answerBlocks.length}</div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <div className="text-xs text-muted-foreground mb-1">Model</div>
            <div className="font-semibold text-sm truncate">{MODEL_NAMES[model] || model}</div>
          </div>
        </div>

        {transcriptBlocks.length > 0 && (
          <Collapsible className="mb-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-2 font-medium text-sm border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
              <span>View transcript preview</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-32 w-full rounded-md border mt-2 p-3 bg-muted/10">
                {transcriptBlocks.slice(-5).map(b => (
                  <div key={b.id} className="text-xs mb-1">
                    <span className="text-muted-foreground/50 mr-2">
                      {format(new Date(b.timestamp), 'HH:mm:ss')}
                    </span>
                    <span className={b.isQuestion ? 'text-primary font-medium' : ''}>
                      {b.text}
                    </span>
                  </div>
                ))}
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="flex flex-col gap-2 mt-2">
          <Button onClick={onGoToDashboard} className="w-full">
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={downloadTranscript} className="w-full">
            Download Transcript
          </Button>
          <Button variant="ghost" onClick={() => window.location.href = '/dashboard/session/new'} className="w-full">
            Start New Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
