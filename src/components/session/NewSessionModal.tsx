'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, BrainCircuit, Zap, ArrowLeft, Info } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

import { useElectronBridge } from '@/hooks/useElectronBridge'

const LANGUAGES = [
  { val: 'en', label: '🇺🇸 English' },
  { val: 'hi', label: '🇮🇳 Hindi' },
  { val: 'es', label: '🇪🇸 Spanish' },
  { val: 'fr', label: '🇫🇷 French' },
  { val: 'de', label: '🇩🇪 German' },
  { val: 'pt', label: '🇧🇷 Portuguese' },
  { val: 'zh', label: '🇨🇳 Chinese' },
  { val: 'ja', label: '🇯🇵 Japanese' },
  { val: 'ko', label: '🇰🇷 Korean' },
  { val: 'ar', label: '🇸🇦 Arabic' }
]

const schema = z.object({
  model: z.enum(['abacusai/dracarys-llama-3.1-70b-instruct', 'mistralai/mistral-large']),
  language: z.string().min(2),
  extraContext: z.string().max(500).optional()
})

export function NewSessionModal() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [model, setModel] = useState<'abacusai/dracarys-llama-3.1-70b-instruct' | 'mistralai/mistral-large'>('abacusai/dracarys-llama-3.1-70b-instruct')
  const [language, setLanguage] = useState('en')
  const [context, setContext] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isElectron, startSession } = useElectronBridge()
  
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [isLoadingCredits, setIsLoadingCredits] = useState(true)

  useEffect(() => {
    async function loadCredits() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('credits')
        .select('balance, is_unlimited')
        .eq('user_id', user.id)
        .single()
      
      if (data) {
        setCreditBalance(data.balance)
        setIsUnlimited(data.is_unlimited)
      }
      setIsLoadingCredits(false)
    }
    loadCredits()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      schema.parse({ model, language, extraContext: context })

      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, language, extraContext: context })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create session')
      }

      toast.success('Session created!')
      
      if (isElectron) {
        startSession(`/dashboard/session/${data.sessionId}`)
      } else {
        router.push(`/dashboard/session/${data.sessionId}`)
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error('Validation error. Please check your inputs.')
      } else {
        toast.error(err.message || 'Something went wrong')
      }
      setIsSubmitting(false)
    }
  }

  const charCount = context.length
  const charCountColor = charCount > 490 ? 'text-red-500 font-bold' : charCount > 400 ? 'text-amber-500' : 'text-muted-foreground'
  
  const hasNoCredits = !isUnlimited && creditBalance !== null && creditBalance === 0
  const minutesAvailable = creditBalance !== null ? Math.floor(creditBalance / 0.5) * 30 : 0

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl mb-4 text-left">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
      </div>
      
      <Card className="w-full max-w-xl bg-card/65 backdrop-blur-xl border border-border/60 shadow-xl shadow-foreground/5 rounded-2xl overflow-hidden">
        <CardHeader className="text-center pb-6 pt-8 border-b border-border/30">
          <div className="mx-auto bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-violet-500/5">
            <Sparkles className="h-7 w-7 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">New Interview Session</CardTitle>
          <CardDescription className="text-sm">
            Configure your AI assistant before starting
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Model</Label>
              <RadioGroup value={model} onValueChange={(val: any) => setModel(val)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="abacusai/dracarys-llama-3.1-70b-instruct" id="dracarys" className="peer sr-only" />
                  <Label
                    htmlFor="dracarys"
                    className="flex flex-col rounded-xl border-2 border-border/80 bg-card/40 p-4 hover:border-violet-500/40 hover:bg-violet-500/[0.02] peer-data-[state=checked]:border-violet-500 peer-data-[state=checked]:bg-violet-500/[0.04] peer-data-[state=checked]:shadow-md peer-data-[state=checked]:shadow-violet-500/5 cursor-pointer transition-all hover:scale-[1.02] duration-300 relative group"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4.5 w-4.5 text-purple-500 group-hover:animate-pulse" />
                        <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">Dracarys 70B</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-semibold bg-background/50 border-purple-500/20 text-purple-600 dark:text-purple-400 px-1.5 py-0">Free</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground leading-relaxed mt-1">Best for technical depth. Recommended.</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="mistralai/mistral-large" id="mistral" className="peer sr-only" />
                  <Label
                    htmlFor="mistral"
                    className="flex flex-col rounded-xl border-2 border-border/80 bg-card/40 p-4 hover:border-blue-500/40 hover:bg-blue-500/[0.02] peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-500/[0.04] peer-data-[state=checked]:shadow-md peer-data-[state=checked]:shadow-blue-500/5 cursor-pointer transition-all hover:scale-[1.02] duration-300 relative group"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4.5 w-4.5 text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">Mistral Large</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-semibold bg-background/50 border-blue-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0">Free</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground leading-relaxed mt-1">Fast responses. Great for behavioral questions.</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="language" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Language</Label>
              <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
                <SelectTrigger id="language" className="h-11 bg-card/40 border-border/80 focus-visible:ring-violet-500/20 rounded-xl px-3.5 transition-all">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.val} value={lang.val}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="context" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Extra Context (Optional)</Label>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted/60 ${charCountColor}`}>{charCount} / 500</span>
              </div>
              <Textarea
                id="context"
                placeholder="e.g. I'm interviewing for a Senior React Engineer role at Stripe. Focus on system design answers."
                className="resize-none h-28 bg-card/40 border-border/80 focus-visible:ring-violet-500/20 focus-visible:border-violet-500/50 rounded-xl p-3.5 text-sm transition-all"
                maxLength={500}
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
            
            {/* Credit Cost Notice */}
            {!isLoadingCredits && (
              hasNoCredits ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex gap-3">
                  <Info className="h-5 w-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">You need credits to start</span>
                    <span className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">Each session uses 0.5 credits per 30 minutes.</span>
                    <Link href="/pricing" className="text-xs text-red-600 font-semibold underline mt-2 hover:text-red-700 transition-colors">Get credits</Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-violet-500/10 bg-gradient-to-r from-violet-500/[0.03] to-indigo-500/[0.03] p-4 flex gap-3 shadow-inner">
                  <Info className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-foreground/95">Each session uses 0.5 credits per 30 minutes</span>
                    {isUnlimited ? (
                      <span className="text-xs text-muted-foreground mt-1">Your balance: <span className="font-bold text-foreground">Unlimited</span></span>
                    ) : (
                      <span className="text-xs text-muted-foreground mt-1">
                        Your balance: <span className="font-semibold text-foreground">{creditBalance} credits</span> ({minutesAvailable} minutes available)
                      </span>
                    )}
                  </div>
                </div>
              )
            )}
            
          </CardContent>
          <CardFooter className="pt-2 pb-6 px-6">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full text-base h-12 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/10 transition-all hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.99] cursor-pointer text-white" 
              disabled={isSubmitting || hasNoCredits || isLoadingCredits}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating session...
                </>
              ) : (
                'Start Session →'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
