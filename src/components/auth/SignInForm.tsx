'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { signIn } from '@/app/auth/actions'
import { useElectronBridge } from '@/hooks/useElectronBridge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const initialState = {
  error: null,
  success: false,
  email: null,
}

import { BrainCircuit } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button 
      type="submit" 
      className="w-full h-11 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/10 transition-all hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.99] cursor-pointer border-0" 
      disabled={pending}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send magic link'}
    </Button>
  )
}

export function SignInForm({ isDesktop }: { isDesktop?: boolean }) {
  const [state, formAction] = useActionState(signIn, initialState as any)
  const { isElectron } = useElectronBridge()
  const supabase = createClient()
  const [googleLoading, setGoogleLoading] = useState(false)

  async function signInWithGoogle() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    if (error) {
      console.error('[Auth] Google OAuth error:', error)
      toast.error(error.message)
      setGoogleLoading(false)
    }
  }

  if (isElectron) {
    return (
      <Card className="w-full max-w-md mx-auto bg-zinc-950/45 backdrop-blur-xl border border-zinc-800/80 shadow-2xl rounded-3xl p-3 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/5">
            <BrainCircuit className="h-6 w-6 text-violet-400" />
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Sign in to InterviewAI
          </CardTitle>
          <CardDescription className="text-zinc-400 mt-2">
            For security, please sign in using your regular web browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Button 
            className="w-full h-11 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md transition-all active:scale-[0.99] cursor-pointer border-0" 
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
      <Card className="w-full max-w-md mx-auto bg-zinc-950/45 backdrop-blur-xl border border-zinc-800/80 shadow-2xl rounded-3xl p-3 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <CardHeader className="text-center pt-8 pb-6">
          <div className="mx-auto bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/5">
            <BrainCircuit className="h-6 w-6 text-violet-400" />
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Check your inbox
          </CardTitle>
          <CardDescription className="text-zinc-400 mt-2">
            We sent a magic link to <span className="font-semibold text-zinc-100">{state.email}</span>.
            Click the link in your email to sign in.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-zinc-950/45 backdrop-blur-xl border border-zinc-800/80 shadow-2xl rounded-3xl p-3 relative overflow-hidden">
      {/* Decorative ambient glows inside the card */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="text-center pt-8 pb-6">
        <div className="mx-auto bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/5">
          <BrainCircuit className="h-6 w-6 text-violet-400" />
        </div>
        <CardTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          Sign in to InterviewAI
        </CardTitle>
        <CardDescription className="text-zinc-400 mt-1.5">
          Ace your interviews with real-time AI assistance
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        {/* Google OAuth Button */}
        <Button
          type="button"
          className="w-full h-11 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-all font-medium text-zinc-100 flex items-center justify-center gap-3 active:scale-[0.99] cursor-pointer"
          onClick={signInWithGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800/80" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0f0f12] px-3 text-zinc-500 font-medium">or continue with email</span>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="desktop" value={isDesktop ? 'true' : 'false'} />
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300 font-medium text-xs">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              className="bg-zinc-950/40 border-zinc-800/80 focus:border-violet-500/80 focus:ring-violet-500/20 rounded-xl h-11 text-zinc-100 placeholder:text-zinc-500 transition-all focus-visible:ring-2 focus-visible:ring-violet-500/20"
              required
            />
            {state?.error && (
              <p className="text-xs font-semibold text-red-400 mt-1">{state.error}</p>
            )}
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
