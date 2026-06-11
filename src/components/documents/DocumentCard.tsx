'use client'

import { FileText, EllipsisVertical, Loader2, AlertCircle } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing'
import { Document } from '@/types' // update with correct types if needed

interface DocumentCardProps {
  document: any
  onDelete: (id: string) => void
  onSetResume?: (id: string) => void
}

export function DocumentCard({ document, onDelete, onSetResume }: DocumentCardProps) {
  const { isProcessed, error, tokenCount } = useDocumentProcessing({
    documentId: document.id,
    initiallyProcessed: !!document.processed_at && !document.processing_error
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <FileText className="w-8 h-8 text-red-500" />
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return <FileText className="w-8 h-8 text-blue-500" />
    return <FileText className="w-8 h-8 text-gray-500" />
  }

  const finalError = error || document.processing_error

  return (
    <div className="border rounded-lg p-4 flex items-center gap-3 bg-card text-card-foreground">
      <div className="flex-shrink-0">
        {getFileIcon(document.mime_type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate max-w-xs" title={document.filename}>
          {document.filename}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatFileSize(document.file_size_bytes)} • {formatDate(document.created_at)}
        </p>
        
        <div className="mt-1.5 flex items-center gap-2">
          {isProcessed ? (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
              Processed
              {tokenCount != null && ` • ~${tokenCount} tokens`}
            </span>
          ) : finalError ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 cursor-help">
                    <AlertCircle className="w-3 h-3" /> Error
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{finalError}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
              <Loader2 className="w-3 h-3 animate-spin" /> Processing...
            </span>
          )}
        </div>
      </div>

      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 hover:bg-muted rounded-md transition-colors outline-none">
            <EllipsisVertical className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <a href={`/api/documents/download/${document.id}`} target="_blank" rel="noreferrer" className="w-full cursor-pointer">
                Download
              </a>
            </DropdownMenuItem>
            {onSetResume && !document.is_resume && (
              <DropdownMenuItem onClick={() => onSetResume(document.id)}>
                Set as Resume
              </DropdownMenuItem>
            )}
            <AlertDialogTrigger>
              <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document "{document.filename}" from our servers. 
              {document.is_resume ? " Since this is your resume, AI answers will no longer be personalized until you upload a new one." : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(document.id)} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
