import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrainCircuit } from 'lucide-react'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-14 items-center justify-between">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-bold tracking-tight">InterviewAI</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</Link>
          <Link href="#pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</Link>
          <Link href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">Privacy</Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button nativeButton={false} variant="ghost" render={<Link href="/auth/signin" />}>Sign In</Button>
          <Button nativeButton={false} render={<Link href="/auth/signin" />}>Get Started</Button>
        </div>
      </div>
    </header>
  )
}
