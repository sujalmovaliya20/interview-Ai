'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account details and email address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email address</label>
            <div className="flex gap-4">
              <Input value={email} disabled className="max-w-md" />
              <Button disabled variant="secondary" title="Contact support">Change email</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription & Credits</CardTitle>
          <CardDescription>Manage your billing and view your current credit balance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Current plan:</span>
            {isUnlimited ? (
              <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 shadow-none">Pro</Badge>
            ) : (
              <Badge variant="outline">Free</Badge>
            )}
          </div>

          <div className="max-w-md space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Credits balance</span>
              <span>{isUnlimited ? '∞' : (credits?.balance || 0).toFixed(1)} available</span>
            </div>
            {!isUnlimited && (
              <Progress value={progressValue} className="h-2 [&>div]:bg-primary" />
            )}
          </div>

          <div className="flex gap-4">
            <Button disabled variant="outline">Manage billing</Button>
            <Button nativeButton={false} render={<Link href="/pricing" />}>
              Buy credits
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your default interview settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Model</label>
            <Select value={model} onValueChange={handleModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Language</label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Permanently delete your account and all associated data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger render={<Button variant="destructive" />}>
              Delete account
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" className="mt-2 sm:mt-0">Cancel</Button>
                <Button variant="destructive" disabled onClick={handleDelete}>Delete Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
