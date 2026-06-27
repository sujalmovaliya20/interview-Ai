'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface HistoryData {
  sessions: any[]
  top_weaknesses: any[]
  total_sessions: number
  avg_score: number
}

interface CoachDashboardClientProps {
  initialHistory: HistoryData
  userId: string
}

const POPULAR_ROLES = [
  'Senior React Developer',
  'Frontend Tech Lead',
  'Full Stack Engineer',
  'AI Integration Specialist',
]

export function CoachDashboardClient({ initialHistory, userId }: CoachDashboardClientProps) {
  const router = useRouter()
  const [role, setRole] = useState('')
  const [sessionType, setSessionType] = useState('mixed')
  const [maxQuestions, setMaxQuestions] = useState('3')
  const [isLoading, setIsLoading] = useState(false)

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role.trim()) {
      toast.error('Please specify the role you are practicing for')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/coach/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: role.trim(),
          sessionType,
          maxQuestions: parseInt(maxQuestions),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to initiate mock interview session')
      }

      const data = await response.json()
      // Store initial session parameters in sessionStorage so the session view reads them correctly
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`coach_q_${data.session_id}`, data.question)
        sessionStorage.setItem(`coach_num_${data.session_id}`, '1')
        sessionStorage.setItem(`coach_total_${data.session_id}`, (data.total_questions || maxQuestions).toString())
      }
      toast.success('Session started! Preparing your first question...')
      router.push(`/dashboard/coach/session/${data.session_id}`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-[22px] font-medium text-foreground">Practice mode</h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium uppercase tracking-[0.03em] bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <i className="ti ti-sparkles text-[13px]" /> AI coach
          </span>
        </div>
        <p className="text-[15px] font-normal leading-[1.5] text-zinc-300">
          Run a full mock interview tailored to your target role.
        </p>
      </div>

      {/* ── Layout Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5 items-start">

        {/* ── Left Card: Start a session ── */}
        <div className="bg-zinc-900/60 border border-white/[0.08] rounded-xl p-6">
          <form onSubmit={handleStartSession} className="space-y-5">
            {/* Card Header */}
            <div>
              <h2 className="text-[16px] font-medium text-foreground mb-0.5">Start a session</h2>
              <p className="text-[15px] text-zinc-300">Configure your target role and question preferences.</p>
            </div>

            {/* Role Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[14px] font-medium text-zinc-200 block">
                  Target Role
                </label>
                <span className="text-[13px] font-medium uppercase tracking-[0.03em] text-zinc-400">Required</span>
              </div>
              <Input
                placeholder="e.g. Senior React Developer at Stripe"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isLoading}
                className="bg-transparent border-white/[0.08] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl h-11 text-foreground transition-all placeholder:text-zinc-500 text-[14px]"
              />

              {/* Popular Tags */}
              <div className="space-y-2">
                <span className="text-[13px] font-medium uppercase tracking-[0.03em] text-zinc-300">
                  Popular roles
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_ROLES.map((roleName) => (
                    <button
                      key={roleName}
                      type="button"
                      onClick={() => setRole(roleName)}
                      disabled={isLoading}
                      className={`text-[13px] px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer font-medium ${
                        role === roleName
                          ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                          : 'bg-white/[0.04] border-white/[0.08] text-zinc-200 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      {roleName}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid: Type & Length */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-zinc-200 block">Interview Type</label>
                <Select
                  value={sessionType}
                  onValueChange={(val) => setSessionType(val || 'mixed')}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full bg-transparent border-white/[0.08] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl h-11 text-foreground transition-all text-left px-3 text-[14px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground rounded-xl shadow-xl">
                    <SelectItem value="mixed">Mixed (Behavioral + Tech)</SelectItem>
                    <SelectItem value="behavioral">Behavioral (STAR Method)</SelectItem>
                    <SelectItem value="technical">Technical / Coding Concepts</SelectItem>
                    <SelectItem value="rapid_fire">Rapid Fire / Quick Concepts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-medium text-zinc-200 block">Total Questions</label>
                <Select
                  value={maxQuestions}
                  onValueChange={(val) => setMaxQuestions(val || '3')}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full bg-transparent border-white/[0.08] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl h-11 text-foreground transition-all text-left px-3 text-[14px]">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground rounded-xl shadow-xl">
                    <SelectItem value="3">3 Questions (Speed Run)</SelectItem>
                    <SelectItem value="5">5 Questions (Standard)</SelectItem>
                    <SelectItem value="10">10 Questions (Full Mock)</SelectItem>
                    <SelectItem value="15">15 Questions (Deep Dive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.06]" />

            {/* What to Expect — flat 2-column inline list */}
            <div className="space-y-3">
              <h3 className="text-[13px] font-medium uppercase tracking-[0.03em] text-zinc-300">
                What to expect
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <i className="ti ti-activity text-[17px] text-violet-400" />
                  <span className="text-[14px] font-normal leading-[1.5] text-zinc-300">Real-time evaluation</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <i className="ti ti-arrow-bear-right text-[17px] text-violet-400" />
                  <span className="text-[14px] font-normal leading-[1.5] text-zinc-300">Dynamic follow-ups</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <i className="ti ti-target-arrow text-[17px] text-violet-400" />
                  <span className="text-[14px] font-normal leading-[1.5] text-zinc-300">Targeted practice</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <i className="ti ti-file-analytics text-[17px] text-violet-400" />
                  <span className="text-[14px] font-normal leading-[1.5] text-zinc-300">Session reports</span>
                </div>
              </div>
            </div>

            {/* Primary CTA */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl py-2.5 h-11 text-[14px] cursor-pointer transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 justify-center w-full">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Initializing session…
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <i className="ti ti-player-play text-[15px]" /> Start Mock Interview
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* ── Right Column: stacked cards ── */}
        <div className="flex flex-col gap-5">

          {/* Card 1: Your progress */}
          <div className="bg-zinc-900/60 border border-white/[0.08] rounded-xl p-5">
            <h2 className="text-[16px] font-medium text-foreground mb-0.5">Your progress</h2>
            <p className="text-[14px] font-normal text-zinc-300 mb-4">Continuous evaluation metrics.</p>

            {/* Two metric cells */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-zinc-800/50 rounded-lg p-3.5">
                <span className="text-[13px] font-medium uppercase tracking-[0.03em] text-zinc-300 block mb-1">Sessions</span>
                <p className="text-[26px] font-medium text-foreground leading-none">{initialHistory.total_sessions}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3.5">
                <span className="text-[13px] font-medium uppercase tracking-[0.03em] text-zinc-300 block mb-1">Avg score</span>
                <p className="text-[26px] font-medium text-violet-400 leading-none">
                  {initialHistory.total_sessions > 0 ? initialHistory.avg_score.toFixed(1) : '—'}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[14px] font-normal text-zinc-300">Score index</span>
                <span className="text-[13px] font-medium text-violet-400">
                  {initialHistory.total_sessions > 0 ? `${(initialHistory.avg_score * 10).toFixed(0)}%` : '0%'}
                </span>
              </div>
              <div className="h-[5px] w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-600 rounded-full transition-all duration-1000"
                  style={{ width: `${initialHistory.total_sessions > 0 ? (initialHistory.avg_score / 10) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[14px] font-normal text-zinc-400">
                {initialHistory.total_sessions > 0
                  ? 'Keep completing sessions to improve your score.'
                  : 'Start your first session to establish your baseline.'}
              </p>
            </div>
          </div>

          {/* Card 2: Top focus areas */}
          <div className="bg-zinc-900/60 border border-white/[0.08] rounded-xl p-5">
            <h2 className="text-[16px] font-medium text-foreground mb-0.5">Top focus areas</h2>
            <p className="text-[14px] font-normal text-zinc-300 mb-4">Tracked weaknesses across sessions.</p>

            {initialHistory.top_weaknesses && initialHistory.top_weaknesses.length > 0 ? (
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {initialHistory.top_weaknesses.map((w: any, idx: number) => (
                  <div
                    key={idx}
                    className="border-l-2 border-amber-500/30 pl-3 py-0.5"
                  >
                    <span className="text-[12px] font-medium uppercase tracking-[0.03em] text-amber-400 block mb-0.5">
                      {w.category?.replace(/_/g, ' ') || 'General'}
                    </span>
                    <p className="text-[14px] font-normal leading-[1.5] text-zinc-200">{w.weakness_description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-white/[0.08] rounded-xl text-center space-y-2">
                <div className="h-8 w-8 rounded-full bg-white/[0.04] flex items-center justify-center text-zinc-300">
                  <i className="ti ti-sparkles text-[15px]" />
                </div>
                <div>
                  <h4 className="text-[14px] font-medium text-zinc-200">No focus areas yet</h4>
                  <p className="text-[14px] font-normal text-zinc-400 mt-1 max-w-[240px] mx-auto">
                    Complete sessions to build your profile. The AI coach will map focus areas here.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* View History */}
          <Button
            variant="outline"
            disabled={initialHistory.sessions.length === 0}
            onClick={() => router.push('/dashboard/sessions')}
            className="w-full border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white rounded-xl h-11 text-[14px] font-medium cursor-pointer transition-colors"
          >
            <i className="ti ti-history text-[15px] mr-2" /> View session history
          </Button>
        </div>
      </div>
    </div>
  )
}
