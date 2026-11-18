import { useEffect, useMemo, useState } from 'react'
import BudgetBar from '../components/BudgetBar'
import { useBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { useFxRate } from '../hooks/useFxRate'
import { useTransactions } from '../hooks/useTransactions'
import { formatMoney } from '../lib/fx'
import { budgetProgress, currentMonth, monthLabel, shiftMonth, spentByCategory } from '../lib/stats'
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

  useEffect(() => {
    if (!draft) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDraft(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [draft])

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

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Presupuestos</h1>

      <div className="flex items-center justify-between rounded-2xl bg-white p-1 shadow-sm dark:bg-slate-800">
        <button aria-label="Mes anterior" className="h-11 w-11 text-xl text-slate-700 dark:text-slate-200" onClick={() => setMonth(shiftMonth(month, -1))}>‹</button>
        <span className="font-semibold capitalize text-slate-900 dark:text-slate-100">{monthLabel(month)}</span>
        <button aria-label="Mes siguiente" className="h-11 w-11 text-xl text-slate-700 dark:text-slate-200" onClick={() => setMonth(shiftMonth(month, 1))}>›</button>
      </div>

      <div className="rounded-2xl bg-teal-700 p-4 text-white shadow-sm">
        <div className="text-sm opacity-80">Gastado sobre lo presupuestado</div>
        <div className="mt-1 text-2xl font-bold">
          {formatMoney(totalSpent, 'ARS')} <span className="text-base font-normal opacity-80">de {formatMoney(totalLimit, 'ARS')}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, totalPct)}%` }} />
        </div>
        <div className="mt-1 text-xs opacity-80">
          {pendingFx && fxLoading ? 'Cargando cotización…' : pendingFx ? 'Cotización no disponible (presupuestos en USD excluidos)' : `${Math.round(totalPct)}% usado`}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
      )}
      {msg && !draft && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{msg}</p>
      )}

      {loading ? (
        <p className="text-center text-slate-500">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-slate-500 dark:text-slate-400">No hay presupuestos para este mes.</p>
      ) : (
        <div className="space-y-3">
          {rows.map(({ b, cat, p }) => p === null ? (
            <button
              key={b.id}
              type="button"
              onClick={() => openEdit(b)}
              className="block min-h-11 w-full rounded-2xl bg-white p-3 text-left shadow-sm dark:bg-slate-800"
            >
              <span className="font-medium text-slate-800 dark:text-slate-100">
                <span className="mr-1.5">{cat?.icon ?? '❔'}</span>{cat?.name ?? 'Sin categoría'}
              </span>
              <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {formatMoney(b.amount, 'USD')} · {fxLoading ? 'Cargando cotización…' : 'Cotización no disponible'}
              </div>
            </button>
          ) : (
            <BudgetBar
              key={b.id}
              icon={cat?.icon ?? '❔'}
              name={cat?.name ?? 'Sin categoría'}
              {...p}
              onClick={() => openEdit(b)}
            />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={openNew} className="h-12 flex-1 rounded-xl bg-teal-700 font-semibold text-white active:bg-teal-800">
          + Agregar presupuesto
        </button>
        <button
          onClick={copyPrev}
          disabled={busy}
          className="h-12 flex-1 rounded-xl border border-slate-300 font-medium text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
        >
          Copiar del mes anterior
        </button>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setDraft(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-dialog-title"
            className="mx-auto w-full max-w-md space-y-3 rounded-t-3xl bg-white p-5 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="budget-dialog-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {draft.id ? 'Editar presupuesto' : 'Nuevo presupuesto'}
            </h2>
            <label className="block text-sm text-slate-600 dark:text-slate-300">
              Categoría
              <select
                value={draft.category_id}
                disabled={!!draft.id}
                onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {expenseCats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </label>
            <div className="flex gap-2">
              <label className="block flex-1 text-sm text-slate-600 dark:text-slate-300">
                Monto
                <input
                  inputMode="decimal"
                  value={draft.amount}
                  onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                  placeholder="0"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Moneda
                <div className="mt-1 flex h-11 overflow-hidden rounded-xl border border-slate-300 dark:border-slate-600">
                  {(['ARS', 'USD'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDraft({ ...draft, currency: c })}
                      className={`px-4 font-medium ${draft.currency === c ? 'bg-teal-700 text-white' : 'text-slate-700 dark:text-slate-200'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {msg && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{msg}</p>}
            <div className="flex gap-2 pt-1">
              {draft.id && (
                <button onClick={del} disabled={busy} className="h-12 rounded-xl px-4 font-medium text-red-600 disabled:opacity-50 dark:text-red-400">
                  Eliminar
                </button>
              )}
              <button onClick={() => setDraft(null)} className="h-12 flex-1 rounded-xl border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200">
                Cancelar
              </button>
              <button onClick={save} disabled={busy} className="h-12 flex-1 rounded-xl bg-teal-700 font-semibold text-white disabled:opacity-50">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
