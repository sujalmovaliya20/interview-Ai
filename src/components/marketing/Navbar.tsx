import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import { MobileMenu } from '@/components/marketing/MobileMenu'
import { LogoIcon } from './CustomIcons'

interface NavbarProps {
  user: User | null
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-900/60 bg-black/40 backdrop-blur-lg">
      <div className="container mx-auto px-4 md:px-6 flex h-14 sm:h-16 items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 sm:space-x-2.5 transition-opacity hover:opacity-90">
          <LogoIcon className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="font-extrabold tracking-tight text-zinc-100 text-base sm:text-lg bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
            InterviewAI
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <Link href="#features" className="text-zinc-400 hover:text-zinc-200 transition-colors duration-150">
            Features
          </Link>
          <Link href="#process" className="text-zinc-400 hover:text-zinc-200 transition-colors duration-150">
            How It Works
          </Link>
          <Link href="#pricing" className="text-zinc-400 hover:text-zinc-200 transition-colors duration-150">
            Pricing
          </Link>
        </nav>

        {/* Dynamic CTAs */}
        <div className="flex items-center space-x-2 sm:space-x-3.5">
          {user ? (
            <Button
              nativeButton={false}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-violet-500/10 hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.99] transition-all border-0 h-9 sm:h-10 px-4 sm:px-5 text-sm flex items-center gap-1.5"
              render={<Link href="/dashboard" />}
            >
              <span className="hidden sm:inline">Go to Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
              <span className="transition-transform group-hover/button:translate-x-0.5">→</span>
            </Button>
          ) : (
            <>
              <Button
                nativeButton={false}
                variant="ghost"
                className="hidden sm:inline-flex text-zinc-300 hover:text-white hover:bg-zinc-800/40 rounded-xl"
                render={<Link href="/auth/signin" />}
              >
                Sign In
              </Button>
              <Button
                nativeButton={false}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-violet-500/10 hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.99] transition-all border-0 h-9 sm:h-10 px-4 sm:px-5 text-sm"
                render={<Link href="/auth/signin" />}
              >
                Get Started
              </Button>
            </>
          )}
          
          {/* Mobile Menu Toggle */}
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
