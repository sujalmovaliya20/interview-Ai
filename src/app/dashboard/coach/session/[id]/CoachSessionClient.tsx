'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAudioCapture } from '@/hooks/useAudioCapture'
import { getScoreVariant, variantStyles, getReadinessVariant } from '@/lib/scoreVariant'
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

export function CoachSessionClient({ sessionId, initialSession }: CoachSessionClientProps) {
  const router = useRouter()
  const [questionText, setQuestionText] = useState('')
  const [questionNumber, setQuestionNumber] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(3)
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

  const progressPct = (questionNumber / totalQuestions) * 100

  return (
    <div className="space-y-5 flex-1 flex flex-col justify-between animate-scale-in">
      {/* ── Top Meta Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[13px] font-medium uppercase tracking-[0.03em] text-zinc-300 block mb-0.5">Target role</span>
          <p className="text-[17px] font-medium text-foreground">{initialSession.role}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-normal text-zinc-300">
            Question <span className="text-foreground font-medium">{questionNumber}</span> of <span className="text-foreground font-medium">{totalQuestions}</span>
          </span>
          <div className="min-w-[100px] sm:min-w-[140px] h-[5px] bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-5 items-stretch flex-1">

        {/* ── Left Card: Current Question + Answer ── */}
        <div className="bg-zinc-900/60 border border-white/[0.08] rounded-xl p-4 sm:p-6 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Eyebrow */}
            <div className="flex items-center gap-1.5">
              <i className="ti ti-message-circle-question text-[16px] text-violet-400" />
              <span className="text-[13px] font-medium uppercase tracking-[0.03em] text-violet-400">Current question</span>
            </div>

            {/* Question text */}
            <h3 className="text-[18px] font-medium leading-[1.5] text-foreground">
              {questionText || 'Generating question…'}
            </h3>
            {isSubmitting ? (
              /* ── Premium Interviewer Thinking Loader ── */
              <div className="flex flex-col items-center justify-center py-12 space-y-6 border-t border-white/[0.06] pt-8 animate-fade-in w-full">
                <div className="relative">
                  {/* Glowing orbital ring */}
                  <div className="absolute -inset-4 rounded-full border border-violet-500/20 animate-spin" style={{ animationDuration: '3s' }} />
                  <div className="absolute -inset-2 rounded-full border border-dashed border-violet-500/35 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
                  
                  {/* Interviewer avatar container */}
                  <div className="relative z-10 w-24 h-24 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shadow-xl shadow-violet-500/5">
                    <i className="ti ti-user-scan text-[40px] text-violet-400" />
                  </div>
                  
                  {/* Thinking bubble dots */}
                  <div className="absolute -top-1 -right-3 bg-zinc-800 border border-white/[0.08] px-3.5 py-2 rounded-full flex items-center gap-1 shadow-xl z-20">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <h4 className="text-[16px] font-medium text-foreground">AI Interviewer is thinking…</h4>
                  <p className="text-[14px] text-zinc-400 max-w-[300px] leading-relaxed mx-auto">
                    Formulating thoughts, scoring technical vocabulary, and analyzing STAR methodology structure.
                  </p>
                </div>
                
                {/* Thinking steps checklist */}
                <div className="w-full max-w-[300px] bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3 text-[13px]">
                    <i className="ti ti-loader text-[16px] text-violet-400 animate-spin" />
                    <span className="text-zinc-200">Evaluating response depth…</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-zinc-500">
                    <i className="ti ti-circle text-[16px]" />
                    <span>Scoring delivery confidence</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-zinc-500">
                    <i className="ti ti-circle text-[16px]" />
                    <span>Structuring coaching report</span>
                  </div>
                </div>
              </div>
            ) : !showFeedback ? (
              <div className="space-y-4 border-t border-white/[0.06] pt-4">
                <label className="text-[13px] font-medium uppercase tracking-[0.03em] text-zinc-300 block">Your answer</label>
                <textarea
                  placeholder="Click the microphone below to speak your answer, or type it directly…"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full min-h-[160px] p-4 rounded-xl border border-white/[0.08] bg-white/[0.04] text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-[14px] font-normal leading-[1.5]"
                />

                {/* ── Centered Interactive Mic Button ── */}
                <div className="flex flex-col items-center justify-center py-4 space-y-3.5 w-full border-t border-dashed border-white/[0.06] mt-2">
                  <div className="relative flex items-center justify-center">
                    {/* Glowing outer ring when recording */}
                    {isRecording && (
                      <>
                        <span className="absolute inset-0 rounded-full bg-red-500/25 animate-ping" style={{ animationDuration: '1.5s' }} />
                        <span className="absolute -inset-3 rounded-full bg-red-500/10 animate-pulse" />
                      </>
                    )}
                    
                    <button
                      type="button"
                      onClick={handleToggleRecord}
                      disabled={isSubmitting || isTranscribing}
                      className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500/40 ${
                        isRecording
                          ? 'bg-red-500 border-red-400 text-white shadow-red-500/30'
                          : 'bg-violet-600 hover:bg-violet-500 border-violet-500/30 text-white shadow-violet-600/20'
                      }`}
                    >
                      <i className={`ti ${isRecording ? 'ti-microphone-off' : 'ti-microphone'} text-[30px]`} />
                    </button>
                  </div>

                  {/* Micro-animations and sound-wave visualization */}
                  <div className="text-center min-h-[44px] flex flex-col items-center justify-center">
                    {isRecording && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[13px] font-medium text-red-400">Recording…</span>
                        </div>
                        {/* Animated Sound Wave */}
                        <div className="flex items-end gap-1 h-6 justify-center">
                          <span className="w-[3px] bg-red-400 rounded-full animate-wave" style={{ animationDelay: '0.1s', height: '10px' }} />
                          <span className="w-[3px] bg-red-400 rounded-full animate-wave" style={{ animationDelay: '0.3s', height: '14px' }} />
                          <span className="w-[3px] bg-red-400 rounded-full animate-wave" style={{ animationDelay: '0.5s', height: '22px' }} />
                          <span className="w-[3px] bg-red-400 rounded-full animate-wave" style={{ animationDelay: '0.3s', height: '14px' }} />
                          <span className="w-[3px] bg-red-400 rounded-full animate-wave" style={{ animationDelay: '0.1s', height: '10px' }} />
                        </div>
                      </div>
                    )}

                    {isTranscribing && (
                      <div className="flex items-center gap-2 text-zinc-300 animate-pulse">
                        <svg className="animate-spin h-4 w-4 text-zinc-300" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-[13px] font-medium">Transcribing speech…</span>
                      </div>
                    )}

                    {!isRecording && !isTranscribing && (
                      <span className="text-[13px] font-normal text-zinc-400 block max-w-[280px] leading-relaxed">
                        Tap the microphone to speak your answer, or type it directly above.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 border-t border-white/[0.06] pt-4">
                <span className="text-[13px] font-medium uppercase tracking-[0.03em] text-zinc-300 block">Your response</span>
                <div className="bg-zinc-800/40 rounded-lg p-3 max-h-[300px] overflow-y-auto">
                  <p className="text-[14px] font-normal leading-[1.5] text-zinc-200 whitespace-pre-wrap">
                    {answerText}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions — only during writing mode */}
          {!showFeedback && (
            <div className="flex items-center justify-end pt-5 border-t border-white/[0.06] mt-5 w-full">
              <Button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || isRecording || isTranscribing}
                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium px-6 h-11 cursor-pointer shrink-0 text-[14px] transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Evaluating…
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    Submit answer <i className="ti ti-arrow-right text-[15px]" />
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* ── Right Card: Evaluation (only visible after submission) ── */}
        {showFeedback && (
          <div className="bg-zinc-900/60 border border-white/[0.08] rounded-xl p-4 sm:p-6 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <i className="ti ti-check-circle text-[15px] text-emerald-400" />
                  <span className="text-[13px] font-medium uppercase tracking-[0.03em] text-emerald-400">Answer evaluation</span>
                </div>
                {feedback.evaluation.filler_words > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {feedback.evaluation.filler_words} filler words
                  </span>
                )}
              </div>

              {/* Score Grid — color derived from getScoreVariant */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'STAR structure', val: feedback.evaluation.star_score },
                  { label: 'Clarity', val: feedback.evaluation.clarity_score },
                  { label: 'Technical', val: feedback.evaluation.technical_score },
                  { label: 'Confidence', val: feedback.evaluation.confidence_score },
                ].map((metric, idx) => {
                  const score = metric.val !== undefined && metric.val !== null ? Number(metric.val) : 0
                  const variant = getScoreVariant(score)
                  const styles = variantStyles[variant]
                  return (
                    <div key={idx} className={`border ${styles.border} ${styles.bg} p-3 rounded-xl text-center space-y-1`}>
                      <span className="text-[13px] font-medium uppercase tracking-[0.03em] text-zinc-300 block">{metric.label}</span>
                      <p className={`text-[17px] font-medium ${styles.text}`}>{score.toFixed(1)}/10</p>
                    </div>
                  )
                })}
              </div>

              {/* Strengths & Improvements */}
              <div className="space-y-5 max-h-[480px] overflow-y-auto pr-1">
                {/* Strengths */}
                <div className="space-y-2">
                  <h4 className="text-[13px] font-medium uppercase tracking-[0.03em] text-emerald-400">Strengths</h4>
                  {feedback.evaluation.strengths && feedback.evaluation.strengths.length > 0 ? (
                    <ul className="space-y-2">
                      {feedback.evaluation.strengths.map((s: string, idx: number) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <i className="ti ti-check text-[14px] text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-[14px] font-normal leading-[1.5] text-zinc-200">{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[14px] text-zinc-300 italic">No specific strengths listed.</p>
                  )}
                </div>

                {/* Areas for Improvement */}
                <div className="space-y-2">
                  <h4 className="text-[13px] font-medium uppercase tracking-[0.03em] text-amber-400">Areas for improvement</h4>
                  {feedback.evaluation.improvements && feedback.evaluation.improvements.length > 0 ? (
                    <ul className="space-y-2">
                      {feedback.evaluation.improvements.map((im: string, idx: number) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <i className="ti ti-alert-circle text-[14px] text-amber-400 shrink-0 mt-0.5" />
                          <span className="text-[14px] font-normal leading-[1.5] text-zinc-200">{im}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[14px] text-zinc-300 italic">No improvements noted!</p>
                  )}
                </div>

                {/* AI Coach Feedback */}
                <div className="bg-violet-500/[0.12] border border-violet-500/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <i className="ti ti-sparkles text-[15px] text-violet-300 animate-pulse" />
                    <span className="text-[13px] font-medium uppercase tracking-[0.03em] text-violet-300">AI coach feedback</span>
                  </div>
                  <p className="text-[15px] font-normal leading-[1.5] text-zinc-100 italic">
                    &ldquo;{feedback.feedback}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-5 border-t border-white/[0.06] mt-5">
              {sessionComplete ? (
                <Button
                  onClick={handleFinishAndExit}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium h-11 cursor-pointer text-[14px] transition-colors"
                >
                  <i className="ti ti-check text-[15px] mr-2" /> View Final Report
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium h-11 cursor-pointer text-[14px] transition-colors"
                >
                  Next question <i className="ti ti-arrow-right text-[15px] ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Session Report Modal ── */}
      {sessionComplete && report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-2xl p-8 max-w-[460px] max-w-[92vw] w-full shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3.5">
                <i className="ti ti-check text-[24px] text-emerald-400" />
              </div>
              <h2 className="text-[18px] font-medium text-foreground">Session complete</h2>
              <p className="text-[14px] text-zinc-300 mt-1">
                {initialSession.role} · {totalQuestions} questions
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(() => {
                const overallScore = report.overall_score ? Number(report.overall_score) : 0
                const overallVariant = getScoreVariant(overallScore)
                const overallStyles = variantStyles[overallVariant]
                return (
                  <div className="bg-zinc-800/60 rounded-lg p-3.5 text-center">
                    <span className="text-[13px] font-medium uppercase tracking-[0.03em] text-zinc-300 block mb-1">Overall</span>
                    <p className={`text-[22px] font-medium ${overallStyles.text}`}>
                      {report.overall_score ? `${report.overall_score}/10` : '—'}
                    </p>
                  </div>
                )
              })()}
              <div className="bg-zinc-800/60 rounded-lg p-3.5 text-center">
                <span className="text-[13px] font-medium uppercase tracking-[0.03em] text-zinc-300 block mb-1">Level</span>
                <p className="text-[14px] font-medium text-foreground mt-1">{report.performance_level || 'Competent'}</p>
              </div>
              {(() => {
                const readiness = report.interview_readiness || 'Ready'
                const readinessVariant = getReadinessVariant(readiness)
                const readinessStyles = variantStyles[readinessVariant]
                return (
                  <div className="bg-zinc-800/60 rounded-lg p-3.5 text-center">
                    <span className="text-[13px] font-medium uppercase tracking-[0.03em] text-zinc-300 block mb-1">Readiness</span>
                    <p className={`text-[14px] font-medium ${readinessStyles.text} mt-1`}>{readiness}</p>
                  </div>
                )
              })()}
            </div>

            {/* Focus Areas — quiet dots, not pill badges */}
            <div className="space-y-3">
              {report.top_strengths && report.top_strengths.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[13px] font-medium uppercase tracking-[0.03em] text-emerald-400">Strengths</h3>
                  <div className="space-y-1.5">
                    {report.top_strengths.map((s: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <i className="ti ti-point-filled text-[14px] text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[14px] font-normal leading-[1.5] text-zinc-200">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {report.top_weaknesses && report.top_weaknesses.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[13px] font-medium uppercase tracking-[0.03em] text-amber-400">Focus areas</h3>
                  <div className="space-y-1.5">
                    {report.top_weaknesses.map((w: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <i className="ti ti-point-filled text-[14px] text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-[14px] font-normal leading-[1.5] text-zinc-200">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Overall Assessment */}
            {report.summary && (
              <div className="bg-zinc-800/40 rounded-lg p-3.5 space-y-1.5">
                <h3 className="text-[13px] font-medium uppercase tracking-[0.03em] text-zinc-300">Overall assessment</h3>
                <p className="text-[14px] font-normal leading-[1.5] text-zinc-300">{report.summary}</p>
              </div>
            )}

            {/* CTA */}
            <Button
              onClick={handleFinishAndExit}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium h-11 cursor-pointer text-[14px] transition-colors"
            >
              Close and return to dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
