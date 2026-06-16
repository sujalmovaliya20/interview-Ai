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
  BrainCircuit
} from 'lucide-react'
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
  { label: 'New session', href: '/dashboard/session/new', icon: Plus },
  { label: 'Sessions', href: '/dashboard/sessions', icon: History },
  { label: 'Documents', href: '/dashboard/documents', icon: FileText },
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
    <div className="flex flex-col h-full bg-[#0a0a0c]/95 backdrop-blur-xl">
      {/* Logo / Branding */}
      <div className="h-16 flex items-center px-6 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-500/15 to-indigo-500/15 border border-violet-500/20 flex items-center justify-center shadow-lg shadow-violet-500/5">
            <BrainCircuit className="h-4.5 w-4.5 text-violet-400" />
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
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
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-violet-500/10 text-violet-300 font-medium shadow-sm shadow-violet-500/5"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-violet-400 to-indigo-400" />
              )}
              <item.icon className={cn(
                "h-[18px] w-[18px] transition-colors",
                isActive ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300"
              )} />
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white/[0.06] mt-auto space-y-4">
        <CreditsWidget />
        <Separator className="bg-white/[0.06]" />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex-1 flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 min-w-0">
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-violet-500/10">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || user.email}
                    className="h-full w-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <AvatarFallback className="bg-violet-500/10 text-violet-400 text-xs font-semibold">{initials}</AvatarFallback>
                )}
              </Avatar>
              <span className="text-sm font-medium truncate flex-1 text-zinc-300">{user.full_name || user.email}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#0f0f12] border-white/[0.08] backdrop-blur-xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-zinc-400">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem onClick={() => { router.push('/dashboard/settings'); onNavigate?.(); }} className="text-zinc-300 focus:bg-white/[0.06] focus:text-white">
                  <Settings2 className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:bg-red-500/10 focus:text-red-300">
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
      <aside className="flex flex-col h-full w-full bg-[#0a0a0c]">
        {content}
      </aside>
    )
  }

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-white/[0.06] h-screen sticky top-0 shrink-0">
      {content}
    </aside>
  )
}
