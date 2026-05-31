'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Plus, 
  History, 
  FileText, 
  Settings, 
  LogOut,
  BrainCircuit,
  Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CreditsWidget } from '@/components/dashboard/CreditsWidget'
import { createClient } from '@/lib/supabase/client'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navItems = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'New Session', href: '/dashboard/session/new', icon: Plus },
  { name: 'Sessions', href: '/dashboard/sessions', icon: History },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span>InterviewAI</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`) && item.href !== '/dashboard'
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  isActive ? "bg-muted text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t">
        <CreditsWidget />
        <div className="flex flex-col space-y-4">
          <div className="text-sm truncate text-muted-foreground px-1" title={userEmail}>
            {userEmail}
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )

  if (pathname.startsWith('/dashboard/session/')) {
    return null
  }

  return (
    <>
      <div className="hidden border-r bg-muted/20 lg:block lg:w-64 lg:shrink-0 h-screen sticky top-0">
        {SidebarContent}
      </div>
      <div className="lg:hidden flex items-center p-4 border-b bg-background sticky top-0 z-10">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" className="shrink-0" />}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
            {SidebarContent}
          </SheetContent>
        </Sheet>
        <div className="flex-1 flex justify-center font-semibold">
          <BrainCircuit className="h-5 w-5 text-primary mr-2" /> InterviewAI
        </div>
      </div>
    </>
  )
}
