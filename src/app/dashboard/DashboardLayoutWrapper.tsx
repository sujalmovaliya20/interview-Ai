'use client'

import { usePathname } from 'next/navigation'

interface DashboardLayoutWrapperProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  header: React.ReactNode
}

export function DashboardLayoutWrapper({ children, sidebar, header }: DashboardLayoutWrapperProps) {
  const pathname = usePathname()
  
  // Check if we are in a live session page (but NOT the /new page)
  const isLiveSession = pathname?.startsWith('/dashboard/session/') && !pathname?.endsWith('/new')

  if (isLiveSession) {
    // If it's a live session, we want the children to take up the full screen
    // without the sidebar or header.
    return <main className="flex-1 w-full h-screen overflow-hidden bg-background">{children}</main>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background w-full">
      {sidebar}
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {header}
        <main className="flex-1 overflow-y-auto bg-muted/30 w-full relative">
          {children}
        </main>
      </div>
    </div>
  )
}
