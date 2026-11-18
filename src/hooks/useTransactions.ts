import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import type { NewTransaction, Transaction } from '../lib/types'
import { toSpanishError } from './errors'

const NO_CONFIG = 'Falta configurar Supabase (.env)'

function normalize(row: Record<string, unknown>): Transaction {
  return {
    ...(row as unknown as Transaction),
    amount: Number(row.amount),
    fx_rate: Number(row.fx_rate),
  }
}

function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` }
}

export function useTransactions(opts?: { month?: string; from?: string; to?: string; skipFetch?: boolean }): {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  refresh(): Promise<void>
  add(t: NewTransaction): Promise<string | null>
  update(id: string, patch: Partial<NewTransaction>): Promise<string | null>
  remove(id: string): Promise<string | null>
  get(id: string): Promise<{ data: Transaction | null; error: string | null }>
} {
  const month = opts?.month
  const skipFetch = opts?.skipFetch ?? false
  let from = opts?.from
  let to = opts?.to
  if (month) {
    const r = monthRange(month)
    from = from ?? r.from
    to = to ?? r.to
  }

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState<boolean>(supabaseConfigured && !skipFetch)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!supabaseConfigured || skipFetch) { setLoading(false); return }
    try {
    let q = supabase.from('transactions').select('*')
    if (from) q = q.gte('date', from)
    if (to) q = q.lte('date', to)
    const { data, error } = await q
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) { setError(toSpanishError(error)); setTransactions([]) }
    else {
      setError(null)
      setTransactions((data ?? []).map((r) => normalize(r as Record<string, unknown>)))
    }
    } catch (e) {
      setError(toSpanishError(e)); setTransactions([])
    }
    setLoading(false)
  }, [from, to, skipFetch])

  useEffect(() => { void refresh() }, [refresh])

  const add = useCallback(async (t: NewTransaction) => {
    if (!supabaseConfigured) return NO_CONFIG
    const { error } = await supabase.from('transactions').insert(t)
    if (error) return toSpanishError(error)
    if (!skipFetch) await refresh()
    return null
  }, [refresh, skipFetch])

  const update = useCallback(async (id: string, patch: Partial<NewTransaction>) => {
    if (!supabaseConfigured) return NO_CONFIG
    const { error } = await supabase.from('transactions').update(patch).eq('id', id)
    if (error) return toSpanishError(error)
    if (!skipFetch) await refresh()
    return null
  }, [refresh, skipFetch])

  const remove = useCallback(async (id: string) => {
    if (!supabaseConfigured) return NO_CONFIG
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) return toSpanishError(error)
    if (!skipFetch) await refresh()
    return null
  }, [refresh, skipFetch])

  const get = useCallback(async (id: string) => {
    if (!supabaseConfigured) return { data: null, error: NO_CONFIG }
    try {
      const { data, error } = await supabase.from('transactions').select('*').eq('id', id).maybeSingle()
      if (error) return { data: null, error: toSpanishError(error) }
      if (!data) return { data: null, error: null }
      return { data: normalize(data as Record<string, unknown>), error: null }
    } catch (e) {
      return { data: null, error: toSpanishError(e) }
    }
  }, [])

  return { transactions, loading, error, refresh, add, update, remove, get }
}
