'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

const LANGUAGES = [
  { val: 'en', label: 'English' },
  { val: 'hi', label: 'Hindi' },
  { val: 'es', label: 'Spanish' },
  { val: 'fr', label: 'French' },
  { val: 'de', label: 'German' },
  { val: 'pt', label: 'Portuguese' },
  { val: 'zh', label: 'Chinese' },
  { val: 'ja', label: 'Japanese' },
  { val: 'ko', label: 'Korean' },
  { val: 'ar', label: 'Arabic' }
]

const schema = z.object({
  model: z.enum(['claude', 'gpt-5']),
  language: z.string().min(2),
  extraContext: z.string().max(500).optional()
})

export function NewSessionModal() {
  const router = useRouter()
  const [model, setModel] = useState<'claude' | 'gpt-5'>('claude')
  const [language, setLanguage] = useState('en')
  const [context, setContext] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      router.push(`/dashboard/session/${data.sessionId}`)
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error('Validation error. Please check your inputs.')
      } else {
        toast.error(err.message || 'Something went wrong')
      }
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Configure Your Interview
          </CardTitle>
          <CardDescription>
            Customize the AI interviewer to match your target role.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>AI Model</Label>
              <RadioGroup value={model} onValueChange={(val: any) => setModel(val)} className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="claude" id="claude" className="peer sr-only" />
                  <Label
                    htmlFor="claude"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-500 [&:has([data-state=checked])]:border-purple-500 cursor-pointer"
                  >
                    <div className="mb-2 w-full flex justify-between items-center">
                      <span className="font-semibold text-purple-500">Claude Sonnet</span>
                      <Badge className="bg-purple-500 hover:bg-purple-600 text-white border-transparent">Recommended</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground w-full">Best for coding & system design</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="gpt-5" id="gpt-5" className="peer sr-only" />
                  <Label
                    htmlFor="gpt-5"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 [&:has([data-state=checked])]:border-green-500 cursor-pointer"
                  >
                    <div className="mb-2 w-full flex justify-start items-center">
                      <span className="font-semibold text-green-500">GPT-5</span>
                    </div>
                    <span className="text-sm text-muted-foreground w-full">Great for behavioral questions</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
                <SelectTrigger id="language">
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
              <div className="flex justify-between">
                <Label htmlFor="context">Extra Context (Optional)</Label>
                <span className="text-xs text-muted-foreground">{context.length}/500</span>
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
          </CardContent>
          <CardFooter>
            <Button type="submit" size="lg" className="w-full text-base h-12" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating session...
                </>
              ) : (
                'Start Session'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
