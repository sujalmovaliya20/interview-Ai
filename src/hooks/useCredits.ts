import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from './useUser'
import { Credits } from '@/types'

export function useCredits() {
  const { user } = useUser()
  const [balance, setBalance] = useState<number>(0)
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      if (user === null) setIsLoading(false) // Wait until user is strictly null or loaded
      return
    }

    let isMounted = true

    async function fetchCredits() {
      const { data, error } = await supabase
        .from('credits')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (isMounted) {
        if (error || !data) {
          setBalance(0)
          setIsUnlimited(false)
        } else {
          const creditsData = data as unknown as Credits
          setBalance(creditsData.balance)
          setIsUnlimited(creditsData.is_unlimited ?? false)
        }
        setIsLoading(false)
      }
    }

    fetchCredits()

    const subscription = supabase
      .channel(`credits_changes_${user.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credits',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && 'balance' in payload.new) {
            setBalance((payload.new as any).balance)
            setIsUnlimited((payload.new as any).is_unlimited ?? false)
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(subscription)
    }
  }, [user, supabase])

  return { balance, isUnlimited, isLoading }
}
