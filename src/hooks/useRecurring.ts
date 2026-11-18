import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import type { NewRecurringRule, RecurringRule } from '../lib/types'
import { toSpanishError } from './errors'

const NO_CONFIG = 'Falta configurar Supabase (.env)'

function normalize(row: Record<string, unknown>): RecurringRule {
  return { ...(row as unknown as RecurringRule), amount: Number(row.amount) }
}

export function useRecurring(): {
  rules: RecurringRule[]
  loading: boolean
  error: string | null
  refresh(): Promise<void>
  add(r: NewRecurringRule): Promise<string | null>
  update(id: string, patch: Partial<NewRecurringRule>): Promise<string | null>
  remove(id: string): Promise<string | null>
} {
  const [rules, setRules] = useState<RecurringRule[]>([])
  const [loading, setLoading] = useState<boolean>(supabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!supabaseConfigured) { setLoading(false); return }
    try {
      const { data, error } = await supabase
        .from('recurring_rules')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) { setError(toSpanishError(error)); setRules([]) }
      else {
        setError(null)
        setRules((data ?? []).map((r) => normalize(r as Record<string, unknown>)))
      }
    } catch (e) {
      setError(toSpanishError(e)); setRules([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const add = useCallback(async (r: NewRecurringRule) => {
    if (!supabaseConfigured) return NO_CONFIG
    try {
      const { error } = await supabase.from('recurring_rules').insert(r)
      if (error) return toSpanishError(error)
      await refresh()
      return null
    } catch (e) { return toSpanishError(e) }
  }, [refresh])

  const update = useCallback(async (id: string, patch: Partial<NewRecurringRule>) => {
    if (!supabaseConfigured) return NO_CONFIG
    try {
      const { error } = await supabase.from('recurring_rules').update(patch).eq('id', id)
      if (error) return toSpanishError(error)
      await refresh()
      return null
    } catch (e) { return toSpanishError(e) }
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    if (!supabaseConfigured) return NO_CONFIG
    try {
      const { error } = await supabase.from('recurring_rules').delete().eq('id', id)
      if (error) return toSpanishError(error)
      await refresh()
      return null
    } catch (e) { return toSpanishError(e) }
  }, [refresh])

  return { rules, loading, error, refresh, add, update, remove }
}
