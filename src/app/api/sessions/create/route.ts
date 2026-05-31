import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  model: z.enum(['claude', 'gpt-5']),
  language: z.string().min(2),
  extraContext: z.string().max(500).optional()
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await req.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 })
    }

    const { model, language, extraContext } = result.data

    const { data: credits } = await (supabase as any)
      .from('credits')
      .select('balance, is_unlimited')
      .eq('user_id', user.id)
      .single()

    if (!credits || (!credits.is_unlimited && credits.balance <= 0)) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_CREDITS', message: 'Add credits to start a session' },
        { status: 402 }
      )
    }

    const { data: newSession, error } = await (supabase as any)
      .from('sessions')
      .insert({
        user_id: user.id,
        model,
        language,
        status: 'active',
        // In reality, extraContext would be saved somewhere, perhaps in a session_metadata table
      })
      .select('id')
      .single()

    if (error || !newSession) {
      console.error('Insert session error:', error)
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
    }

    return NextResponse.json({ sessionId: newSession.id }, { status: 201 })
  } catch (error) {
    console.error('Session create error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
