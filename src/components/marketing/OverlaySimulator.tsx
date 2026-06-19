'use client'

import { useState, useEffect } from 'react'

interface SimulationStep {
  type: 'system-design' | 'coding' | 'behavioral'
  question: string
  transcription: string
  answer: string[]
  code?: string
}

const SIMULATION_DATA: SimulationStep[] = [
  {
    type: 'system-design',
    question: 'How would you design a rate limiter for a distributed API?',
    transcription: 'So, how would you go about designing a highly scalable rate limiter for a high-traffic distributed API backend?',
    answer: [
      '• Token Bucket / Leaky Bucket algorithm for flexible traffic bursts.',
      '• Redis cluster for shared state across distributed instances.',
      '• Middleware layer intercepting requests; return 429 Too Many Requests.',
      '• Sliding window log for precise tracking; fallback local cache if Redis fails.',
    ],
  },
  {
    type: 'coding',
    question: 'Check if a binary tree is height-balanced.',
    transcription: 'Write a function that checks if a binary tree is height-balanced. A tree is balanced if depths of subtrees differ by at most 1.',
    code: `function isBalanced(root) {
  function check(node) {
    if (!node) return 0;
    let left = check(node.left);
    let right = check(node.right);
    if (left === -1 || right === -1 || Math.abs(left - right) > 1) return -1;
    return Math.max(left, right) + 1;
  }
  return check(root) !== -1;
}`,
    answer: [
      '• Time Complexity: O(N) since we visit each node exactly once.',
      '• Space Complexity: O(H) for recursion stack where H is tree height.',
      '• Return -1 early as a flag if any subtree is unbalanced to save operations.',
    ],
  },
  {
    type: 'behavioral',
    question: 'Tell me about a time you handled a tight deadline.',
    transcription: 'Can you tell me about a time when you were faced with an extremely tight deadline and how you handled delivery?',
    answer: [
      '• Situation: Crucial client demo scheduled, core integration blocked by API changes.',
      '• Task: Implement fallback mock data structures and fix critical auth paths in 36 hours.',
      '• Action: Renegotiated feature scope, paired with senior architect, worked overnight.',
      '• Result: Delivered 100% stable demo; secured contract; refactored properly next sprint.',
    ],
  },
]

export function OverlaySimulator() {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [state, setState] = useState<'transcribing' | 'generating' | 'showing'>('transcribing')
  const [typedText, setTypedText] = useState('')
  const [shownAnswers, setShownAnswers] = useState<string[]>([])
  const [animatingAnswerIdx, setAnimatingAnswerIdx] = useState(0)

  const currentStep = SIMULATION_DATA[currentIdx]

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (state === 'transcribing') {
      setTypedText('')
      setShownAnswers([])
      setAnimatingAnswerIdx(0)

      // Simulate typewriter transcription
      let charIdx = 0
      const transcriptionText = currentStep.transcription
      const interval = setInterval(() => {
        setTypedText(prev => prev + transcriptionText[charIdx])
        charIdx++
        if (charIdx >= transcriptionText.length) {
          clearInterval(interval)
          timer = setTimeout(() => {
            setState('generating')
          }, 800)
        }
      }, 25)

      return () => {
        clearInterval(interval)
        clearTimeout(timer)
      }
    } else if (state === 'generating') {
      // Short processing pause
      timer = setTimeout(() => {
        setState('showing')
      }, 1000)
      return () => clearTimeout(timer)
    } else if (state === 'showing') {
      if (animatingAnswerIdx < currentStep.answer.length) {
        timer = setTimeout(() => {
          setShownAnswers(prev => [...prev, currentStep.answer[animatingAnswerIdx]])
          setAnimatingAnswerIdx(prev => prev + 1)
        }, 600)
        return () => clearTimeout(timer)
      } else {
        // Show complete answers for a few seconds, then swap questions
        timer = setTimeout(() => {
          setState('transcribing')
          setCurrentIdx(prev => (prev + 1) % SIMULATION_DATA.length)
        }, 5000)
        return () => clearTimeout(timer)
      }
    }
  }, [state, currentIdx, animatingAnswerIdx])

  return (
    <div className="relative mx-auto max-w-4xl w-full rounded-2xl border border-zinc-800 bg-[#070709] p-1.5 sm:p-2.5 shadow-2xl shadow-violet-500/5 overflow-hidden">

      {/* Top OS-Style Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-950/80 rounded-t-xl">
        <div className="flex space-x-1.5">
          <div className="h-3 w-3 rounded-full bg-zinc-800" />
          <div className="h-3 w-3 rounded-full bg-zinc-800" />
          <div className="h-3 w-3 rounded-full bg-zinc-800" />
        </div>
        <div className="text-[10px] sm:text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
          {/* Shield lock icon */}
          <svg className="h-3 w-3 text-violet-500/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <circle cx="12" cy="11" r="1.5" fill="currentColor" />
          </svg>
          <span className="hidden sm:inline">secure-overlay-session.local</span>
          <span className="sm:hidden">overlay.local</span>
        </div>
        <div className="h-4 w-4" />
      </div>

      {/* Simulator Workspace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 p-2 sm:p-3 bg-[#070709] min-h-[280px] sm:min-h-[420px]">

        {/* Left Side: Mock Video Interview Call (e.g. Zoom) */}
        <div className="md:col-span-6 rounded-xl border border-zinc-900/60 bg-zinc-950 overflow-hidden relative flex flex-col justify-between p-3 sm:p-4 min-h-[180px] sm:min-h-[220px]">
          {/* Top Bar Call UI */}
          <div className="flex justify-between items-center z-10">
            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE CALL
            </span>
            <div className="flex items-center space-x-1.5 text-zinc-400">
              {/* Camera icon */}
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              {/* Microphone icon */}
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="11" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
          </div>

          {/* Call center silhouette and waveform */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Mock Interviewer Avatar */}
            <div className="relative h-20 w-20 rounded-full border border-zinc-800 bg-zinc-900/50 flex items-center justify-center mb-4 overflow-hidden">
              <div className="h-10 w-10 rounded-full bg-zinc-700/30" />
              <div className="absolute bottom-0 h-4 w-12 rounded-t-full bg-zinc-700/20" />
            </div>

            <p className="text-xs font-bold text-zinc-300">Technical Interviewer</p>
            <p className="text-[10px] text-zinc-500">Google Career Portal</p>

            {/* Speaking waveform bars */}
            {state === 'transcribing' && (
              <div className="flex items-center space-x-1 mt-4 h-6">
                {[1, 2, 3, 4, 5, 6, 7].map((bar) => {
                  const heights = ['h-2', 'h-4', 'h-5', 'h-3', 'h-6', 'h-4', 'h-2']
                  return (
                    <div
                      key={bar}
                      className={`w-0.5 bg-violet-400/80 rounded-full animate-pulse ${heights[bar - 1]}`}
                      style={{
                        animationDelay: `${bar * 0.15}s`,
                        animationDuration: '0.8s',
                      }}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Bottom subtitle transcription box */}
          <div className="z-10 bg-black/60 backdrop-blur-md border border-zinc-900 rounded-lg p-2.5 text-left">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
              Live Transcription
            </span>
            <p className="text-[11px] text-zinc-200 min-h-[36px] leading-relaxed">
              {typedText}
              {state === 'transcribing' && <span className="animate-pulse text-violet-400 font-bold ml-0.5">|</span>}
            </p>
          </div>
        </div>

        {/* Right Side: The Invisible Overlay Simulator */}
        <div className="md:col-span-6 flex flex-col gap-3">

          {/* Overlay Box */}
          <div className="flex-1 rounded-xl border border-violet-500/20 bg-gradient-to-br from-zinc-950 to-zinc-900/90 p-4 relative overflow-hidden flex flex-col justify-between">
            {/* Ambient glass glow */}
            <div className="absolute top-0 right-0 h-16 w-16 bg-violet-500/10 blur-xl rounded-full" />

            {/* Top info and status */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
                  {/* Sparkle overlay brand icon */}
                  <svg className="h-3 w-3 text-violet-400" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M12 2c0 5.5 1.8 7.3 7.3 7.3C13.8 9.3 12 11.1 12 16.6c0-5.5-1.8-7.3-7.3-7.3C10.2 9.3 12 7.5 12 2z" />
                    <path d="M18 14c0 2.5.8 3.3 3.3 3.3-2.5 0-3.3.8-3.3 3.3 0-2.5-.8-3.3-3.3-3.3 2.5 0 3.3-.8 3.3-3.3z" opacity="0.6" />
                  </svg>
                  <span>InterviewAI Overlay</span>
                </span>

                {/* Status Indicator */}
                {state === 'transcribing' && (
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                    Listening...
                  </span>
                )}
                {state === 'generating' && (
                  <span className="text-[10px] text-violet-400 flex items-center gap-1 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-ping" />
                    Analyzing Question...
                  </span>
                )}
                {state === 'showing' && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Answers Ready
                  </span>
                )}
              </div>

              {/* Target Question */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-zinc-400 mb-1">Detected Question</h4>
                <p className="text-sm font-bold text-white leading-snug">
                  {currentStep.question}
                </p>
              </div>

              {/* Live Answer Output list */}
              <div className="space-y-2.5 min-h-[140px]">
                {state === 'transcribing' && (
                  <div className="text-xs text-zinc-600 italic mt-4">
                    Waiting for interviewer to finish speaking...
                  </div>
                )}

                {state === 'generating' && (
                  <div className="flex flex-col gap-2 mt-4">
                    <div className="h-3.5 w-2/3 bg-zinc-900 animate-pulse rounded-md" />
                    <div className="h-3.5 w-5/6 bg-zinc-900 animate-pulse rounded-md" />
                    <div className="h-3.5 w-1/2 bg-zinc-900 animate-pulse rounded-md" />
                  </div>
                )}

                {state === 'showing' && (
                  <div className="space-y-2 flex flex-col">
                    {shownAnswers.map((ans, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-zinc-100 animate-fade-in bg-zinc-950/60 border border-zinc-900/40 rounded-lg p-2 leading-relaxed"
                      >
                        {ans}
                      </div>
                    ))}
                    {animatingAnswerIdx < currentStep.answer.length && (
                      <span className="text-violet-400 font-bold animate-pulse text-xs ml-2">✍ Generating...</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom active profile tags */}
            <div className="border-t border-zinc-900/60 pt-3 flex justify-between items-center text-[10px] text-zinc-500">
              <span className="flex items-center gap-1">
                {/* Terminal icon */}
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" y1="19" x2="20" y2="19" />
                </svg>
                <span>Mode: <strong className="text-zinc-400 uppercase">{currentStep.type}</strong></span>
              </span>
              <span>Credits: <strong className="text-zinc-300">9.5</strong></span>
            </div>
          </div>

          {/* Secondary Code Support Box (if code exists) */}
          {currentStep.code && state === 'showing' && (
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/80 p-3.5 font-mono text-[10px] text-zinc-300 overflow-x-auto max-h-[160px] animate-scale-in">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5 mb-2 text-zinc-500">
                <span className="flex items-center gap-1">
                  {/* Code bracket icon */}
                  <svg className="h-3 w-3 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="7 8 3 12 7 16" />
                    <polyline points="17 8 21 12 17 16" />
                    <line x1="14" y1="4" x2="10" y2="20" opacity="0.5" />
                  </svg>
                  <span>Suggested Implementation</span>
                </span>
                <span>javascript</span>
              </div>
              <pre className="text-left text-zinc-300 leading-normal">
                <code>{currentStep.code}</code>
              </pre>
            </div>
          )}

          {/* Behavior framework reminder */}
          {currentStep.type === 'behavioral' && state === 'showing' && (
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-3 flex items-center justify-between text-[11px] text-zinc-400 animate-scale-in">
              <span className="flex items-center gap-1.5">
                {/* Chat message icon */}
                <svg className="h-3.5 w-3.5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <line x1="8" y1="9" x2="16" y2="9" opacity="0.5" />
                  <line x1="8" y1="13" x2="13" y2="13" opacity="0.5" />
                </svg>
                <span>Framework recommendation:</span>
              </span>
              <span className="font-bold text-violet-400 uppercase tracking-widest font-mono">
                S-T-A-R Method
              </span>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
