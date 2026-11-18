import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AmountInput from '../components/AmountInput'
import CategoryPicker from '../components/CategoryPicker'
import { parseLocalDate } from '../components/TransactionItem'
import { useCategories } from '../hooks/useCategories'
import { useFxRate } from '../hooks/useFxRate'
import { useRecurring } from '../hooks/useRecurring'
import { convert, formatMoney } from '../lib/fx'
import { installmentProgress, nextOccurrence } from '../lib/recurring'
import { syncRecurring } from '../lib/syncRecurring'
import type { Currency, NewRecurringRule, RecurringKind, RecurringRule, TxType } from '../lib/types'

const fmtDay = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })
const QUICK_N = [3, 6, 12, 18, 24]

function thisMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

interface Draft {
  id?: string
  kind: RecurringKind
  type: TxType
  amount: string
  currency: Currency
  totalMode: boolean
  n: string
  category_id: string | null
  day: string
  start_month: string
  note: string
}

const field = 'mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
const seg = (on: boolean) => `h-11 flex-1 font-medium ${on ? 'bg-teal-700 text-white' : 'text-slate-700 dark:text-slate-200'}`

export default function Fijos() {
  const { rules, loading, error, add, update, remove } = useRecurring()
  const { categories } = useCategories()
  const { rate, loading: fxLoading } = useFxRate()
  const fx = rate?.venta ?? null
  const today = new Date()

  const [draft, setDraft] = useState<Draft | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  useEffect(() => {
    if (!draft) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDraft(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [draft])

  const fixed = rules.filter((r) => r.kind === 'fixed')
  const inst = rules.filter((r) => r.kind === 'installments')

  // total mensual comprometido (solo gastos activos y cuotas que aún no terminaron)
  const committing = rules.filter((r) => {
    if (!r.active || r.type !== 'expense') return false
    if (r.kind === 'fixed') return true
    const p = installmentProgress(r, today)
    return !p || p.paid < p.total
  })
  const arsOnly = committing.filter((r) => r.currency === 'ARS').reduce((s, r) => s + r.amount, 0)
  const usdSum = committing.filter((r) => r.currency === 'USD').reduce((s, r) => s + r.amount, 0)
  const total = arsOnly + (fx !== null ? convert(usdSum, 'USD', 'ARS', fx) : 0)

  function openNew() {
    setMsg(null)
    setDraft({
      kind: 'fixed', type: 'expense', amount: '', currency: 'ARS', totalMode: false, n: '12',
      category_id: null, day: String(Math.min(28, today.getDate())), start_month: thisMonth(), note: '',
    })
  }
  function openEdit(r: RecurringRule) {
    setMsg(null)
    setDraft({
      id: r.id, kind: r.kind, type: r.type, amount: String(r.amount).replace('.', ','), currency: r.currency,
      totalMode: false, n: String(r.installments_total ?? 12), category_id: r.category_id,
      day: String(r.day_of_month), start_month: r.start_month, note: r.note ?? '',
    })
  }

  const n = draft ? Math.round(Number(draft.n)) : 0
  const typed = draft ? Number(draft.amount.replace(',', '.')) : 0
  const perInstallment = draft && draft.kind === 'installments' && draft.totalMode && n >= 2
    ? Math.round((typed / n) * 100) / 100
    : typed

  async function save() {
    if (!draft) return
    const day = Math.round(Number(draft.day))
    if (!(typed > 0)) return setMsg('Ingresá un monto mayor a 0')
    if (draft.kind === 'installments' && !(n >= 2 && n <= 120)) return setMsg('Las cuotas tienen que ser entre 2 y 120')
    if (!(day >= 1 && day <= 28)) return setMsg('El día tiene que estar entre 1 y 28')
    if (!/^\d{4}-\d{2}$/.test(draft.start_month)) return setMsg('Elegí el mes de inicio')
    if (!(perInstallment > 0)) return setMsg('El monto por cuota es demasiado chico')
    const payload: NewRecurringRule = {
      kind: draft.kind,
      type: draft.kind === 'installments' ? 'expense' : draft.type,
      amount: perInstallment,
      currency: draft.currency,
      category_id: draft.category_id,
      note: draft.note.trim() || null,
      day_of_month: day,
      start_month: draft.start_month,
      installments_total: draft.kind === 'installments' ? n : null,
      active: draft.id ? (rules.find((r) => r.id === draft.id)?.active ?? true) : true,
    }
    setBusy(true)
    setMsg(null)
    const err = draft.id ? await update(draft.id, payload) : await add(payload)
    if (err) { setBusy(false); return setMsg(err) }
    try { await syncRecurring() } catch { /* se reintenta al abrir la app */ }
    setBusy(false)
    setDraft(null)
  }

  async function del() {
    if (!draft?.id) return
    if (!confirm('¿Eliminar esta regla? Los movimientos que ya se generaron se conservan.')) return
    setBusy(true)
    const err = await remove(draft.id)
    setBusy(false)
    if (err) return setMsg(err)
    setDraft(null)
  }

  async function toggle(r: RecurringRule) {
    setMsg(null)
    const err = await update(r.id, { active: !r.active })
    if (err) setMsg(err)
    else if (!r.active) { try { await syncRecurring() } catch { /* noop */ } }
  }

  function renderRule(r: RecurringRule) {
    const cat = r.category_id ? catMap.get(r.category_id) : undefined
    const next = nextOccurrence(r, today)
    const prog = r.kind === 'installments' ? installmentProgress(r, today) : null
    const pct = prog && prog.total > 0 ? Math.min(100, (prog.paid / prog.total) * 100) : 0
    const isExp = r.type === 'expense'
    return (
      <li key={r.id} className={`rounded-2xl bg-white shadow-sm dark:bg-slate-800 ${r.active ? '' : 'opacity-60'}`}>
        <div className="flex items-stretch">
          <button type="button" onClick={() => openEdit(r)} className="min-h-[56px] min-w-0 flex-1 p-3 text-left">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl" style={{ backgroundColor: (cat?.color ?? '#94a3b8') + '33' }}>
                {cat?.icon ?? '❓'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">{r.note || cat?.name || 'Sin categoría'}</span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                  {r.note && cat ? `${cat.name} · ` : ''}{next ? `Próximo: ${fmtDay.format(parseLocalDate(next.date))}` : 'Finalizado'}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className={`block text-sm font-semibold ${isExp ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {isExp ? '-' : '+'}{formatMoney(r.amount, r.currency)}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{r.kind === 'fixed' ? 'por mes' : 'por cuota'}</span>
              </span>
            </div>
            {prog && (
              <div className="mt-2">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-full rounded-full bg-teal-600" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Cuota {Math.min(prog.total, prog.paid + (next ? 1 : 0))} de {prog.total}</span>
                  <span>Total: {formatMoney(Math.round(r.amount * prog.total * 100) / 100, r.currency)}</span>
                </div>
              </div>
            )}
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-3 dark:border-slate-700">
          <span className="text-sm text-slate-600 dark:text-slate-300">{r.active ? 'Activo' : 'Pausado'}</span>
          <button
            type="button"
            role="switch"
            aria-checked={r.active}
            aria-label={`${r.active ? 'Pausar' : 'Activar'} ${r.note || cat?.name || 'regla'}`}
            onClick={() => void toggle(r)}
            className="grid h-11 w-14 place-items-center"
          >
            <span className={`flex h-7 w-12 items-center rounded-full px-0.5 transition ${r.active ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <span className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${r.active ? 'translate-x-5' : ''}`} />
            </span>
          </button>
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Link to="/ajustes" aria-label="Volver" className="grid h-11 w-11 place-items-center text-xl text-slate-700 dark:text-slate-200">‹</Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Fijos y cuotas</h1>
      </div>

      <div className="rounded-2xl bg-teal-700 p-4 text-white shadow-sm">
        <div className="text-sm opacity-80">Comprometido por mes</div>
        <div className="mt-1 text-2xl font-bold">
          {formatMoney(total, 'ARS')}
        </div>
        <div className="mt-1 text-xs opacity-80">
          {usdSum > 0 && fx === null
            ? (fxLoading ? 'Cargando cotización…' : `Solo en pesos: sin cotización no se suman ${formatMoney(usdSum, 'USD')} en dólares`)
            : usdSum > 0 ? `Incluye ${formatMoney(usdSum, 'USD')} al dólar blue venta` : 'Gastos fijos activos y cuotas en curso'}
        </div>
      </div>

      {(error || msg) && !draft && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error ?? msg}</p>
      )}

      {loading ? (
        <p className="text-center text-slate-500">Cargando…</p>
      ) : (
        <>
          <section>
            <h2 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Gastos fijos</h2>
            {fixed.length === 0
              ? <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">Todavía no cargaste fijos (alquiler, servicios…).</p>
              : <ul className="space-y-2">{fixed.map(renderRule)}</ul>}
          </section>
          <section>
            <h2 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">En cuotas</h2>
            {inst.length === 0
              ? <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">No tenés compras en cuotas.</p>
              : <ul className="space-y-2">{inst.map(renderRule)}</ul>}
          </section>
        </>
      )}

      <button onClick={openNew} className="h-12 w-full rounded-xl bg-teal-700 font-semibold text-white active:bg-teal-800">
        + Nuevo fijo o cuota
      </button>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setDraft(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rec-dialog-title"
            className="mx-auto max-h-[92dvh] w-full max-w-md space-y-3 overflow-y-auto rounded-t-3xl bg-white p-5 text-slate-900 dark:bg-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="rec-dialog-title" className="text-lg font-bold">{draft.id ? 'Editar' : 'Nuevo fijo o cuota'}</h2>

            <div className="flex overflow-hidden rounded-xl border border-slate-300 dark:border-slate-600" role="group" aria-label="Tipo de regla">
              <button type="button" disabled={!!draft.id} onClick={() => setDraft({ ...draft, kind: 'fixed' })} className={seg(draft.kind === 'fixed')}>Fijo mensual</button>
              <button type="button" disabled={!!draft.id} onClick={() => setDraft({ ...draft, kind: 'installments', type: 'expense', category_id: draft.type === 'expense' ? draft.category_id : null })} className={seg(draft.kind === 'installments')}>En cuotas</button>
            </div>

            {draft.kind === 'fixed' && (
              <div className="flex overflow-hidden rounded-xl border border-slate-300 dark:border-slate-600" role="group" aria-label="Gasto o ingreso">
                {([['expense', 'Gasto'], ['income', 'Ingreso']] as const).map(([t, l]) => (
                  <button key={t} type="button" onClick={() => setDraft({ ...draft, type: t, category_id: null })} className={seg(draft.type === t)}>{l}</button>
                ))}
              </div>
            )}

            <AmountInput amount={draft.amount} onAmountChange={(v) => setDraft({ ...draft, amount: v })} currency={draft.currency} onCurrencyChange={(c) => setDraft({ ...draft, currency: c })} />

            {draft.kind === 'installments' && (
              <>
                <div className="flex overflow-hidden rounded-xl border border-slate-300 dark:border-slate-600" role="group" aria-label="El monto es">
                  <button type="button" onClick={() => setDraft({ ...draft, totalMode: false })} className={seg(!draft.totalMode)}>Monto por cuota</button>
                  <button type="button" onClick={() => setDraft({ ...draft, totalMode: true })} className={seg(draft.totalMode)}>Total de la compra</button>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Cantidad de cuotas
                  <input
                    type="text"
                    inputMode="numeric"
                    value={draft.n}
                    onChange={(e) => setDraft({ ...draft, n: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                    aria-label="Cantidad de cuotas"
                    className={field}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {QUICK_N.map((q) => (
                      <button key={q} type="button" onClick={() => setDraft({ ...draft, n: String(q) })}
                        className={`h-11 min-w-11 rounded-full border px-4 font-medium ${n === q ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200'}`}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                {typed > 0 && n >= 2 && (
                  <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {n} cuotas de {formatMoney(perInstallment, draft.currency)}
                    {!draft.totalMode && <> · total {formatMoney(Math.round(typed * n * 100) / 100, draft.currency)}</>}
                  </p>
                )}
              </>
            )}

            <div>
              <div className="mb-1 text-sm text-slate-600 dark:text-slate-300">Categoría</div>
              <CategoryPicker categories={categories} type={draft.kind === 'installments' ? 'expense' : draft.type} value={draft.category_id} onChange={(id) => setDraft({ ...draft, category_id: id })} />
            </div>

            <div className="flex gap-2">
              <label className="block flex-1 text-sm text-slate-600 dark:text-slate-300">
                Día del mes (1-28)
                <input type="number" inputMode="numeric" min={1} max={28} value={draft.day} onChange={(e) => setDraft({ ...draft, day: e.target.value })} className={field} />
              </label>
              <label className="block flex-1 text-sm text-slate-600 dark:text-slate-300">
                Mes de inicio
                <input type="month" value={draft.start_month} onChange={(e) => setDraft({ ...draft, start_month: e.target.value })} className={field} />
              </label>
            </div>

            <label className="block text-sm text-slate-600 dark:text-slate-300">
              Nota
              <input type="text" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Ej: Alquiler, Heladera" className={field} />
            </label>

            {msg && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{msg}</p>}

            <div className="flex gap-2 pt-1">
              {draft.id && (
                <button onClick={() => void del()} disabled={busy} className="h-12 rounded-xl px-4 font-medium text-red-600 disabled:opacity-50 dark:text-red-400">Eliminar</button>
              )}
              <button onClick={() => setDraft(null)} className="h-12 flex-1 rounded-xl border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200">Cancelar</button>
              <button onClick={() => void save()} disabled={busy} className="h-12 flex-1 rounded-xl bg-teal-700 font-semibold text-white disabled:opacity-50">
                {busy ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
