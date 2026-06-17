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
import { BrainCircuit, Play, Sparkles, TrendingUp, AlertTriangle, History } from 'lucide-react'
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

const getCategoryLabel = (category: string) => {
  const normalized = category.toLowerCase().replace(/_/g, ' ')
  if (normalized.includes('technical')) {
    return { 
      label: 'Technical Accuracy', 
      bg: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
      border: 'border-l-violet-500/60'
    }
  }
  if (normalized.includes('specificity') || normalized.includes('star') || normalized.includes('approach')) {
    return { 
      label: 'STAR Method Details', 
      bg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      border: 'border-l-indigo-500/60'
    }
  }
  if (normalized.includes('behavioral')) {
    return { 
      label: 'Behavioral', 
      bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      border: 'border-l-emerald-500/60'
    }
  }
  if (normalized.includes('clarity') || normalized.includes('communication') || normalized.includes('delivery')) {
    return { 
      label: 'Clarity & Delivery', 
      bg: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
      border: 'border-l-pink-500/60'
    }
  }
  return { 
    label: category.toUpperCase(), 
    bg: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20',
    border: 'border-l-zinc-500/60'
  }
}

export function CoachDashboardClient({ initialHistory, userId }: CoachDashboardClientProps) {
  const router = useRouter()
  const [role, setRole] = useState('')
  const [sessionType, setSessionType] = useState('mixed')
  const [maxQuestions, setMaxQuestions] = useState('5')
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-3.5xl font-extrabold tracking-tight gradient-text">Practice Mode</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-300 border border-violet-500/20 shadow-sm shadow-violet-500/5">
              <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse" /> Powered by AI Coach
            </span>
          </div>
          <p className="text-sm text-zinc-400">Conduct fully interactive mock interviews tailored to your target roles.</p>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Card: Start Session Form */}
        <div className="glass-card p-6 md:p-8 lg:col-span-7 flex flex-col">
          <form onSubmit={handleStartSession} className="space-y-6 flex flex-col justify-between h-full">
            <div className="space-y-6">
              {/* Card Header */}
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center">
                  <BrainCircuit className="h-5.5 w-5.5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-100">Start Practice Session</h2>
                  <p className="text-xs text-zinc-400">Configure your target role and question preferences.</p>
                </div>
              </div>

              {/* Role Input with Suggestion Pills */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Target Role
                  </label>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase">Required</span>
                </div>
                <Input
                  placeholder="e.g. Senior React Developer at Stripe"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isLoading}
                  className="bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.04] border-white/[0.08] hover:border-white/[0.12] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl h-11 text-zinc-100 transition-all placeholder:text-zinc-500 text-sm"
                />
                
                {/* Popular Tags */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Popular Roles:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_ROLES.map((roleName) => (
                      <button
                        key={roleName}
                        type="button"
                        onClick={() => setRole(roleName)}
                        disabled={isLoading}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer font-medium ${
                          role === roleName
                            ? 'bg-violet-500/20 border-violet-500/50 text-violet-200'
                            : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/[0.15] hover:bg-white/[0.04] hover:text-zinc-200'
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
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Interview Type</label>
                  <Select
                    value={sessionType}
                    onValueChange={(val) => setSessionType(val || 'mixed')}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.04] border-white/[0.08] hover:border-white/[0.12] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl h-11 text-zinc-200 transition-all text-left px-3 text-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0f12]/95 backdrop-blur-md border-white/[0.08] text-zinc-200 rounded-xl shadow-xl">
                      <SelectItem value="mixed">Mixed (Behavioral + Tech)</SelectItem>
                      <SelectItem value="behavioral">Behavioral (STAR Method)</SelectItem>
                      <SelectItem value="technical">Technical / Coding Concepts</SelectItem>
                      <SelectItem value="rapid_fire">Rapid Fire / Quick Concepts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Total Questions</label>
                  <Select
                    value={maxQuestions}
                    onValueChange={(val) => setMaxQuestions(val || '5')}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.04] border-white/[0.08] hover:border-white/[0.12] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl h-11 text-zinc-200 transition-all text-left px-3 text-sm">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0f12]/95 backdrop-blur-md border-white/[0.08] text-zinc-200 rounded-xl shadow-xl">
                      <SelectItem value="3">3 Questions (Speed Run)</SelectItem>
                      <SelectItem value="5">5 Questions (Standard)</SelectItem>
                      <SelectItem value="10">10 Questions (Full Mock)</SelectItem>
                      <SelectItem value="15">15 Questions (Deep Dive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/[0.06] pt-5" />

              {/* Premium Feature Showcase */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  What to expect in your mock interview:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex items-start gap-3 bg-white/[0.01] border border-white/[0.03] p-3.5 rounded-xl hover:bg-white/[0.02] hover:border-white/[0.06] transition-all duration-300">
                    <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <BrainCircuit className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Real-time Evaluation</h4>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">STAR structure, technical accuracy, and filler word detection.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/[0.01] border border-white/[0.03] p-3.5 rounded-xl hover:bg-white/[0.02] hover:border-white/[0.06] transition-all duration-300">
                    <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Dynamic Follow-ups</h4>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">System responds directly to the depth of your prior answers.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/[0.01] border border-white/[0.03] p-3.5 rounded-xl hover:bg-white/[0.02] hover:border-white/[0.06] transition-all duration-300">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Targeted Practice</h4>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">Questions dynamically adapt to address your tracked weaknesses.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/[0.01] border border-white/[0.03] p-3.5 rounded-xl hover:bg-white/[0.02] hover:border-white/[0.06] transition-all duration-300">
                    <div className="h-7 w-7 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                      <History className="h-4 w-4 text-pink-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Session Reports</h4>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">Get performance analysis, scoring breakdown, and coaching advice.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/[0.06] mt-6">
              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/10 hover:shadow-violet-500/25 transition-all duration-300 rounded-xl font-bold h-12 text-sm cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center w-full">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Initializing Mock Session...
                  </span>
                ) : (
                  <>
                    <Play className="h-4.5 w-4.5 mr-2 animate-pulse" /> Start Mock Interview
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Card: Progress & Stats */}
        <div className="glass-card p-6 md:p-8 lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/[0.06] pb-5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center">
                <TrendingUp className="h-5.5 w-5.5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Your Progress</h2>
                <p className="text-xs text-zinc-400">Your continuous evaluation metrics.</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl flex items-center justify-between hover:bg-white/[0.02] hover:border-white/[0.06] transition-all duration-300">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Sessions</span>
                  <p className="text-3xl font-extrabold text-zinc-100 tracking-tight">{initialHistory.total_sessions}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <History className="h-4.5 w-4.5" />
                </div>
              </div>
              
              <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl flex items-center justify-between hover:bg-white/[0.02] hover:border-white/[0.06] transition-all duration-300">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Avg Score</span>
                  <p className="text-3xl font-extrabold text-violet-400 tracking-tight">
                    {initialHistory.total_sessions > 0 ? `${initialHistory.avg_score.toFixed(1)}` : '—'}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
              </div>
            </div>

            {/* Visual Progress Bar representing average score */}
            <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-medium">Global Score Index</span>
                <span className="font-bold text-violet-400">
                  {initialHistory.total_sessions > 0 ? `${(initialHistory.avg_score * 10).toFixed(0)}%` : '0%'}
                </span>
              </div>
              <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-indigo-600 rounded-full transition-all duration-1000"
                  style={{ width: `${initialHistory.total_sessions > 0 ? (initialHistory.avg_score / 10) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 leading-normal">
                {initialHistory.total_sessions > 0 
                  ? 'Keep completing sessions to scale this rating and unlock deeper AI evaluation insights.' 
                  : 'Start your first interview session to establish your performance scoring index.'}
              </p>
            </div>

            {/* Weakness section */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500/90" /> Top Focus Areas
              </h3>
              {initialHistory.top_weaknesses && initialHistory.top_weaknesses.length > 0 ? (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/[0.08] scrollbar-track-transparent">
                  {initialHistory.top_weaknesses.map((w: any, idx: number) => {
                    const badge = getCategoryLabel(w.category)
                    return (
                      <div 
                        key={idx} 
                        className={`flex gap-3 bg-white/[0.01] border border-white/[0.03] border-l-3 ${badge.border} p-3.5 rounded-xl hover:bg-white/[0.02] hover:border-white/[0.06] transition-all duration-300`}
                      >
                        <div className="space-y-2 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest border ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-semibold uppercase">Priority Focus</span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed font-medium">{w.weakness_description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-white/[0.06] rounded-xl text-center space-y-2.5">
                  <div className="h-8 w-8 rounded-full bg-zinc-500/10 flex items-center justify-center text-zinc-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-300">No focus areas logged yet</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                      Complete sessions to build your profile. The AI Coach will map focus areas here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.06] mt-6">
            <Button
              variant="outline"
              disabled={initialHistory.sessions.length === 0}
              onClick={() => router.push('/dashboard/sessions')}
              className="w-full border-white/[0.08] hover:bg-white/[0.04] text-zinc-300 hover:text-white rounded-xl h-11 text-xs font-semibold cursor-pointer transition-colors"
            >
              <History className="h-4 w-4 mr-2" /> View Sessions History
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
