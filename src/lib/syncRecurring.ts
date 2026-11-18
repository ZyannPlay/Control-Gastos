import { supabase, supabaseConfigured } from './supabase'
import { getBlueRate } from './fx'
import { dueOccurrences } from './recurring'
import type { NewTransaction, RecurringRule } from './types'

/** Genera los movimientos pendientes de las reglas activas. Nunca lanza. */
export async function syncRecurring(): Promise<number> {
  if (!supabaseConfigured) return 0
  try {
    const { data, error } = await supabase.from('recurring_rules').select('*').eq('active', true)
    if (error) throw error
    const rules = (data ?? []).map((r) => ({ ...(r as unknown as RecurringRule), amount: Number((r as { amount: unknown }).amount) }))
    const today = new Date()
    const rows: NewTransaction[] = []
    let fx: number | null = null
    for (const rule of rules) {
      const occ = dueOccurrences(rule, today)
      if (occ.length && fx === null) fx = (await getBlueRate()).venta
      for (const o of occ) {
        const total = rule.installments_total
        const note = rule.kind === 'installments'
          ? `${rule.note ?? 'Cuota'} (cuota ${o.installment_number}/${total})`
          : rule.note
        rows.push({
          type: rule.type,
          amount: rule.amount,
          currency: rule.currency,
          category_id: rule.category_id,
          note,
          date: o.date,
          recurring_id: rule.id,
          period: o.period,
          installment_number: o.installment_number,
          fx_rate: fx as number,
        })
      }
    }
    if (!rows.length) return 0
    const { error: upErr } = await supabase
      .from('transactions')
      .upsert(rows, { onConflict: 'recurring_id,period', ignoreDuplicates: true })
    if (upErr) throw upErr
    return rows.length
  } catch (e) {
    console.warn('syncRecurring falló', e)
    return 0
  }
}
