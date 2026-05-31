import { Skeleton } from '@/components/ui/skeleton'

export default function LiveSessionLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
      
      {/* Main Area */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Left Panel */}
        <div className="w-2/5 border-r flex flex-col p-4">
          <Skeleton className="h-6 w-24 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-16 w-3/4 rounded-md" />
          </div>
        </div>
        
        {/* Right Panel */}
        <div className="w-3/5 flex flex-col p-4">
          <Skeleton className="h-6 w-24 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-48 w-full rounded-md" />
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="h-12 border-t flex items-center px-4 gap-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-20 ml-auto" />
      </div>
    </div>
  )
}
