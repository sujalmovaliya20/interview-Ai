import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? searchParams.get('redirectTo') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const isLocalUrl = next.startsWith('/')
      if (isLocalUrl) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    } else {
      console.error('Supabase callback exchange error:', error.message, error)
    }
  } else {
    console.warn('Supabase callback accessed without code query parameter')
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/signin?error=auth_error`)
}
