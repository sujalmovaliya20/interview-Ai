'use client'

import { useState } from 'react'
import { Crown } from 'lucide-react'
import { DocUpload } from './DocUpload'
import { DocumentCard } from './DocumentCard'
import { toast } from 'sonner'
import { Document } from '@/types'

interface DocumentsManagerProps {
  initialDocuments: any[]
  userId: string
}

export function DocumentsManager({ initialDocuments, userId }: DocumentsManagerProps) {
  const [documents, setDocuments] = useState(initialDocuments)

  const resume = documents.find(d => d.is_resume)
  const otherDocs = documents.filter(d => !d.is_resume)

  const handleUploadComplete = (doc: any) => {
    if (doc.is_resume) {
      setDocuments(prev => {
        // mark existing resume as not resume, then add new
        const updated = prev.map(d => d.is_resume ? { ...d, is_resume: false } : d)
        return [doc, ...updated]
      })
    } else {
      setDocuments(prev => [doc, ...prev])
    }
  }

  const handleDelete = async (id: string) => {
    // Optimistic delete
    const docToDelete = documents.find(d => d.id === id)
    setDocuments(prev => prev.filter(d => d.id !== id))

    try {
      const res = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: id })
      })

      if (!res.ok) {
        throw new Error('Failed to delete')
      }

      toast.success("Document deleted")
    } catch (error) {
      // Revert optimistic delete
      if (docToDelete) {
        setDocuments(prev => [...prev, docToDelete])
      }
      toast.error("Failed to delete document")
    }
  }

  const handleSetResume = async (id: string) => {
    // Note: This feature requires an extra API endpoint to set an existing doc as resume.
    // For now we don't have it in the spec, but we can optimistically set it, 
    // or just leave the prop out since we don't have the API route for it yet.
    // I will comment it out or leave it no-op.
    toast.info("Setting existing documents as resume is coming soon. Please re-upload.")
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage files the AI uses to personalize your session</p>
        </div>
      </div>

      {/* SECTION 1: Resume */}
      <section className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b bg-muted/20 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Resume</h2>
            <p className="text-sm text-muted-foreground">Used as primary context in every session</p>
          </div>
        </div>
        <div className="p-6">
          {resume ? (
            <div className="space-y-4">
              <DocumentCard document={resume} onDelete={handleDelete} />
              <div className="pt-4 border-t border-dashed">
                <p className="text-sm text-muted-foreground mb-3 font-medium">Replace resume</p>
                <DocUpload isResume={true} onUploadComplete={handleUploadComplete} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">Upload your resume to get personalised AI answers tailored to your experience.</p>
              <DocUpload isResume={true} onUploadComplete={handleUploadComplete} />
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: Supporting Documents */}
      <section className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b bg-muted/20 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Context Documents</h2>
            <p className="text-sm text-muted-foreground">Add files like job descriptions, company info, or notes</p>
          </div>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
            {otherDocs.length} / 10
          </span>
        </div>
        <div className="p-6">
          <div className="grid gap-4 mb-6">
            {otherDocs.map(doc => (
              <DocumentCard 
                key={doc.id} 
                document={doc} 
                onDelete={handleDelete} 
                onSetResume={handleSetResume}
              />
            ))}
            {otherDocs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                No documents yet. Add files to help AI tailor answers.
              </div>
            )}
          </div>
          
          <DocUpload 
            isResume={false} 
            onUploadComplete={handleUploadComplete} 
            disabled={otherDocs.length >= 10}
          />
        </div>
      </section>
    </div>
  )
}
