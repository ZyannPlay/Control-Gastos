import { Link } from 'react-router-dom'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useFxRate } from '../hooks/useFxRate'
import { convert, formatMoney } from '../lib/fx'
import TransactionItem from '../components/TransactionItem'
import { monthLabel } from '../lib/stats'
import { useRecurring } from '../hooks/useRecurring'
import { nextOccurrence } from '../lib/recurring'
import { parseLocalDate } from '../components/TransactionItem'
import { Plus, Repeat, Settings } from 'lucide-react'
import { Card, CategoryIcon, Equiv, Icon, Money, SectionTitle } from '../components/ui'
import { sentence } from '../lib/format'

const fmtDay = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function Inicio() {
  const month = currentMonth()
  const { transactions, loading, error } = useTransactions({ month })
  const { categories, error: catError } = useCategories()
  const { rate } = useFxRate()
  const { rules } = useRecurring()

  const toArs = (t: { amount: number; currency: 'ARS' | 'USD'; fx_rate: number }) => convert(t.amount, t.currency, 'ARS', t.fx_rate)
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + toArs(t), 0)
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + toArs(t), 0)
  const balance = income - expense
  const usd = (ars: number) => (rate ? convert(ars, 'ARS', 'USD', rate.venta) : null)
  const eqArs = (ars: number, cls = '') => { const u = usd(ars); return u === null ? <span className={`font-mono text-[12px] leading-4 text-fg-3 ${cls}`}>≈ —</span> : <Equiv amount={u} currency="USD" className={cls} /> }

  const monthTitle = monthLabel(month)
  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
    .slice(0, 5)
  const catById = new Map(categories.map((c) => [c.id, c]))
  const now = new Date()
  const upcoming = rules
    .filter((r) => r.active)
    .map((r) => ({ r, next: nextOccurrence(r, now) }))
    .filter((x): x is { r: typeof rules[number]; next: NonNullable<ReturnType<typeof nextOccurrence>> } => !!x.next && x.next.date.startsWith(month))
    .sort((a, b) => a.next.date.localeCompare(b.next.date))
    .slice(0, 3)

  return (
    <div className="px-4 pt-4 pb-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[13px] leading-5 text-fg-3">Mis Gastos</p>
          <h1 className="text-[28px] leading-8 font-medium tracking-[-0.01em]">{sentence(monthTitle)}</h1>
        </div>
        <Link to="/ajustes" aria-label="Ajustes" className="grid h-11 w-11 place-items-center rounded-control text-fg-2 transition-colors hover:bg-raised">
          <Icon icon={Settings} size={20} />
        </Link>
      </header>

      <Card>
        <section aria-label="Saldo del mes">
          <p className="text-[13px] leading-5 text-fg-2">Saldo del mes</p>
          <Money amount={balance} currency="ARS" className="block text-[40px] leading-[44px] font-medium tracking-[-0.02em]" />
          {eqArs(balance, 'mt-1 block')}
        </section>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 font-mono text-[13px] leading-4" aria-label="Dólar blue">
          <span className="font-sans text-fg-3">Dólar blue</span>
          <dl className="flex gap-4">
            <div className="flex gap-2"><dt className="text-fg-3">Compra</dt><dd className="num text-fg">{rate ? formatMoney(rate.compra, 'ARS') : '—'}</dd></div>
            <div className="flex gap-2"><dt className="text-fg-3">Venta</dt><dd className="num text-fg">{rate ? formatMoney(rate.venta, 'ARS') : '—'}</dd></div>
          </dl>
        </div>
      </Card>

      <Card pad={false} className="mt-3 grid grid-cols-2 divide-x divide-line">
        <div className="p-4">
          <p className="text-[13px] leading-5 text-fg-2">Ingresos</p>
          <Money amount={income} currency="ARS" kind="income" className="block text-[17px] leading-6 font-medium" />
          {eqArs(income, 'block')}
        </div>
        <div className="p-4">
          <p className="text-[13px] leading-5 text-fg-2">Gastos</p>
          <Money amount={expense} currency="ARS" kind="expense" className="block text-[17px] leading-6 font-medium" />
          {eqArs(expense, 'block')}
        </div>
      </Card>

      <Link to="/nuevo" className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-control bg-accent px-4 text-[15px] font-medium text-on-accent transition-[background-color,opacity,transform] duration-150 ease-soft hover:opacity-90 active:scale-[0.98]">
        <Icon icon={Plus} /> Agregar gasto
      </Link>

      {rules.length === 0 ? (
        <Link to="/fijos" className="mt-6 flex min-h-14 items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-[15px] text-fg-2 transition-colors hover:bg-raised">
          <Icon icon={Repeat} />
          <span className="flex-1">Cargá tus gastos fijos y compras en cuotas</span>
        </Link>
      ) : upcoming.length > 0 && (
        <section className="mt-6">
          <SectionTitle action={<Link to="/fijos" className="grid min-h-11 place-items-center text-[13px] text-accent-ink transition-colors hover:text-fg">Ver todos</Link>}>Próximos fijos y cuotas</SectionTitle>
          <Card pad={false}>
            <ul className="divide-y divide-line">
              {upcoming.map(({ r, next }) => {
                const cat = r.category_id ? catById.get(r.category_id) : null
                const other = r.currency === 'ARS' ? 'USD' : 'ARS'
                return (
                  <li key={r.id} className="flex h-16 items-center gap-3 px-4">
                    <CategoryIcon category={cat} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] leading-5">{r.note || cat?.name || 'Sin categoría'}</span>
                      <span className="block truncate text-[13px] leading-5 text-fg-3">
                        {fmtDay.format(parseLocalDate(next.date))}{next.installment_number ? ` · Cuota ${next.installment_number}${r.installments_total ? `/${r.installments_total}` : ''}` : ''}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end">
                      <Money amount={r.amount} currency={r.currency} kind={r.type} className="text-[15px] leading-5 font-medium" />
                      {rate && <Equiv amount={convert(r.amount, r.currency, other, rate.venta)} currency={other} />}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Card>
        </section>
      )}

      <section className="mt-6">
        <SectionTitle action={<Link to="/movimientos" className="grid min-h-11 place-items-center text-[13px] text-accent-ink transition-colors hover:text-fg">Ver todos</Link>}>Últimos movimientos</SectionTitle>
        {(error ?? catError) && <p role="alert" className="mb-2 text-[13px] text-neg">{error ?? catError}</p>}
        {loading ? (
          <p className="text-[13px] text-fg-3">Cargando…</p>
        ) : recent.length === 0 ? (
          <Card className="text-center text-[15px] text-fg-2">Todavía no cargaste nada este mes</Card>
        ) : (
          <Card pad={false} className="divide-y divide-line overflow-hidden">
            {recent.map((t) => <TransactionItem key={t.id} tx={t} category={t.category_id ? catById.get(t.category_id) : null} />)}
          </Card>
        )}
      </section>
    </div>
  )
}
