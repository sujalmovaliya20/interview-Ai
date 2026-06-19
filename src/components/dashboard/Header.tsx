'use client'

import { Sidebar } from './Sidebar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu, Settings2, LogOut } from 'lucide-react'
import { useState } from 'react'
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
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Header({
  title,
  user
}: {
  title: string;
  user: {
    email: string;
    id: string;
    full_name?: string | null;
    avatar_url?: string | null;
  }
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const initials = (user.full_name || user.email).substring(0, 2).toUpperCase()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    window.location.href = '/'
  }

  return (
    <header className="lg:hidden h-14 border-b border-border flex items-center justify-between px-4 bg-card/90 backdrop-blur-xl shrink-0 relative z-20">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent" />}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-card border-r border-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <Sidebar user={user} isMobile onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <h1 className="text-sm font-semibold truncate flex-1 text-center px-4 text-foreground">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 flex">
            <Avatar className="h-8 w-8 ring-2 ring-violet-500/10">
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
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border-border backdrop-blur-xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')} className="text-foreground focus:bg-accent focus:text-accent-foreground">
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
      </div>
    </header>
  )
}
