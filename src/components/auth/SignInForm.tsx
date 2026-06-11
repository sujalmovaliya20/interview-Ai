'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { signIn } from '@/app/auth/actions'
import { useElectronBridge } from '@/hooks/useElectronBridge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

const initialState = {
  error: null,
  success: false,
  email: null,
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send magic link'}
    </Button>
  )
}

export function SignInForm({ isDesktop }: { isDesktop?: boolean }) {
  const [state, formAction] = useActionState(signIn, initialState as any)
  const { isElectron } = useElectronBridge()

  if (isElectron) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign in to InterviewAI</CardTitle>
          <CardDescription>
            For security, please sign in using your regular web browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full" 
            onClick={() => window.electronAPI.openExternal(window.location.origin + '/auth/signin?desktop=true')}
          >
            Open in Browser
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (state?.success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Check your inbox</CardTitle>
          <CardDescription>
            We sent a magic link to <span className="font-medium text-foreground">{state.email}</span>.
            Click the link to sign in.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Sign in to InterviewAI</CardTitle>
        <CardDescription>Enter your email and we'll send you a magic link</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="desktop" value={isDesktop ? 'true' : 'false'} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
            />
            {state?.error && (
              <p className="text-sm font-medium text-destructive">{state.error}</p>
            )}
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
