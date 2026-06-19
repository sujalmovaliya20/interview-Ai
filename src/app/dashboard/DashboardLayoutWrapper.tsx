'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface DashboardLayoutWrapperProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  header: React.ReactNode
}

export function DashboardLayoutWrapper({ children, sidebar, header }: DashboardLayoutWrapperProps) {
  const pathname = usePathname()
  
  useEffect(() => {
    // Proactively warm up backend services when user lands on dashboard
    const warmUpServices = async () => {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
      const transUrl = process.env.NEXT_PUBLIC_TRANSCRIPTION_URL

      const pings = []
      if (socketUrl) {
        pings.push(
          fetch(`${socketUrl}/health`).catch(err => 
            console.warn('[Warmup] Socket server ping failed:', err)
          )
        )
      }
      if (transUrl) {
        pings.push(
          fetch(`${transUrl}/health`).catch(err => 
            console.warn('[Warmup] Transcription service ping failed:', err)
          )
        )
      }

      if (pings.length > 0) {
        console.log('[Warmup] Waking up backend services proactively...')
        await Promise.all(pings)
        console.log('[Warmup] Proactive warmup requests sent.')
      }
    }

    warmUpServices()
  }, [])

  // Check if we are in a live session page (but NOT the /new page)
  const isLiveSession = pathname?.startsWith('/dashboard/session/') && !pathname?.endsWith('/new')

  if (isLiveSession) {
    // If it's a live session, we want the children to take up the full screen
    // without the sidebar or header.
    return <main className="flex-1 w-full h-screen overflow-hidden bg-background">{children}</main>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground w-full">
      {/* Ambient background effects */}
      <div className="dashboard-ambient" />
      <div className="dashboard-grid" />

      {sidebar}
      <div className="flex flex-col flex-1 overflow-hidden w-full relative z-10">
        {header}
        <main className="flex-1 overflow-y-auto w-full relative">
          {children}
        </main>
      </div>
    </div>
  )
}
