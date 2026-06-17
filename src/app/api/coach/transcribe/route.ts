import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const arrayBuffer = await req.arrayBuffer()
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'EMPTY_AUDIO' }, { status: 400 })
    }

    // Forward to FastAPI /transcribe
    const transcriptionUrl = process.env.NEXT_PUBLIC_TRANSCRIPTION_URL || 'http://localhost:8000'
    
    const formData = new FormData()
    // Convert ArrayBuffer to Blob/File to match UploadFile
    const audioBlob = new Blob([arrayBuffer], { type: 'application/octet-stream' })
    formData.append('audio', audioBlob, 'audio.raw')

    const response = await fetch(`${transcriptionUrl}/transcribe`, {
      method: 'POST',
      headers: {
        'X-Internal-Key': 'some-random-secret-here'
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('FastAPI transcribe failed:', errorText)
      return NextResponse.json({ error: 'TRANSCRIPTION_FAILED', detail: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Coach transcribe proxy error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: error.message }, { status: 500 })
  }
}
export const maxDuration = 60
export const dynamic = 'force-dynamic'
