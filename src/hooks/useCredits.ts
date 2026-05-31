import { useState, useEffect } from 'react'

export function useCredits() {
  const [credits, setCredits] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Scaffold hook, returning hardcoded values for now
    const timer = setTimeout(() => {
      setCredits(10)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return { credits, loading }
}
