import { useMemo, useState } from 'react'
import { Copy, Plus } from 'lucide-react'
import BudgetBar from '../components/BudgetBar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { Equiv, Money } from '../components/ui/Money'
import { Icon } from '../components/ui/Icon'
import { MonthSwitcher } from '../components/ui/MonthSwitcher'
import { Segmented } from '../components/ui/Segmented'
import { Sheet } from '../components/ui/Sheet'
import { PageHeader } from '../components/ui/PageHeader'
import { useBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { useFxRate } from '../hooks/useFxRate'
import { useTransactions } from '../hooks/useTransactions'
import { convert, formatMoney } from '../lib/fx'
import { budgetProgress, currentMonth, shiftMonth, spentByCategory } from '../lib/stats'
import type { Budget, Currency } from '../lib/types'

interface Draft { id?: string; category_id: string; amount: string; currency: Currency }

export default function Presupuestos() {
  const [month, setMonth] = useState(currentMonth())
  const { budgets, loading, error, upsert, upsertMany, remove } = useBudgets(month)
  const prev = useBudgets(shiftMonth(month, -1))
  const { categories } = useCategories()
  const { transactions } = useTransactions({ month })
  const fxState = useFxRate()
  const rate = fxState.rate
  const { loading: fxLoading } = fxState
  const fx = rate?.venta ?? null

  const [draft, setDraft] = useState<Draft | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const spent = useMemo(
    () => new Map(spentByCategory(transactions).map((s) => [s.category_id, s.total])),
    [transactions],
  )
  const expenseCats = categories.filter((c) => c.type === 'expense')

  const rows = budgets.map((b) => ({
    b,
    cat: catMap.get(b.category_id),
    p: b.currency === 'USD' && fx === null ? null : budgetProgress(b, spent.get(b.category_id) ?? 0, fx ?? 1),
  }))
  const pendingFx = rows.some((r) => r.p === null)
  const totalLimit = rows.reduce((s, r) => s + (r.p?.limit ?? 0), 0)
  const totalSpent = rows.reduce((s, r) => s + (r.p?.spent ?? 0), 0)
  const totalPct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
  const totalBar = totalPct >= 100 ? 'bg-neg' : totalPct >= 80 ? 'bg-warn' : 'bg-accent'

  function openNew() {
    const free = expenseCats.find((c) => !budgets.some((b) => b.category_id === c.id))
    setMsg(null)
    setDraft({ category_id: (free ?? expenseCats[0])?.id ?? '', amount: '', currency: 'ARS' })
  }
  function openEdit(b: Budget) {
    setMsg(null)
    setDraft({ id: b.id, category_id: b.category_id, amount: String(b.amount), currency: b.currency })
  }

  async function save() {
    if (!draft) return
    const amount = Number(draft.amount.replace(',', '.'))
    if (!draft.category_id) return setMsg('Elegí una categoría')
    if (!(amount > 0)) return setMsg('Ingresá un monto mayor a 0')
    setBusy(true)
    const err = await upsert({ category_id: draft.category_id, month, amount, currency: draft.currency })
    setBusy(false)
    if (err) return setMsg(err)
    setDraft(null)
  }

  async function del() {
    if (!draft?.id) return
    if (!confirm('¿Eliminar este presupuesto?')) return
    setBusy(true)
    const err = await remove(draft.id)
    setBusy(false)
    if (err) return setMsg(err)
    setDraft(null)
  }

  async function copyPrev() {
    const todo = prev.budgets.filter((p) => !budgets.some((b) => b.category_id === p.category_id))
    if (!todo.length) {
      setMsg(prev.budgets.length ? 'Ya tenés todos los presupuestos del mes anterior' : 'El mes anterior no tiene presupuestos')
      return
    }
    setBusy(true)
    setMsg(null)
    const err = await upsertMany(
      todo.map((p) => ({ category_id: p.category_id, month, amount: p.amount, currency: p.currency })),
    )
    if (err) setMsg(err)
    setBusy(false)
  }

  const alertCls = 'rounded-control border border-line bg-surface p-3 text-[13px] leading-5 text-neg'
  const field = 'mt-1 h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-[15px] text-fg placeholder:text-fg-3'

  return (
    <div>
      <PageHeader title="Presupuestos" />
      <div className="space-y-6 px-4 pb-6">
        <MonthSwitcher month={month} onChange={setMonth} />

        <Card>
          <div className="text-[13px] leading-5 font-medium text-fg-2">Gastado sobre lo presupuestado</div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
            <Money amount={totalSpent} currency="ARS" className="text-[32px] leading-10 font-medium" />
            <span className="num text-[15px] text-fg-2">de {formatMoney(totalLimit, 'ARS')}</span>
          </div>
          {fx !== null && <Equiv amount={convert(totalSpent, 'ARS', 'USD', fx)} currency="USD" />}
          <div
            className="mt-4 h-1.5 overflow-hidden rounded-full bg-raised"
            role="progressbar" aria-label="Gastado sobre lo presupuestado"
            aria-valuenow={Math.round(totalPct)} aria-valuemin={0} aria-valuemax={100}
          >
            <div className={`h-full rounded-full ${totalBar}`} style={{ width: `${Math.min(100, totalPct)}%` }} />
          </div>
          <div className="mt-2 font-mono text-[12px] leading-4 text-fg-3">
            {pendingFx && fxLoading ? 'Cargando cotización…' : pendingFx ? 'Cotización no disponible, no se suman los presupuestos en USD' : `${Math.round(totalPct)}% usado`}
          </div>
        </Card>

        {error && <p role="alert" className={alertCls}>{error}</p>}
        {msg && !draft && <p role="alert" className={alertCls}>{msg}</p>}

        {loading ? (
          <p className="text-center text-[13px] text-fg-3">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-[15px] text-fg-3">No hay presupuestos para este mes</p>
        ) : (
          <Card pad={false} className="divide-y divide-line overflow-hidden">
            {rows.map(({ b, cat, p }) => p === null ? (
              <button
                key={b.id}
                type="button"
                onClick={() => openEdit(b)}
                className="flex min-h-11 w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-raised"
              >
                <CategoryIcon category={cat} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] leading-5">{cat?.name ?? 'Sin categoría'}</span>
                  <span className="num mt-1 block font-mono text-[12px] leading-4 text-fg-3">
                    {formatMoney(b.amount, 'USD')} · {fxLoading ? 'Cargando cotización…' : 'Cotización no disponible'}
                  </span>
                </span>
              </button>
            ) : (
              <BudgetBar
                key={b.id}
                category={cat}
                name={cat?.name ?? 'Sin categoría'}
                {...p}
                onClick={() => openEdit(b)}
              />
            ))}
          </Card>
        )}

        <div className="space-y-2">
          <Button block onClick={openNew}><Icon icon={Plus} />Agregar presupuesto</Button>
          <Button block variant="secondary" onClick={copyPrev} disabled={busy}><Icon icon={Copy} />Copiar del mes anterior</Button>
        </div>
      </div>

      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Editar presupuesto' : 'Nuevo presupuesto'}>
        {draft && (
          <div className="space-y-4">
            <label className="block text-[13px] leading-5 text-fg-2">
              Categoría
              <select
                value={draft.category_id}
                disabled={!!draft.id}
                onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                className={field}
              >
                {expenseCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <div className="flex items-end gap-3">
              <label className="block flex-1 text-[13px] leading-5 text-fg-2">
                Monto
                <input
                  inputMode="decimal"
                  value={draft.amount}
                  onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                  placeholder="0"
                  className={`${field} num`}
                />
              </label>
              <Segmented
                label="Moneda"
                value={draft.currency}
                onChange={(c) => setDraft({ ...draft, currency: c })}
                options={[{ value: 'ARS', label: 'ARS' }, { value: 'USD', label: 'USD' }]}
                className="w-40"
              />
            </div>
            {msg && <p role="alert" className="text-[13px] leading-5 text-neg">{msg}</p>}
            <div className="flex gap-2 pt-1">
              {draft.id && <Button variant="danger" onClick={del} disabled={busy}>Eliminar</Button>}
              <Button variant="secondary" className="flex-1" onClick={() => setDraft(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={save} disabled={busy}>Guardar</Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
