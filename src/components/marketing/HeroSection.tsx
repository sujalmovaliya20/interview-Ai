import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MicTranscriptionIcon, ShieldInvisibleIcon, CodeDsaIcon } from '@/components/marketing/CustomIcons'
import { OverlaySimulator } from '@/components/marketing/OverlaySimulator'

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-[#030303] pt-20 sm:pt-28 pb-16 sm:pb-32">

      {/* Background Video and Glowing effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Loop Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Dark Overlay Gradient to ensure contrast & text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030303]/30 via-[#030303]/80 to-[#030303]" />

        {/* Ambient lighting glows on top of video */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[40rem] w-[60rem] rounded-full bg-radial-gradient from-violet-600/15 to-transparent blur-3xl opacity-80" />
        <div className="absolute top-[25rem] left-1/3 h-[30rem] w-[50rem] rounded-full bg-radial-gradient from-indigo-500/8 to-transparent blur-3xl opacity-50" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">

        {/* Version Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/5 px-3.5 py-1 text-xs font-semibold mb-8 text-violet-300 shadow-sm shadow-violet-500/5 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
          InterviewAI is now Live
        </div>

        {/* Main Title Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 sm:mb-8 text-white leading-tight">
          Ace Every Technical Interview <br className="hidden md:block" />
          With{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-200 to-indigo-400">
            Real-Time AI Coaching
          </span>
        </h1>

        {/* Tagline Subtitle */}
        <p className="max-w-3xl mx-auto text-sm sm:text-base md:text-xl text-zinc-400 mb-8 sm:mb-12 leading-relaxed px-2 sm:px-0">
          A browser-native, real-time interview coaching platform that transcribes your spoken answers, analyzes core technical concepts, and delivers instant, actionable feedback to sharpen your delivery.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-12 sm:mb-20 max-w-sm sm:max-w-none mx-auto px-4 sm:px-0">
          <Button
            nativeButton={false}
            size="lg"
            className="w-full sm:w-auto text-sm font-semibold h-11 px-8 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/15 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.99] transition-all border-0 flex items-center justify-center gap-2 group"
            render={<Link href="/auth/signin" />}
          >
            <span>Start practicing free</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
          <Button
            nativeButton={false}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto text-sm font-semibold h-11 px-8 rounded-xl border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900"
            render={<Link href="#process" />}
          >
            See how it works
          </Button>
        </div>

        {/* Interactive Overlay Simulator Demo */}
        <div className="mb-16 sm:mb-28 -mx-2 sm:mx-0 animate-scale-in">
          <OverlaySimulator />
        </div>

        {/* Trust Badges */}
        <div className="space-y-4">
          <div className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase flex items-center justify-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-violet-500/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3c0 4.5 1.5 6 6 6-4.5 0-6 1.5-6 6 0-4.5-1.5-6-6-6 4.5 0 6-1.5 6-6z" fill="currentColor" />
            </svg>
            <span>Empowering job seekers worldwide</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 md:gap-12 opacity-40 grayscale hover:opacity-75 transition-opacity duration-300">
            <span className="text-white font-extrabold tracking-tight text-sm sm:text-lg">Google</span>
            <span className="text-white font-extrabold tracking-tight text-sm sm:text-lg">Microsoft</span>
            <span className="text-white font-extrabold tracking-tight text-sm sm:text-lg">Amazon</span>
            <span className="text-white font-extrabold tracking-tight text-sm sm:text-lg">Meta</span>
            <span className="text-white font-extrabold tracking-tight text-sm sm:text-lg">Stripe</span>
          </div>
        </div>

        {/* Core Features Grid */}
        <div id="features" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto mt-16 sm:mt-32 text-left">

          <div className="group p-6 md:p-8 rounded-2xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800/80 transition-all hover:bg-zinc-950/80">
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <MicTranscriptionIcon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3 group-hover:text-violet-400 transition-colors">
              Real-Time Voice Analysis
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Captures your microphone audio natively via the browser, delivering high-speed voice transcription and conceptual analysis with zero lag.
            </p>
          </div>

          <div className="group p-6 md:p-8 rounded-2xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800/80 transition-all hover:bg-zinc-950/80">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <ShieldInvisibleIcon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors">
              Agentic Mock Coaching
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Engage with an interactive, adaptive AI coach that asks follow-ups, tracks STAR structure, and tailors questions to target your weak categories.
            </p>
          </div>

          <div className="group p-6 md:p-8 rounded-2xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800/80 transition-all hover:bg-zinc-950/80">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <CodeDsaIcon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
              Instant Answers & Hints
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Recognizes interview questions in real-time and streams conceptual bullet points, system design suggestions, and optimized code snippets.
            </p>
          </div>

        </div>

      </div>
    </div>
  )
}
