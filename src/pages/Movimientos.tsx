import { useMemo, useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { convert } from '../lib/fx'
import TransactionItem, { parseLocalDate } from '../components/TransactionItem'
import type { Transaction } from '../lib/types'
import { Search } from 'lucide-react'
import { Card, Icon, MonthSwitcher, Money, Segmented } from '../components/ui'
import { sentence } from '../lib/format'

type Filter = 'all' | 'expense' | 'income'

const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const dayFmt = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function Movimientos() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const { transactions, loading, error } = useTransactions({ month: ym(cursor) })
  const { categories } = useCategories()
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const setMonth = (m: string) => { const [y, mo] = m.split('-').map(Number); setCursor(new Date(y, mo - 1, 1)) }

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
    <div className="px-4 pt-4 pb-4">
      <h1 className="sr-only">Movimientos</h1>
      <MonthSwitcher month={ym(cursor)} onChange={setMonth} />

      <Segmented
        label="Filtro"
        className="mt-3"
        value={filter}
        onChange={setFilter}
        options={[{ value: 'all', label: 'Todos' }, { value: 'expense', label: 'Gastos' }, { value: 'income', label: 'Ingresos' }]}
      />

      <div className="relative mt-3 mb-6">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-3"><Icon icon={Search} /></span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" aria-label="Buscar" className="h-12 w-full rounded-control border border-line-strong bg-surface pr-4 pl-10 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-3 focus:border-accent" />
      </div>

      {error && <p role="alert" className="mb-3 text-[13px] text-neg">{error}</p>}
      {loading ? (
        <p className="text-[13px] text-fg-3">Cargando…</p>
      ) : groups.length === 0 ? (
        <Card className="text-center text-[15px] text-fg-2">No hay movimientos</Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([date, txs]) => {
            const sub = txs.reduce((s, t) => s + (t.type === 'income' ? 1 : -1) * convert(t.amount, t.currency, 'ARS', t.fx_rate), 0)
            return (
              <section key={date}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="text-[13px] leading-5 font-medium text-fg-2">{sentence(dayFmt.format(parseLocalDate(date)))}</h2>
                  <Money amount={sub} currency="ARS" className="text-[13px] leading-5 text-fg-2" />
                </div>
                <Card pad={false} className="divide-y divide-line overflow-hidden">
                  {txs.map((t) => <TransactionItem key={t.id} tx={t} category={t.category_id ? catById.get(t.category_id) : null} />)}
                </Card>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
