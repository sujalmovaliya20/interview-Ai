'use client'

import { useState } from 'react'
import Link from 'next/link'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="8" x2="20" y2="8" />
              <line x1="4" y1="16" x2="20" y2="16" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-zinc-900 animate-fade-in">
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-1">
            <Link
              href="#features"
              onClick={() => setIsOpen(false)}
              className="text-zinc-300 hover:text-white hover:bg-zinc-900/50 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              Features
            </Link>
            <Link
              href="#process"
              onClick={() => setIsOpen(false)}
              className="text-zinc-300 hover:text-white hover:bg-zinc-900/50 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              onClick={() => setIsOpen(false)}
              className="text-zinc-300 hover:text-white hover:bg-zinc-900/50 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              Pricing
            </Link>
            <div className="pt-2 border-t border-zinc-900 mt-2">
              <Link
                href="/auth/signin"
                onClick={() => setIsOpen(false)}
                className="block text-zinc-400 hover:text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
