'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Plus,
  History,
  FileText,
  Settings2,
  LogOut,
  Brain
} from 'lucide-react'
import { LogoIcon } from '@/components/marketing/CustomIcons'
import { cn } from '@/lib/utils'
import { CreditsWidget } from './CreditsWidget'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'

const navItems = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'New Interview', href: '/dashboard/session/new', icon: Plus },
  { label: 'Sessions', href: '/dashboard/sessions', icon: History },
  { label: 'Mock Interview', href: '/dashboard/coach', icon: Brain },
  { label: 'My Resume', href: '/dashboard/documents', icon: FileText },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings2 },
]

export function Sidebar({
  user,
  isMobile = false,
  onNavigate
}: {
  user: {
    email: string;
    id: string;
    full_name?: string | null;
    avatar_url?: string | null;
  },
  isMobile?: boolean;
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    window.location.href = '/'
  }

  const initials = (user.full_name || user.email).substring(0, 2).toUpperCase()

  const content = (
    <div className="flex flex-col h-full bg-card/95 backdrop-blur-xl">
      {/* Logo / Branding */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
          <LogoIcon className="h-8 w-8" />
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            InterviewAI
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              id={
                item.label === 'My Resume' ? 'tour-my-resume' :
                item.label === 'New Interview' ? 'tour-new-interview' :
                item.label === 'Mock Interview' ? 'tour-mock-interview' :
                undefined
              }
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-violet-500/10 text-violet-600 dark:text-violet-300 font-medium shadow-sm shadow-violet-500/5"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-violet-400 to-indigo-400" />
              )}
              <item.icon className={cn(
                "h-[18px] w-[18px] transition-colors",
                isActive ? "text-violet-500 dark:text-violet-400" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border mt-auto space-y-4">
        <CreditsWidget />
        <Separator className="bg-border" />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex-1 flex items-center gap-3 p-2 rounded-xl hover:bg-accent transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 min-w-0">
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-violet-500/10">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || user.email}
                    className="h-full w-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <AvatarFallback className="bg-violet-500/10 text-violet-500 dark:text-violet-400 text-xs font-semibold">{initials}</AvatarFallback>
                )}
              </Avatar>
              <span className="text-sm font-medium truncate flex-1 text-foreground">{user.full_name || user.email}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border backdrop-blur-xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-muted-foreground">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => { router.push('/dashboard/settings'); onNavigate?.(); }} className="text-foreground focus:bg-accent focus:text-accent-foreground">
                  <Settings2 className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-red-500 dark:text-red-400 focus:bg-red-500/10 focus:text-red-500 dark:focus:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <aside className="flex flex-col h-full w-full bg-card">
        {content}
      </aside>
    )
  }

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-border h-screen sticky top-0 shrink-0">
      {content}
    </aside>
  )
}
