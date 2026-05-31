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

export function Header({ title, user }: { title: string; user: { email: string; id: string } }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const initials = user.email.substring(0, 2).toUpperCase()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  return (
    <header className="lg:hidden h-14 border-b border-border flex items-center justify-between px-4 bg-background shrink-0">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="shrink-0" />}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <Sidebar user={user} isMobile onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <h1 className="text-sm font-semibold truncate flex-1 text-center px-4">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring flex">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
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
    </header>
  )
}
