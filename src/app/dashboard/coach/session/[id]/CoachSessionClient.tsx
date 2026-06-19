'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAudioCapture } from '@/hooks/useAudioCapture'
import { 
  BrainCircuit, 
  Mic, 
  MicOff, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Check,
  RotateCcw,
  MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'

interface CoachSessionClientProps {
  sessionId: string
  initialSession: {
    id: string
    role: string
    session_type: string
    status: string
  }
}

const getScoreColor = (score: number) => {
  if (score >= 7.5) {
    return 'bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/10 dark:border-emerald-500/20'
  }
  if (score >= 5.0) {
    return 'bg-amber-500/5 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/10 dark:border-amber-500/20'
  }
  return 'bg-red-500/5 dark:bg-red-500/10 text-red-750 dark:text-red-400 border-red-500/10 dark:border-red-500/20'
}

export function CoachSessionClient({ sessionId, initialSession }: CoachSessionClientProps) {
  const router = useRouter()
  const [questionText, setQuestionText] = useState('')
  const [questionNumber, setQuestionNumber] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(5)
  const [answerText, setAnswerText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  
  // Feedback states
  const [feedback, setFeedback] = useState<any>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [report, setReport] = useState<any>(null)

  // Audio recording buffers
  const chunksRef = useRef<ArrayBuffer[]>([])

  // Audio capture hook
  const { 
    start: startAudio, 
    stop: stopAudio, 
    isRecording, 
    audioLevel, 
    error: audioError 
  } = useAudioCapture({
    onChunk: (buffer) => {
      chunksRef.current.push(buffer)
    },
    enabled: true
  })

  // Load initial question from sessionStorage
  useEffect(() => {
    const cachedQ = sessionStorage.getItem(`coach_q_${sessionId}`)
    const cachedNum = sessionStorage.getItem(`coach_num_${sessionId}`)
    const cachedTotal = sessionStorage.getItem(`coach_total_${sessionId}`)

    if (cachedQ) {
      setQuestionText(cachedQ)
    } else {
      setQuestionText('Tell me about yourself and your background.')
    }

    if (cachedNum) setQuestionNumber(parseInt(cachedNum))
    if (cachedTotal) setTotalQuestions(parseInt(cachedTotal))
  }, [sessionId])

  // Log audio errors
  useEffect(() => {
    if (audioError) {
      console.error('Audio capture hook error:', audioError)
      if (audioError === 'MICROPHONE_DENIED') {
        toast.error('Microphone access denied. Please check your browser permissions.')
      } else {
        toast.error(`Audio recording error: ${audioError}`)
      }
    }
  }, [audioError])

  const handleToggleRecord = async () => {
    if (isRecording) {
      setIsTranscribing(true)
      stopAudio()

      setTimeout(async () => {
        if (chunksRef.current.length === 0) {
          setIsTranscribing(false)
          toast.error('No audio recorded. Please try again.')
          return
        }

        try {
          const totalLength = chunksRef.current.reduce((acc, chunk) => acc + chunk.byteLength, 0)
          const mergedBuffer = new Uint8Array(totalLength)
          let offset = 0
          for (const chunk of chunksRef.current) {
            mergedBuffer.set(new Uint8Array(chunk), offset)
            offset += chunk.byteLength
          }

          toast.info('Transcribing your answer...')
          const response = await fetch('/api/coach/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
            },
            body: mergedBuffer,
          })

          if (!response.ok) {
            throw new Error('Transcription service failed')
          }

          const data = await response.json()
          if (data.text) {
            setAnswerText(prev => prev ? `${prev} ${data.text}` : data.text)
            toast.success('Transcription added!')
          } else {
            toast.warning('We could not hear any speech. Try speaking louder or closer to the mic.')
          }
        } catch (err: any) {
          console.error(err)
          toast.error('Failed to transcribe audio. You can still type your answer.')
        } finally {
          setIsTranscribing(false)
          chunksRef.current = []
        }
      }, 500)
    } else {
      chunksRef.current = []
      const success = await startAudio()
      if (success) {
        toast.success('Recording started... Speak your answer now.')
      }
    }
  }

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      toast.error('Please record or type an answer before submitting')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/coach/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          answerText: answerText.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to evaluate answer')
      }

      const data = await response.json()
      setFeedback(data)
      setShowFeedback(true)

      if (data.session_complete) {
        setSessionComplete(true)
        setReport(data.report)
      } else {
        sessionStorage.setItem(`coach_q_${sessionId}`, data.next_question)
        sessionStorage.setItem(`coach_num_${sessionId}`, data.question_number.toString())
        if (data.total_questions) {
          sessionStorage.setItem(`coach_total_${sessionId}`, data.total_questions.toString())
          setTotalQuestions(data.total_questions)
        }
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to submit answer. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    if (!feedback) return

    setQuestionText(feedback.next_question)
    setQuestionNumber(feedback.question_number)
    setAnswerText('')
    setFeedback(null)
    setShowFeedback(false)
    chunksRef.current = []
  }

  const handleFinishAndExit = () => {
    sessionStorage.removeItem(`coach_q_${sessionId}`)
    sessionStorage.removeItem(`coach_num_${sessionId}`)
    sessionStorage.removeItem(`coach_total_${sessionId}`)
    router.push('/dashboard/coach')
  }

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-between animate-scale-in">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground">Target Role: <span className="text-foreground font-semibold">{initialSession.role}</span></h2>
          <p className="text-xs text-muted-foreground/80 capitalize">Mode: {initialSession.session_type.replace('_', ' ')} Interview</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          <div className="text-left sm:text-right">
            <span className="text-xs text-muted-foreground/60">Question</span>
            <p className="text-sm font-bold text-foreground">{questionNumber} of {totalQuestions}</p>
          </div>
          {/* Progress bar */}
          <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Workspace: grid items align stretch for side-by-side cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-stretch my-auto">
        
        {/* Left Column: Question and Input (or Answer review) */}
        <div className={`${showFeedback ? 'lg:col-span-6' : 'lg:col-span-12'} flex transition-all duration-300`}>
          <div className="glass-card p-4 sm:p-6 md:p-8 border-violet-500/15 flex flex-col justify-between w-full">
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-xs font-bold tracking-wider text-violet-500 dark:text-violet-400 uppercase flex items-center gap-1.5">
                  <BrainCircuit className="h-4.5 w-4.5 animate-pulse" /> Current Question
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Question {questionNumber} of {totalQuestions}
                </span>
              </div>

              {/* Question Display */}
              <div className="space-y-3">
                <h3 className="text-xl md:text-2xl font-extrabold text-foreground leading-relaxed tracking-tight">
                  {questionText || 'Generating Question...'}
                </h3>
              </div>

              {/* Conditional Display: Textarea for input or beautiful review panel for submitted response */}
              {!showFeedback ? (
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Your Answer</label>
                  <textarea
                    placeholder="Click the microphone below to speak your answer, or type it directly..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full min-h-[200px] p-4 rounded-xl border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-sm leading-relaxed"
                  />
                </div>
              ) : (
                <div className="space-y-3 border-t border-border pt-5">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Your Response
                  </h4>
                  <div className="border-l-3 border-violet-500/50 bg-muted/20 hover:bg-muted/40 p-4 rounded-xl transition-all duration-300 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {answerText}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions for Left Column (Mic and Submit) - only visible during writing mode */}
            {!showFeedback && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-border mt-6 w-full">
                {/* Record button and status / levels */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Record Button */}
                  <button
                    type="button"
                    onClick={handleToggleRecord}
                    disabled={isSubmitting || isTranscribing}
                    className={`h-12 w-12 rounded-xl flex items-center justify-center border transition-all duration-300 shrink-0 cursor-pointer ${
                      isRecording 
                        ? 'bg-red-550/10 dark:bg-red-500/20 border-red-500/30 dark:border-red-500/40 text-red-650 dark:text-red-400 animate-pulse' 
                        : 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20'
                    }`}
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>

                  {/* Progress bar visual for recording audio level */}
                  {isRecording && (
                    <div className="flex-1 flex items-center gap-2.5 min-w-0">
                      <span className="text-xs text-red-650 dark:text-red-400 font-semibold animate-pulse whitespace-nowrap">Recording...</span>
                      <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-550 transition-all duration-100" 
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isTranscribing && (
                    <span className="text-xs text-muted-foreground animate-pulse flex-1 truncate">Transcribing speech...</span>
                  )}

                  {!isRecording && !isTranscribing && (
                    <div className="flex-1 text-xs text-muted-foreground leading-normal">
                      Speak or type your response. Click mic to record.
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSubmitAnswer}
                  disabled={isSubmitting || isRecording || isTranscribing}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold px-6 shadow-lg hover:shadow-lg transition-all duration-300 h-12 cursor-pointer shrink-0"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Evaluating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center">
                      Submit Answer <ArrowRight className="h-4.5 w-4.5" />
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Feedback / Evaluation Card */}
        {showFeedback && (
          <div className="lg:col-span-6 flex transition-all duration-300">
            <div className="glass-card p-4 sm:p-6 md:p-8 border-violet-500/15 flex flex-col justify-between w-full">
              <div className="space-y-6">
                
                {/* Answer Evaluated Header */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <span className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="h-4.5 w-4.5 animate-pulse" /> Answer Evaluation
                  </span>
                  {feedback.evaluation.filler_words > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      {feedback.evaluation.filler_words} Filler Words
                    </span>
                  )}
                </div>

                {/* Scores Grid - Dynamic Color Coding */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'STAR structure', val: feedback.evaluation.star_score },
                    { label: 'Clarity', val: feedback.evaluation.clarity_score },
                    { label: 'Technical', val: feedback.evaluation.technical_score },
                    { label: 'Confidence', val: feedback.evaluation.confidence_score },
                  ].map((metric, idx) => {
                    const score = metric.val !== undefined && metric.val !== null ? Number(metric.val) : 5.0
                    const colorClasses = getScoreColor(score)
                    return (
                      <div key={idx} className={`border p-3 rounded-xl text-center space-y-1 transition-all duration-300 ${colorClasses}`}>
                        <span className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-wider block">{metric.label}</span>
                        <p className="text-base font-extrabold tracking-tight">{score.toFixed(1)}/10</p>
                      </div>
                    )
                  })}
                </div>

                {/* Evaluation strengths & weaknesses lists */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  {/* Strengths */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Strengths</h4>
                    {feedback.evaluation.strengths && feedback.evaluation.strengths.length > 0 ? (
                      <ul className="text-xs text-foreground space-y-2.5">
                        {feedback.evaluation.strengths.map((s: string, idx: number) => (
                          <li key={idx} className="flex gap-2 items-start">
                            <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No specific strengths listed.</p>
                    )}
                  </div>

                  {/* Areas for Improvement */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Areas for Improvement</h4>
                    {feedback.evaluation.improvements && feedback.evaluation.improvements.length > 0 ? (
                      <ul className="text-xs text-foreground space-y-2.5">
                        {feedback.evaluation.improvements.map((im: string, idx: number) => (
                          <li key={idx} className="flex gap-2 items-start">
                            <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{im}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No improvements noted!</p>
                    )}
                  </div>

                  {/* Coach Feedback Callout (Redesigned to be highly visible and legible) */}
                  <div className="bg-gradient-to-r from-violet-500/[0.02] to-indigo-500/[0.02] dark:from-violet-500/[0.04] dark:to-indigo-500/[0.04] border border-violet-500/10 dark:border-violet-500/20 p-5 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-violet-550 dark:text-violet-400 uppercase tracking-wider">
                      <Sparkles className="h-4 w-4" /> AI Coach Feedback
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-relaxed italic">
                      "{feedback.feedback}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-border flex items-center justify-end mt-6">
                {sessionComplete ? (
                  <Button
                    onClick={handleFinishAndExit}
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/10 h-12 cursor-pointer"
                  >
                    <Award className="h-5 w-5 mr-2 animate-bounce" /> View Final Report
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-violet-500/10 h-12 cursor-pointer"
                  >
                    Next Question <ChevronRight className="h-4.5 w-4.5 ml-1" />
                  </Button>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Session Completed Full Report Modal Overlay */}
      {sessionComplete && report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="glass-card max-w-2xl w-full p-5 sm:p-6 border-border space-y-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Award className="h-6 w-6 text-emerald-655 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Interview Session Report</h2>
                <p className="text-xs text-muted-foreground">Mock interview successfully completed.</p>
              </div>
            </div>

            {/* Performance Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-muted/50 border border-border p-3.5 rounded-xl text-center space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Overall Score</span>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{report.overall_score ? `${report.overall_score}/10` : '—'}</p>
              </div>
              <div className="bg-muted/50 border border-border p-3.5 rounded-xl text-center space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Performance</span>
                <p className="text-sm font-bold text-foreground pt-1.5">{report.performance_level || 'Competent'}</p>
              </div>
              <div className="bg-muted/50 border border-border p-3.5 rounded-xl text-center space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Readiness</span>
                <p className="text-sm font-bold text-foreground pt-1.5">{report.interview_readiness || 'Ready'}</p>
              </div>
            </div>

            {/* Report body strengths & improvements */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Top Strengths</h3>
                <div className="flex flex-wrap gap-2">
                  {report.top_strengths && report.top_strengths.map((s: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-350 border border-emerald-500/20 dark:border-emerald-500/20">
                      <Check className="h-3 w-3" /> {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Top Focus Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {report.top_weaknesses && report.top_weaknesses.map((w: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-350 border border-amber-500/20 dark:border-amber-500/20">
                      <AlertCircle className="h-3 w-3" /> {w}
                    </span>
                  ))}
                </div>
              </div>

              {report.summary && (
                <div className="bg-muted/30 border border-border p-4 rounded-xl space-y-1.5">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Overall Assessment</h3>
                  <p className="text-xs text-foreground/90 dark:text-zinc-300 leading-relaxed">{report.summary}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                onClick={handleFinishAndExit}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-violet-500/10"
              >
                Close & Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
