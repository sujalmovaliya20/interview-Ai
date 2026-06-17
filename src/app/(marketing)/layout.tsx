import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/marketing/Navbar'
import { NewsletterForm } from '@/components/marketing/NewsletterForm'
import { BrainCircuit, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="dark bg-[#030303] text-zinc-100 min-h-screen flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200 antialiased">
      {/* Background ambient lighting effects */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-[40rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial-gradient from-violet-600/10 to-transparent blur-3xl" />
        <div className="absolute top-[20rem] right-1/4 h-[35rem] w-[45rem] translate-x-1/2 rounded-full bg-radial-gradient from-indigo-600/5 to-transparent blur-3xl" />
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar user={user} />

        <main className="flex-1">{children}</main>

        <footer className="relative border-t border-zinc-900 bg-[#050507] pt-10 sm:pt-16 pb-8 sm:pb-12">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 md:gap-12 pb-8 sm:pb-12 border-b border-zinc-900">

              {/* Branding Column */}
              <div className="sm:col-span-2 md:col-span-4 space-y-4">
                <Link href="/" className="flex items-center space-x-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/20 flex items-center justify-center shadow-lg shadow-violet-500/5">
                    <BrainCircuit className="h-5 w-5 text-violet-400" />
                  </div>
                  <span className="font-extrabold tracking-tight text-zinc-100 text-lg bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                    InterviewAI
                  </span>
                </Link>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
                  Practice and master your technical and behavioral interviews with real-time feedback, interactive mock sessions, and intelligent resume optimization.
                </p>
                <div className="flex items-center space-x-2 bg-zinc-900/40 border border-zinc-800/50 w-fit rounded-full px-3 py-1.5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-zinc-300">All systems operational</span>
                </div>
              </div>

              {/* Links Column 1: Product */}
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-sm font-semibold text-zinc-200 tracking-wider uppercase">Product</h4>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link href="#features" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#process" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <Link href="#pricing" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5">
                      <span>Download App</span>
                      <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-md font-mono">
                        v2.0
                      </span>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Links Column 2: Resources & Legal */}
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-sm font-semibold text-zinc-200 tracking-wider uppercase">Resources</h4>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link href="/docs/GOOGLE_OAUTH_SETUP.md" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                      Docs & Setup
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="mailto:support@interviewai.com" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                      Contact Support
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 3: Newsletter */}
              <div className="sm:col-span-2 md:col-span-4 space-y-3">
                <h4 className="text-sm font-semibold text-zinc-200 tracking-wider uppercase">Stay Updated</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Subscribe to our newsletter for major feature announcements, interview tips, and updates.
                </p>
                <NewsletterForm />
              </div>

            </div>

            {/* Bottom Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 sm:pt-8 text-xs text-zinc-500 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4 text-violet-500/60" />
                <p>© {new Date().getFullYear()} InterviewAI. All rights reserved. Built for secure job hunting.</p>
              </div>
              <div className="flex space-x-5">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://discord.com" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <span className="sr-only">Discord</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
