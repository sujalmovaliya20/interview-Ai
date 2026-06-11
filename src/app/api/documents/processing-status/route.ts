import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json({ error: 'documentId required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('documents')
      .select('id, filename, processed_at, processing_error, token_count')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()
      
    const doc = data as any

    if (error || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({
      isProcessed: !!doc.processed_at,
      error: doc.processing_error,
      tokenCount: doc.token_count
    })
  } catch (error) {
    console.error('Processing status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
