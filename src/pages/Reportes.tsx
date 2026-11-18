import { useMemo, useState } from 'react'
import { CategoryRanking, MonthlyBars, TrendLine } from '../components/Charts'
import { Card, SectionTitle } from '../components/ui/Card'
import { Equiv, Money } from '../components/ui/Money'
import { MonthSwitcher } from '../components/ui/MonthSwitcher'
import { PageHeader } from '../components/ui/PageHeader'
import { Segmented } from '../components/ui/Segmented'
import { useBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { useFxRate } from '../hooks/useFxRate'
import { useTransactions } from '../hooks/useTransactions'
import { convert, formatMoney } from '../lib/fx'
import {
  budgetProgress, cumulativeDaily, currentMonth, daysInMonth, monthlyTotals, shiftMonth,
  spentByCategory, totalsByType,
} from '../lib/stats'

export default function Reportes() {
  const [month, setMonth] = useState(currentMonth())
  const [cur, setCur] = useState<'ARS' | 'USD'>('ARS')
  const { rate, loading: fxLoading } = useFxRate()
  const fx = rate?.venta ?? null
  const { categories, error: catError } = useCategories()
  const { transactions, loading, error: txError } = useTransactions({ month })
  const { budgets } = useBudgets(month)
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
  // total presupuestado del mes en ARS (los presupuestos en USD se suman solo si hay cotización)
  const budgetTotal = useMemo(
    () => budgets.reduce((s, b) => (b.currency === 'USD' && fx === null ? s : s + budgetProgress(b, 0, fx ?? 1).limit), 0),
    [budgets, fx],
  )

  const slices = byCat.map((s) => {
    const c = s.category_id ? catMap.get(s.category_id) : undefined
    return { id: s.category_id ?? 'sin-categoria', name: c?.name ?? 'Sin categoría', category: c ?? null, value: s.total }
  })
  const other = cur === 'ARS' ? 'USD' : 'ARS'
  const view = (ars: number) => convert(ars, 'ARS', cur, fx ?? 1)
  const viewOther = (ars: number) => convert(ars, 'ARS', other, fx ?? 1)
  const savings = totals.income > 0 ? (totals.balance / totals.income) * 100 : 0
  const nofx = <p className="grid h-40 place-items-center text-[13px] text-fg-3">{fxLoading ? 'Cargando cotización…' : 'Sin cotización'}</p>
  const spentTotal = trend.length ? trend[trend.length - 1].total : 0

  return (
    <div>
      <PageHeader
        title="Reportes"
        action={
          <Segmented
            label="Moneda" value={cur} onChange={setCur} className="w-32"
            options={[{ value: 'ARS', label: 'ARS' }, { value: 'USD', label: 'USD' }]}
          />
        }
      />
      <div className="space-y-6 px-4 pb-6">
        <MonthSwitcher month={month} onChange={setMonth} />

        {loadError && <p role="alert" className="rounded-control border border-line bg-surface p-3 text-[13px] leading-5 text-neg">{loadError}</p>}

        {usdBlocked && (
          <p className="text-[13px] leading-5 text-fg-3">
            {fxLoading ? 'Cargando cotización…' : 'Cotización no disponible, mostrando en pesos'}
          </p>
        )}
        {cur === 'USD' && fx !== null && (
          <p className="num font-mono text-[12px] leading-4 text-fg-3">Dólar blue venta de hoy: {formatMoney(fx, 'ARS')}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card className="min-w-0">
            <div className="text-[13px] leading-5 text-fg-2">Gastos</div>
            <div className="mt-1">
              {usdBlocked ? <span className="text-[20px] text-fg-3">…</span> : <Money kind="expense" amount={view(totals.expense)} currency={cur} className="text-[20px] leading-7 font-medium" />}
            </div>
            {fx !== null && <div><Equiv amount={viewOther(totals.expense)} currency={other} /></div>}
          </Card>
          <Card className="min-w-0">
            <div className="text-[13px] leading-5 text-fg-2">Ingresos</div>
            <div className="mt-1">
              {usdBlocked ? <span className="text-[20px] text-fg-3">…</span> : <Money kind="income" amount={view(totals.income)} currency={cur} className="text-[20px] leading-7 font-medium" />}
            </div>
            {fx !== null && <div><Equiv amount={viewOther(totals.income)} currency={other} /></div>}
          </Card>
          <Card pad={false} className="col-span-2 flex h-12 items-center justify-between px-5">
            <span className="text-[13px] text-fg-2">Ahorro</span>
            <span className={`num text-[15px] font-medium ${totals.income > 0 && savings < 0 ? 'text-neg' : ''}`}>
              {totals.income > 0 ? `${Math.round(savings)}%` : '—'}
            </span>
          </Card>
        </div>

        {loading ? (
          <p className="text-center text-[13px] text-fg-3">Cargando…</p>
        ) : (
          <>
            <section>
              <SectionTitle>Gasto acumulado del mes</SectionTitle>
              <Card className="px-3 pt-5 pb-3">
                {usdBlocked ? nofx : (
                  <>
                    <div className="px-2 pb-4">
                      <Money amount={view(spentTotal)} currency={cur} className="text-[28px] leading-8 font-medium" />
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                        {fx !== null && <Equiv amount={viewOther(spentTotal)} currency={other} />}
                        {budgetTotal > 0 && <span className="num font-mono text-[12px] leading-4 text-fg-3">de {formatMoney(view(budgetTotal), cur)} presupuestados</span>}
                      </div>
                    </div>
                    <TrendLine data={trend} budget={budgetTotal} days={daysInMonth(month)} currency={cur} rate={fx ?? 1} />
                  </>
                )}
              </Card>
            </section>
            <section>
              <SectionTitle>Gasto por categoría</SectionTitle>
              <Card>
                {usdBlocked ? nofx : <CategoryRanking data={slices} currency={cur} rate={fx ?? 1} />}
              </Card>
            </section>
            <section>
              <SectionTitle>Últimos 6 meses</SectionTitle>
              <Card className="px-3 pt-4 pb-4">
                {usdBlocked ? nofx : <MonthlyBars data={monthly} currency={cur} rate={fx ?? 1} />}
              </Card>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
