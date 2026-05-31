import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileUp, FileText } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Document } from '@/types'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const docs = (documents as Document[]) || []

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        
        <Tooltip>
          <TooltipTrigger render={<span className="cursor-not-allowed inline-flex" />}>
            <Button disabled className="pointer-events-none w-full">
              <FileUp className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upload feature coming soon</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed bg-card mt-8">
          <div className="rounded-full bg-muted p-3 mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No documents uploaded yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Upload resumes, job descriptions, or technical context to provide the AI with better context for your sessions.
          </p>
          <Button disabled variant="outline">Upload feature coming soon</Button>
        </div>
      ) : (
        <div className="grid gap-4 mt-8">
          {docs.map(doc => (
            <div key={doc.id} className="p-4 rounded-lg border bg-card flex items-center justify-between">
              <span className="font-medium">{doc.filename}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
