import { useEffect, useState } from 'react'

export function usePageLoading() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 180)
    return () => window.clearTimeout(timer)
  }, [])

  return loading
}
