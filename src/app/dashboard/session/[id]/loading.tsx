import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-col h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-semibold">Preparing your interview...</h2>
      <p className="text-muted-foreground mt-2">Connecting to AI engine</p>
    </div>
  )
}
