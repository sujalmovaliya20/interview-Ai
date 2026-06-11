import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Redis from 'ioredis'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Fetch documents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { documentId } = body

    if (!documentId) {
      return NextResponse.json({ error: 'documentId required' }, { status: 400 })
    }

    // Verify document belongs to user
    const { data, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()
      
    const doc = data as any

    if (fetchError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 1. Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([doc.storage_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      // Continue anyway to clean up DB if storage file is already missing
    }

    // 2. Delete from DB
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (deleteError) {
      throw deleteError
    }

    // 3. Clear Redis cache
    try {
      if (process.env.REDIS_URL) {
        const redis = new Redis(process.env.REDIS_URL)
        if (doc.is_resume) {
          await redis.del(`resume:text:${user.id}`)
        } else {
          await redis.del(`docs:context:${user.id}`)
        }
        redis.disconnect()
      }
    } catch (redisError) {
      console.error('Redis cache clear error:', redisError)
      // Non-fatal, just log
    }

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
