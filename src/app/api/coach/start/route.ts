import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await req.json()
    const { role, sessionType, maxQuestions } = body

    if (!role) {
      return NextResponse.json({ error: 'ROLE_REQUIRED' }, { status: 400 })
    }

    const transcriptionUrl = process.env.NEXT_PUBLIC_TRANSCRIPTION_URL || 'http://localhost:8000'
    const response = await fetch(`${transcriptionUrl}/coach/start-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: user.id,
        role: role,
        session_type: sessionType || 'mixed',
        max_questions: maxQuestions || 10
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('FastAPI start session failed:', errorText)
      return NextResponse.json({ error: 'BACKEND_ERROR', detail: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Coach start session error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: error.message }, { status: 500 })
  }
}
