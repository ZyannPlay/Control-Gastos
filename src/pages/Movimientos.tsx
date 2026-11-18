import { useMemo, useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { convert, formatMoney } from '../lib/fx'
import TransactionItem, { parseLocalDate } from '../components/TransactionItem'
import type { Transaction } from '../lib/types'

type Filter = 'all' | 'expense' | 'income'

const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const dayFmt = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
const monthFmt = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function Movimientos() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const { transactions, loading, error } = useTransactions({ month: ym(cursor) })
  const { categories } = useCategories()
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const shift = (n: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1))

  const groups = useMemo(() => {
    const nq = norm(q.trim())
    const list = transactions.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false
      if (!nq) return true
      const cat = t.category_id ? catById.get(t.category_id)?.name ?? '' : ''
      return norm(`${t.note ?? ''} ${cat}`).includes(nq)
    })
    const map = new Map<string, Transaction[]>()
    for (const t of list) map.set(t.date, [...(map.get(t.date) ?? []), t])
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [transactions, filter, q, catById])

  return (
    <div className="px-4 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} aria-label="Mes anterior" className="grid h-11 w-11 place-items-center rounded-full text-2xl">‹</button>
        <h1 className="text-lg font-bold capitalize">{monthFmt.format(cursor)}</h1>
        <button type="button" onClick={() => shift(1)} aria-label="Mes siguiente" className="grid h-11 w-11 place-items-center rounded-full text-2xl">›</button>
      </div>

      <div className="mb-3 flex rounded-full bg-slate-200 p-1 dark:bg-slate-800">
        {([['all', 'Todos'], ['expense', 'Gastos'], ['income', 'Ingresos']] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} className={`min-h-[44px] flex-1 rounded-full text-sm font-semibold ${filter === k ? 'bg-white shadow dark:bg-slate-600' : 'text-slate-500'}`}>{l}</button>
        ))}
      </div>

      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nota o categoría" className="mb-4 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-4 dark:border-slate-700 dark:bg-slate-900" />

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : groups.length === 0 ? (
        <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500 dark:bg-slate-900">No hay movimientos.</p>
      ) : (
        <div className="space-y-5">
          {groups.map(([date, txs]) => {
            const sub = txs.reduce((s, t) => s + (t.type === 'income' ? 1 : -1) * convert(t.amount, t.currency, 'ARS', t.fx_rate), 0)
            return (
              <section key={date}>
                <div className="mb-1 flex items-baseline justify-between px-1">
                  <h2 className="text-sm font-semibold capitalize text-slate-500">{dayFmt.format(parseLocalDate(date))}</h2>
                  <span className={`text-sm font-semibold ${sub < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatMoney(sub, 'ARS')}</span>
                </div>
                <div className="space-y-2">
                  {txs.map((t) => <TransactionItem key={t.id} tx={t} category={t.category_id ? catById.get(t.category_id) : null} />)}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
