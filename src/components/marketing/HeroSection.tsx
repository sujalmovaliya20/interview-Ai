import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Mic, Shield, Code2 } from 'lucide-react'

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-background pt-24 pb-32">
      <div className="container mx-auto px-4 text-center">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold mb-6 text-muted-foreground">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
          InterviewAI 2.0 is now live
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">
          Ace every interview with <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
            real-time AI answers
          </span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-12">
          Invisible overlay providing you with the perfect answers, coding hints, and talking points right as your interviewer asks the question.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-20">
          <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8" render={<Link href="/auth/signin" />}>
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 px-8" render={<Link href="#features" />}>See how it works</Button>
        </div>

        <div className="text-sm font-medium text-muted-foreground mb-8">
          TRUSTED BY CANDIDATES AT TOP TECH COMPANIES
        </div>
        
        <div id="features" className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-32 text-left">
          <div className="p-6 rounded-2xl bg-card border">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Real-time transcription</h3>
            <p className="text-muted-foreground">Flawless audio capture streams directly to our high-speed LLMs with ultra-low latency.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Invisible overlay</h3>
            <p className="text-muted-foreground">A totally undetectable floating window over your video call that keeps you looking at the camera.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <Code2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Full coding support</h3>
            <p className="text-muted-foreground">Deep integrations for LeetCode style rounds. Paste the question, get the optimal solution.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
