import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import type { Budget, NewBudget } from '../lib/types'
import { toSpanishError } from './errors'

const NO_CONFIG = 'Falta configurar Supabase (.env)'

export function useBudgets(month: string): {
  budgets: Budget[]
  loading: boolean
  error: string | null
  refresh(): Promise<void>
  upsert(b: NewBudget): Promise<string | null>
  upsertMany(bs: NewBudget[]): Promise<string | null>
  remove(id: string): Promise<string | null>
} {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState<boolean>(supabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!supabaseConfigured) { setLoading(false); return }
    try {
      const { data, error } = await supabase.from('budgets').select('*').eq('month', month)
      if (error) { setError(toSpanishError(error)); setBudgets([]) }
      else {
        setError(null)
        setBudgets((data ?? []).map((r) => ({ ...(r as Budget), amount: Number(r.amount) })))
      }
    } catch (e) {
      setError(toSpanishError(e)); setBudgets([])
    }
    setLoading(false)
  }, [month])

  useEffect(() => { void refresh() }, [refresh])

  const upsert = useCallback(async (b: NewBudget) => {
    if (!supabaseConfigured) return NO_CONFIG
    const { error } = await supabase
      .from('budgets')
      .upsert(b, { onConflict: 'user_id,category_id,month' })
    if (error) return toSpanishError(error)
    await refresh()
    return null
  }, [refresh])

  const upsertMany = useCallback(async (bs: NewBudget[]) => {
    if (!supabaseConfigured) return NO_CONFIG
    if (bs.length === 0) return null
    const { error } = await supabase
      .from('budgets')
      .upsert(bs, { onConflict: 'user_id,category_id,month' })
    if (error) return toSpanishError(error)
    await refresh()
    return null
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    if (!supabaseConfigured) return NO_CONFIG
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) return toSpanishError(error)
    await refresh()
    return null
  }, [refresh])

  return { budgets, loading, error, refresh, upsert, upsertMany, remove }
}
