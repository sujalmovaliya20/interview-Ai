import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase credentials in environment variables')
}

if (!globalThis.WebSocket) {
  (globalThis as any).WebSocket = WebSocket
}

const customFetch = async (input: any, init?: any) => {
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

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: customFetch
  }
})

