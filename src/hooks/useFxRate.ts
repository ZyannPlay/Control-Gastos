import { useEffect, useState } from 'react'
import { getBlueRate, type FxRate } from '../lib/fx'

export function useFxRate(): { rate: FxRate | null; loading: boolean } {
  const [rate, setRate] = useState<FxRate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getBlueRate()
      .then((r) => { if (active) setRate(r) })
      .catch(() => { /* getBlueRate ya maneja fallback */ })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return { rate, loading }
}
