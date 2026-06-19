'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import Link from 'next/link'
import { Profile, Credits } from '@/types'
import { User, CreditCard, SlidersHorizontal, AlertTriangle } from 'lucide-react'

interface SettingsClientProps {
  profile: Profile | null
  credits: Credits | null
  email: string
}

export function SettingsClient({ profile, credits, email }: SettingsClientProps) {
  const [model, setModel] = useState<string>('gpt-4o')
  const [language, setLanguage] = useState<string>('english')

  useEffect(() => {
    const savedModel = localStorage.getItem('interviewai_default_model')
    const savedLang = localStorage.getItem('interviewai_default_language')
    if (savedModel) setModel(savedModel)
    if (savedLang) setLanguage(savedLang)
  }, [])

  const handleModelChange = (v: string | null) => {
    if (!v) return
    setModel(v)
    localStorage.setItem('interviewai_default_model', v)
    toast.success('Default model preference saved')
  }

  const handleLanguageChange = (v: string | null) => {
    if (!v) return
    setLanguage(v)
    localStorage.setItem('interviewai_default_language', v)
    toast.success('Default language preference saved')
  }

  const handleDelete = () => {
    console.log('Account deletion requested')
    toast.error('Account deletion is disabled in this environment')
  }

  const progressValue = Math.min(((credits?.balance || 0) / 10) * 100, 100)
  const isUnlimited = credits?.is_unlimited

  return (
    <div className="space-y-6">
      {/* Account Card */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center gap-3 bg-white/[0.01]">
          <div className="p-2 bg-gradient-to-tr from-violet-500/15 to-indigo-500/15 border border-violet-500/15 rounded-xl">
            <User className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Account</h2>
            <p className="text-xs text-zinc-500">Manage your account details and email address.</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Email address</label>
            <div className="flex gap-4">
              <Input 
                value={email} 
                disabled 
                className="max-w-md bg-white/[0.03] border-white/[0.08] text-zinc-400 rounded-xl" 
              />
              <Button 
                disabled 
                variant="secondary" 
                title="Contact support"
                className="bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:bg-white/[0.06] rounded-xl"
              >
                Change email
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center gap-3 bg-white/[0.01]">
          <div className="p-2 bg-gradient-to-tr from-indigo-500/15 to-blue-500/15 border border-indigo-500/15 rounded-xl">
            <CreditCard className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Subscription & Credits</h2>
            <p className="text-xs text-zinc-500">Manage your billing and view your current credit balance.</p>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-300">Current plan:</span>
            {isUnlimited ? (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/15">Pro</span>
            ) : (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-white/[0.06] text-zinc-400 border border-white/[0.08]">Free</span>
            )}
          </div>

          <div className="max-w-md space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-zinc-300">Credits balance</span>
              <span className="text-zinc-400">{isUnlimited ? '∞' : (credits?.balance || 0).toFixed(1)} available</span>
            </div>
            {!isUnlimited && (
              <Progress 
                value={progressValue} 
                className="h-2 bg-white/[0.06] rounded-full [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-indigo-500 [&>div]:rounded-full" 
              />
            )}
          </div>

          <div className="flex gap-4">
            <Button 
              disabled 
              variant="outline"
              className="border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] rounded-xl"
            >
              Manage billing
            </Button>
            <Button 
              nativeButton={false} 
              render={<Link href="/dashboard" />}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/10 hover:shadow-lg hover:shadow-violet-500/20 transition-all rounded-xl font-semibold"
            >
              Buy credits
            </Button>
          </div>
        </div>
      </div>

      {/* Preferences Card */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center gap-3 bg-white/[0.01]">
          <div className="p-2 bg-gradient-to-tr from-emerald-500/15 to-teal-500/15 border border-emerald-500/15 rounded-xl">
            <SlidersHorizontal className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Preferences</h2>
            <p className="text-xs text-zinc-500">Customize your default interview settings.</p>
          </div>
        </div>
        <div className="p-6 space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Default Model</label>
            <Select value={model} onValueChange={handleModelChange}>
              <SelectTrigger className="bg-white/[0.03] border-white/[0.08] rounded-xl text-zinc-200 focus:ring-violet-500/20">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f12] border-white/[0.08] backdrop-blur-xl">
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Default Language</label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="bg-white/[0.03] border-white/[0.08] rounded-xl text-zinc-200 focus:ring-violet-500/20">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f12] border-white/[0.08] backdrop-blur-xl">
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card overflow-hidden border-red-500/15">
        <div className="p-5 border-b border-red-500/10 flex items-center gap-3 bg-red-500/[0.02]">
          <div className="p-2 bg-red-500/10 border border-red-500/15 rounded-xl">
            <AlertTriangle className="w-4.5 h-4.5 text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-400">Danger Zone</h2>
            <p className="text-xs text-zinc-500">Permanently delete your account and all associated data.</p>
          </div>
        </div>
        <div className="p-6">
          <Dialog>
            <DialogTrigger render={<Button variant="destructive" className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 rounded-xl" />}>
              Delete account
            </DialogTrigger>
            <DialogContent className="bg-[#0f0f12] border-white/[0.08] backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Are you absolutely sure?</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" className="mt-2 sm:mt-0 border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:bg-white/[0.06] rounded-xl">Cancel</Button>
                <Button variant="destructive" disabled onClick={handleDelete} className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl">Delete Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
