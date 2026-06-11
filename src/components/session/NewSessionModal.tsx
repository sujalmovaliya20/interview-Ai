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
  const charCountColor = charCount > 490 ? 'text-red-500' : charCount > 400 ? 'text-amber-500' : 'text-muted-foreground'
  
  const hasNoCredits = !isUnlimited && creditBalance !== null && creditBalance === 0
  const minutesAvailable = creditBalance !== null ? Math.floor(creditBalance / 0.5) * 30 : 0

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/20">
      <div className="w-full max-w-xl mb-4">
        <Link href="/dashboard" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
      
      <Card className="w-full max-w-xl shadow-lg border-primary/10">
        <CardHeader className="text-center pb-8 pt-8">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">New Interview Session</CardTitle>
          <CardDescription className="text-base">
            Configure your AI assistant before starting
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">AI Model</Label>
              <RadioGroup value={model} onValueChange={(val: any) => setModel(val)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="abacusai/dracarys-llama-3.1-70b-instruct" id="dracarys" className="peer sr-only" />
                  <Label
                    htmlFor="dracarys"
                    className="flex flex-col rounded-xl border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-500 [&:has([data-state=checked])]:bg-purple-500/5 cursor-pointer transition-all"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-purple-500" />
                        <span className="font-semibold text-purple-600 dark:text-purple-400">Dracarys 70B</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-background">Free</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground w-full mt-1">Best for technical depth. Recommended.</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="mistralai/mistral-large" id="mistral" className="peer sr-only" />
                  <Label
                    htmlFor="mistral"
                    className="flex flex-col rounded-xl border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:bg-blue-500/5 cursor-pointer transition-all"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Mistral Large</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-background">Free</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground w-full mt-1">Fast responses. Great for behavioral questions.</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label htmlFor="language" className="text-sm font-semibold">Language</Label>
              <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
                <SelectTrigger id="language" className="h-11">
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

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="context" className="text-sm font-semibold">Extra Context (Optional)</Label>
                <span className={`text-xs ${charCountColor}`}>{charCount} / 500</span>
              </div>
              <Textarea
                id="context"
                placeholder="e.g. I'm interviewing for a Senior React Engineer role at Stripe. Focus on system design answers."
                className="resize-none h-24"
                maxLength={500}
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
            
            {/* Credit Cost Notice */}
            {!isLoadingCredits && (
              hasNoCredits ? (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 flex gap-3">
                  <Info className="h-5 w-5 text-red-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">You need credits to start</span>
                    <span className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">Each session uses 0.5 credits per 30 minutes.</span>
                    <Link href="/pricing" className="text-xs text-red-600 underline mt-2 hover:text-red-700 font-medium">Get credits</Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/50 p-4 flex gap-3">
                  <Info className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Each session uses 0.5 credits per 30 minutes</span>
                    {isUnlimited ? (
                      <span className="text-xs text-muted-foreground mt-1">Your balance: Unlimited</span>
                    ) : (
                      <span className="text-xs text-muted-foreground mt-1">
                        Your balance: {creditBalance} credits ({minutesAvailable} minutes available)
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
              className="w-full text-base h-12 rounded-xl font-medium" 
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
