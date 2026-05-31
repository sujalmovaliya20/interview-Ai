import { Skeleton } from '@/components/ui/skeleton'

export default function SessionsLoading() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <Skeleton className="h-10 w-full sm:w-[300px]" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-full sm:w-[200px]" />
            <Skeleton className="h-10 w-[130px]" />
            <Skeleton className="h-10 w-[130px]" />
          </div>
        </div>
        
        <div className="border rounded-md p-4 space-y-3">
          <Skeleton className="h-8 w-full" />
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
