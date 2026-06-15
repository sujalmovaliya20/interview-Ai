import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? searchParams.get('redirectTo') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors (e.g. user denied permission)
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/signin?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError && data?.user) {
      // Auto-create profile + credits for NEW users (Google OAuth)
      // This is idempotent — safe to call for existing users too
      await ensureUserProfile(supabase, data.user)

      // Redirect to dashboard or next param
      const isLocalUrl = next.startsWith('/')
      if (isLocalUrl) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    console.error('[Auth Callback] Exchange error:', exchangeError)
  } else {
    console.warn('Supabase callback accessed without code query parameter')
  }

  // Fallback: redirect to sign-in with error
  return NextResponse.redirect(`${origin}/auth/signin?error=auth_error`)
}

// Auto-create profile + credits for new OAuth users
async function ensureUserProfile(supabase: any, user: any) {
  try {
    // Check if profile exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existing) {
      // Create profile
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        provider: user.app_metadata?.provider || 'email'
      })

      // Create credits (10 free credits for new users)
      await supabase.from('credits').insert({
        user_id: user.id,
        balance: 10.00,
        is_unlimited: false
      })

      console.log('[Auth] New user profile created:', user.id)
    }
  } catch (err) {
    // Non-fatal — log but don't break the auth flow
    console.error('[Auth] Profile creation error:', err)
  }
}
