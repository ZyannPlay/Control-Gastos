import { Link } from 'react-router-dom'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useFxRate } from '../hooks/useFxRate'
import { convert, formatMoney } from '../lib/fx'
import TransactionItem from '../components/TransactionItem'

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function Inicio() {
  const month = currentMonth()
  const { transactions, loading, error } = useTransactions({ month })
  const { categories, error: catError } = useCategories()
  const { rate } = useFxRate()

  const toArs = (t: { amount: number; currency: 'ARS' | 'USD'; fx_rate: number }) => convert(t.amount, t.currency, 'ARS', t.fx_rate)
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + toArs(t), 0)
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + toArs(t), 0)
  const balance = income - expense
  const usd = (ars: number) => (rate ? formatMoney(convert(ars, 'ARS', 'USD', rate.venta), 'USD') : '—')

  const monthLabel = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date())
  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
    .slice(0, 5)
  const catById = new Map(categories.map((c) => [c.id, c]))

  return (
    <div className="px-4 pt-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Mis Gastos</p>
          <h1 className="text-2xl font-bold capitalize">{monthLabel}</h1>
        </div>
        <Link to="/ajustes" aria-label="Ajustes" className="grid h-11 w-11 place-items-center rounded-full bg-slate-200 dark:bg-slate-800">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </Link>
      </header>

      <section className="rounded-3xl bg-emerald-600 p-5 text-white shadow-lg">
        <p className="text-sm opacity-80">Saldo del mes</p>
        <p className="text-4xl font-bold">{formatMoney(balance, 'ARS')}</p>
        <p className="text-sm opacity-80">≈ {usd(balance)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/15 p-3">
            <p className="text-xs opacity-80">Ingresos</p>
            <p className="font-semibold">{formatMoney(income, 'ARS')}</p>
            <p className="text-xs opacity-70">≈ {usd(income)}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3">
            <p className="text-xs opacity-80">Gastos</p>
            <p className="font-semibold">{formatMoney(expense, 'ARS')}</p>
            <p className="text-xs opacity-70">≈ {usd(expense)}</p>
          </div>
        </div>
      </section>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-300">
          💵 Blue: {rate ? `${formatMoney(rate.compra, 'ARS')} / ${formatMoney(rate.venta, 'ARS')}` : 'cargando…'}
        </span>
        <Link to="/nuevo" className="grid min-h-[44px] place-items-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
          + Agregar gasto
        </Link>
      </div>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Últimos movimientos</h2>
          <Link to="/movimientos" className="text-sm text-emerald-600 dark:text-emerald-400">Ver todos</Link>
        </div>
        {(error ?? catError) && <p role="alert" className="text-sm text-red-600">{error ?? catError}</p>}
        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : recent.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500 dark:bg-slate-900">Todavía no cargaste nada este mes.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((t) => <TransactionItem key={t.id} tx={t} category={t.category_id ? catById.get(t.category_id) : null} />)}
          </div>
        )}
      </section>
    </div>
  )
}
