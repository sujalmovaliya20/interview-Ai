import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)
    
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

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: customFetch,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

