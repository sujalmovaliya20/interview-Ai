'use client'

import { useState, useRef } from 'react'
import { UploadCloud, CheckCircle2, Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Document } from '@/types' // Assuming there's a type, if not we'll define locally

interface DocUploadProps {
  isResume: boolean
  onUploadComplete: (doc: any) => void
  disabled?: boolean
}

export function DocUpload({ isResume, onUploadComplete, disabled }: DocUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [uploadingFilename, setUploadingFilename] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB")
      return
    }

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
    if (!validTypes.includes(file.type)) {
      toast.error("Only PDF, DOCX, or TXT")
      return
    }

    uploadFile(file)
  }

  const uploadFile = (file: File) => {
    setIsUploading(true)
    setProgress(0)
    setUploadingFilename(file.name)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('isResume', String(isResume))

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/documents/upload', true)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      setIsUploading(false)
      if (xhr.status === 201) {
        const doc = JSON.parse(xhr.responseText)
        setIsComplete(true)
        toast.success("Document uploaded successfully")
        onUploadComplete(doc)

        setTimeout(() => {
          setIsComplete(false)
          setProgress(0)
          setUploadingFilename('')
        }, 2000)
      } else {
        try {
          const res = JSON.parse(xhr.responseText)
          toast.error(res.error || "Upload failed")
        } catch {
          toast.error("Upload failed")
        }
      }
    }

    xhr.onerror = () => {
      setIsUploading(false)
      toast.error("Network error occurred during upload")
    }

    xhr.send(formData)
  }

  if (isComplete) {
    return (
      <div className="border-2 border-dashed border-primary bg-primary/5 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors">
        <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
        <p className="text-sm font-medium">Uploaded! Processing...</p>
      </div>
    )
  }

  if (isUploading) {
    return (
      <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm font-medium mb-2 truncate max-w-full px-4">{uploadingFilename}</p>
        <Progress value={progress} className="w-full max-w-[200px]" />
        <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed border-border' : ''}
        ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.docx,.txt"
        disabled={disabled}
      />
      <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
      <p className="text-sm font-medium">
        {isDragging ? 'Release to upload' : `Drop ${isResume ? 'your resume' : 'a document'} here`}
      </p>
      {!isDragging && (
        <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
      )}
      <p className="text-xs text-muted-foreground mt-4">.pdf, .docx, .txt • max 10MB</p>
    </div>
  )
}
