'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get('email')
  const validatedFields = schema.safeParse({ email })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.email?.[0] || 'Invalid email',
      success: false,
    }
  }

  const supabase = await createClient()
  
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.signInWithOtp({
    email: validatedFields.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return {
      error: error.message,
      success: false,
    }
  }

  return {
    success: true,
    error: null,
    email: validatedFields.data.email
  }
}
