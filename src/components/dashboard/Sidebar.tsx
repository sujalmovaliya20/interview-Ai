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

export function Sidebar({ user, isMobile = false, onNavigate }: { user: { email: string; id: string }, isMobile?: boolean, onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const initials = user.email.substring(0, 2).toUpperCase()

  const content = (
    <div className="flex flex-col h-full bg-background">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">InterviewAI</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
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
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <CreditsWidget />
        <Separator className="my-4" />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-muted transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate flex-1">{user.email}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { router.push('/dashboard/settings'); onNavigate?.(); }}>
                <Settings2 className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  if (pathname.startsWith('/dashboard/session/')) {
    return null
  }

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-border h-screen sticky top-0 shrink-0">
      {content}
    </aside>
  )
}
