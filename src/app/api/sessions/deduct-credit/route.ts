import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call the RPC deduct_credit(user_id, amount)
    const { data, error } = await supabase.rpc('deduct_credit', {
      p_user_id: user.id,
      p_amount: 0.5
    } as any)

    if (error) {
      if (error.message.includes('INSUFFICIENT_CREDITS')) {
        return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
      }
      throw error
    }

    return NextResponse.json({ success: true, balance: data })
  } catch (error: any) {
    console.error('Credit deduction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
