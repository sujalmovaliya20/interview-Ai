import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/marketing/Navbar'
import { NewsletterForm } from '@/components/marketing/NewsletterForm'
import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { LogoIcon } from '@/components/marketing/CustomIcons'

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
              <div className="sm:col-span-2 md:col-span-5 space-y-4">
                <Link href="/" className="flex items-center space-x-2.5">
                  <LogoIcon className="h-9 w-9" />
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
              <div className="md:col-span-3 space-y-3">
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
                <a href="https://github.com/sujalmovaliya20" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/sujal-movaliya-89b529374/" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
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
