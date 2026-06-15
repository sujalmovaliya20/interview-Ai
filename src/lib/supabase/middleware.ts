import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database.types'

const SUPABASE_TIMEOUT_MS = 3000

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS)
    
    const response = await fetch(input, {
      ...init,
      signal: init?.signal || controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    const isTimeout = error.name === 'AbortError'
    const isNetworkError = 
      error.name === 'TypeError' || 
      error.message?.includes('fetch') || 
      error.code === 'ENOTFOUND' || 
      error.cause?.code === 'ENOTFOUND' ||
      error.message?.includes('getaddrinfo') ||
      error.cause?.message?.includes('getaddrinfo')

    if (isTimeout || isNetworkError) {
      return new Response(
        JSON.stringify({
          error: 'network_unreachable',
          message: `Supabase request failed: ${error.message}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    throw error
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, pass through without auth
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        fetch: customFetch,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.


  // Wrap getUser() in a timeout to prevent hanging when Supabase is unreachable
  let user = null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS)

    const { data } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () =>
          reject(new Error('Supabase auth timeout'))
        )
      })
    ])

    clearTimeout(timeout)
    user = data?.user ?? null
  } catch (error) {
    // Supabase unreachable or timed out — treat as unauthenticated
    // This prevents 27s+ hangs when DNS fails or project is paused
    user = null
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')

  if (isProtectedRoute && !user) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    // user is logged in, redirect to dashboard
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
