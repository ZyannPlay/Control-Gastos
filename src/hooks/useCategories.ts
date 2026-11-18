import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import type { Category } from '../lib/types'
import { toSpanishError } from './errors'

export function useCategories(): {
  categories: Category[]
  loading: boolean
  error: string | null
  refresh(): Promise<void>
  add(c: Omit<Category, 'id' | 'user_id'>): Promise<string | null>
  remove(id: string): Promise<string | null>
} {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState<boolean>(supabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!supabaseConfigured) { setLoading(false); return }
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name')
      if (error) { setError(toSpanishError(error)); setCategories([]) }
      else { setError(null); setCategories((data ?? []) as Category[]) }
    } catch (e) {
      setError(toSpanishError(e)); setCategories([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const add = useCallback(async (c: Omit<Category, 'id' | 'user_id'>) => {
    if (!supabaseConfigured) return 'Falta configurar Supabase (.env)'
    const { error } = await supabase.from('categories').insert(c)
    if (error) return toSpanishError(error)
    await refresh()
    return null
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    if (!supabaseConfigured) return 'Falta configurar Supabase (.env)'
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return toSpanishError(error)
    await refresh()
    return null
  }, [refresh])

  return { categories, loading, error, refresh, add, remove }
}
