import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const isResume = formData.get('isResume') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    if (!isResume) {
      // Check document count
      const { count, error: countError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_resume', false)

      if (countError) {
        throw countError
      }

      if (count && count >= 10) {
        return NextResponse.json({ error: 'MAX_DOCUMENTS_REACHED' }, { status: 422 })
      }
    }

    // 1. Generate unique storage path
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-').toLowerCase()
    const storagePath = `${user.id}/${uuidv4()}-${sanitizedFilename}`

    // 2. Upload to Supabase Storage
    const buffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'STORAGE_UPLOAD_FAILED' }, { status: 500 })
    }

    // 3. If isResume, mark existing as not resume
    if (isResume) {
      const { error: updateError } = await (supabase.from('documents') as any)
        .update({ is_resume: false })
        .eq('user_id', user.id)
        .eq('is_resume', true)
        
      if (updateError) {
        console.error('Error updating old resume:', updateError)
        // Non-fatal, we'll continue
      }
    }

    // 4. INSERT into documents table
    const { data, error: insertError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id as any,
        filename: file.name as any,
        storage_path: storagePath as any,
        is_resume: isResume as any,
        file_size_bytes: file.size as any,
        mime_type: file.type as any
      } as any)
      .select()
      .single()
      
    const insertedDoc = data as any

    if (insertError) {
      console.error('DB insert error:', insertError)
      // Cleanup storage
      await supabase.storage.from('documents').remove([storagePath])
      return NextResponse.json({ error: 'DATABASE_INSERT_FAILED' }, { status: 500 })
    }

    // 5. Return 201
    return NextResponse.json(insertedDoc, { status: 201 })

  } catch (error) {
    console.error('Unexpected upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
