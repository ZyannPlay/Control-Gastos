import { useMemo, useState } from 'react'
import { CategoryPie, MonthlyBars, TrendLine } from '../components/Charts'
import { useCategories } from '../hooks/useCategories'
import { useFxRate } from '../hooks/useFxRate'
import { useTransactions } from '../hooks/useTransactions'
import { convert, formatMoney } from '../lib/fx'
import {
  cumulativeDaily, currentMonth, daysInMonth, monthLabel, monthlyTotals, shiftMonth,
  spentByCategory, totalsByType,
} from '../lib/stats'

export default function Reportes() {
  const [month, setMonth] = useState(currentMonth())
  const [cur, setCur] = useState<'ARS' | 'USD'>('ARS')
  const { rate, loading: fxLoading } = useFxRate()
  const fx = rate?.venta ?? null
  const { categories, error: catError } = useCategories()
  const { transactions, loading, error: txError } = useTransactions({ month })
  const from = `${shiftMonth(month, -5)}-01`
  const to = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`
  const range = useTransactions({ from, to })
  const loadError = txError ?? range.error ?? catError
  const usdBlocked = cur === 'USD' && fx === null

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const totals = useMemo(() => totalsByType(transactions), [transactions])
  const byCat = useMemo(() => spentByCategory(transactions), [transactions])
  const monthly = useMemo(() => {
    const got = new Map(monthlyTotals(range.transactions).map((m) => [m.month, m]))
    return Array.from({ length: 6 }, (_, i) => {
      const m = shiftMonth(month, i - 5)
      return got.get(m) ?? { month: m, income: 0, expense: 0 }
    })
  }, [range.transactions, month])
  const trend = useMemo(() => {
    const isCurrent = month === currentMonth()
    return cumulativeDaily(transactions, month, isCurrent ? new Date().getDate() : undefined)
  }, [transactions, month])

  const slices = byCat.map((s) => {
    const c = s.category_id ? catMap.get(s.category_id) : undefined
    return { name: c?.name ?? 'Sin categoría', icon: c?.icon ?? '❔', color: c?.color ?? '#94a3b8', value: s.total }
  })
  const money = (ars: number) => formatMoney(convert(ars, 'ARS', cur, fx ?? 1), cur)
  const savings = totals.income > 0 ? (totals.balance / totals.income) * 100 : 0

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reportes</h1>
        <div className="flex h-11 overflow-hidden rounded-xl border border-slate-300 dark:border-slate-600">
          {(['ARS', 'USD'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCur(c)}
              className={`px-4 text-sm font-medium ${cur === c ? 'bg-teal-700 text-white' : 'text-slate-700 dark:text-slate-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-white p-1 shadow-sm dark:bg-slate-800">
        <button aria-label="Mes anterior" className="h-11 w-11 text-xl text-slate-700 dark:text-slate-200" onClick={() => setMonth(shiftMonth(month, -1))}>‹</button>
        <span className="font-semibold capitalize text-slate-900 dark:text-slate-100">{monthLabel(month)}</span>
        <button aria-label="Mes siguiente" className="h-11 w-11 text-xl text-slate-700 dark:text-slate-200" onClick={() => setMonth(shiftMonth(month, 1))}>›</button>
      </div>

      {loadError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{loadError}</p>}

      {usdBlocked && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {fxLoading ? 'Cargando cotización…' : 'Cotización no disponible. Mostrando en pesos.'}
        </p>
      )}

      {cur === 'USD' && fx !== null && (
        <p className="text-xs text-slate-500 dark:text-slate-400">Convertido a dólar blue (venta) de hoy: {formatMoney(fx, 'ARS')}</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Card label="Gastos" value={usdBlocked ? '…' : money(totals.expense)} cls="text-rose-600 dark:text-rose-400" />
        <Card label="Ingresos" value={usdBlocked ? '…' : money(totals.income)} cls="text-emerald-600 dark:text-emerald-400" />
        <Card
          label="Ahorro"
          value={totals.income > 0 ? `${Math.round(savings)}%` : '—'}
          cls={savings >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}
        />
      </div>

      {loading ? (
        <p className="text-center text-slate-500">Cargando…</p>
      ) : (
        <>
          <Section title="Gasto por categoría">
            {usdBlocked ? <p className="py-6 text-center text-sm text-slate-500">{fxLoading ? 'Cargando cotización…' : 'Sin cotización'}</p> : <CategoryPie data={slices} currency={cur} rate={fx ?? 1} />}
            {slices.length > 0 && (
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {slices.slice(0, 5).map((s) => (
                    <tr key={s.name} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="py-2 text-slate-800 dark:text-slate-100">{s.icon} {s.name}</td>
                      <td className="py-2 text-right text-slate-500 dark:text-slate-400">
                        {totals.expense > 0 ? Math.round((s.value / totals.expense) * 100) : 0}%
                      </td>
                      <td className="py-2 pl-3 text-right font-medium text-slate-900 dark:text-slate-100">{usdBlocked ? '…' : money(s.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
          <Section title="Últimos 6 meses">
            {usdBlocked ? <p className="py-6 text-center text-sm text-slate-500">{fxLoading ? 'Cargando cotización…' : 'Sin cotización'}</p> : <MonthlyBars data={monthly} currency={cur} rate={fx ?? 1} />}
          </Section>
          <Section title="Gasto acumulado del mes">
            {usdBlocked ? <p className="py-6 text-center text-sm text-slate-500">{fxLoading ? 'Cargando cotización…' : 'Sin cotización'}</p> : <TrendLine data={trend} currency={cur} rate={fx ?? 1} />}
          </Section>
        </>
      )}
    </div>
  )
}

function Card({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-800">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`mt-1 text-sm font-bold leading-tight ${cls}`}>{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
      <h2 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {children}
    </section>
  )
}
