import { softBreak } from '../lib/format'
import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import AmountInput from '../components/AmountInput'
import CategoryPicker from '../components/CategoryPicker'
import { Button } from '../components/ui/Button'
import { Card, SectionTitle } from '../components/ui/Card'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { Icon } from '../components/ui/Icon'
import { Equiv, Money } from '../components/ui/Money'
import { PageHeader } from '../components/ui/PageHeader'
import { Sheet } from '../components/ui/Sheet'
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

const field = 'mt-1 h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-[15px] text-fg placeholder:text-fg-3'
const label = 'block text-[13px] leading-5 text-fg-2'

/** Control segmentado con opción deshabilitable (al editar no se cambia el tipo de regla). */
function Seg({ label: aria, options, value, onChange, disabled }: {
  label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; disabled?: boolean
}) {
  return (
    <div role="group" aria-label={aria} className={`flex rounded-control bg-raised p-1 ${disabled ? 'opacity-60' : ''}`}>
      {options.map((o) => (
        <button
          key={o.value} type="button" disabled={disabled} aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={`h-9 flex-1 rounded-[6px] px-3 text-[14px] font-medium transition-colors duration-150 ease-soft ${
            value === o.value ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-fg-3 hover:text-fg-2'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

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
    const other = r.currency === 'ARS' ? 'USD' : 'ARS'
    return (
      <li key={r.id}>
        <Card pad={false} className={r.active ? '' : 'opacity-60'}>
          <button type="button" onClick={() => openEdit(r)} className="block min-h-14 w-full rounded-t-card p-5 text-left transition-colors hover:bg-raised">
            <div className="flex items-start gap-3">
              <CategoryIcon category={cat} />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-[15px] leading-5 break-words">{r.note || cat?.name || 'Sin categoría'}</span>
                <span className="mt-1 block text-[13px] leading-5 break-words text-fg-3">
                  {r.note && cat ? `${softBreak(cat.name)} · ` : ''}{next ? `Próximo: ${fmtDay.format(parseLocalDate(next.date))}` : 'Finalizado'}
                  {` · ${r.kind === 'fixed' ? 'por mes' : 'por cuota'}`}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <Money kind={isExp ? 'expense' : 'income'} amount={r.amount} currency={r.currency} className="block text-[15px] leading-5 font-medium" />
                {fx !== null && <Equiv amount={convert(r.amount, r.currency, other, fx)} currency={other} className="block" />}
              </span>
            </div>
            {prog && (
              <div className="mt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-raised">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <div className="num mt-2 flex flex-wrap justify-between gap-x-3 font-mono text-[12px] leading-4 text-fg-3">
                  <span>{prog.paid} de {prog.total} cuotas pagas{next?.installment_number ? ` · próxima: ${next.installment_number}` : ''}</span>
                  <span>Total: {formatMoney(Math.round(r.amount * prog.total * 100) / 100, r.currency)}</span>
                </div>
              </div>
            )}
          </button>
          <div className="flex items-center justify-between border-t border-line px-5">
            <span className="text-[13px] text-fg-2">{r.active ? 'Activo' : 'Pausado'}</span>
            <button
              type="button"
              role="switch"
              aria-checked={r.active}
              aria-label={`${r.active ? 'Pausar' : 'Activar'} ${r.note || cat?.name || 'regla'}`}
              onClick={() => void toggle(r)}
              className="-mr-2 grid h-11 w-14 place-items-center"
            >
              <span className={`flex h-7 w-12 items-center rounded-full border px-0.5 transition-colors duration-150 ease-soft ${r.active ? 'border-accent bg-accent' : 'border-line-strong bg-raised'}`}>
                <span className={`h-5 w-5 rounded-full transition-transform duration-150 ease-soft ${r.active ? 'translate-x-5 bg-on-accent' : 'translate-x-0 bg-fg-3'}`} />
              </span>
            </button>
          </div>
        </Card>
      </li>
    )
  }

  const empty = (text: string) => <Card><p className="text-center text-[13px] text-fg-3">{text}</p></Card>

  return (
    <div>
      <PageHeader title="Fijos y cuotas" back="/ajustes" />
      <div className="space-y-6 px-4 pb-6">
        <Card>
          <div className="text-[13px] leading-5 font-medium text-fg-2">Comprometido por mes</div>
          <Money amount={total} currency="ARS" className="mt-2 block text-[32px] leading-10 font-medium" />
          {fx !== null && <Equiv amount={convert(total, 'ARS', 'USD', fx)} currency="USD" />}
          <div className="mt-2 text-[13px] leading-5 text-fg-3">
            {usdSum > 0 && fx === null
              ? (fxLoading ? 'Cargando cotización…' : `Solo en pesos: sin cotización no se suman ${formatMoney(usdSum, 'USD')}`)
              : usdSum > 0 ? `Incluye ${formatMoney(usdSum, 'USD')} al dólar blue venta` : 'Gastos fijos activos y cuotas en curso'}
          </div>
        </Card>

        {(error || msg) && !draft && (
          <p role="alert" className="rounded-control border border-line bg-surface p-3 text-[13px] leading-5 text-neg">{error ?? msg}</p>
        )}

        {loading ? (
          <p className="text-center text-[13px] text-fg-3">Cargando…</p>
        ) : (
          <>
            <section>
              <SectionTitle>Gastos fijos</SectionTitle>
              {fixed.length === 0 ? empty('Todavía no cargaste fijos (alquiler, servicios…)') : <ul className="space-y-3">{fixed.map(renderRule)}</ul>}
            </section>
            <section>
              <SectionTitle>En cuotas</SectionTitle>
              {inst.length === 0 ? empty('No tenés compras en cuotas') : <ul className="space-y-3">{inst.map(renderRule)}</ul>}
            </section>
          </>
        )}

        <Button block onClick={openNew}><Icon icon={Plus} />Nuevo fijo o cuota</Button>
      </div>

      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Editar' : 'Nuevo fijo o cuota'}>
        {draft && (
          <div className="space-y-4">
            <Seg
              label="Tipo de regla" disabled={!!draft.id} value={draft.kind}
              onChange={(k) => k === 'fixed'
                ? setDraft({ ...draft, kind: 'fixed' })
                : setDraft({ ...draft, kind: 'installments', type: 'expense', category_id: draft.type === 'expense' ? draft.category_id : null })}
              options={[{ value: 'fixed', label: 'Fijo mensual' }, { value: 'installments', label: 'En cuotas' }]}
            />

            {draft.kind === 'fixed' && (
              <Seg
                label="Gasto o ingreso" value={draft.type}
                onChange={(t) => setDraft({ ...draft, type: t as TxType, category_id: null })}
                options={[{ value: 'expense', label: 'Gasto' }, { value: 'income', label: 'Ingreso' }]}
              />
            )}

            <AmountInput amount={draft.amount} onAmountChange={(v) => setDraft({ ...draft, amount: v })} currency={draft.currency} onCurrencyChange={(c) => setDraft({ ...draft, currency: c })} />

            {draft.kind === 'installments' && (
              <>
                <Seg
                  label="El monto es" value={draft.totalMode ? 'total' : 'cuota'}
                  onChange={(v) => setDraft({ ...draft, totalMode: v === 'total' })}
                  options={[{ value: 'cuota', label: 'Monto por cuota' }, { value: 'total', label: 'Total de la compra' }]}
                />
                <div className={label}>
                  Cantidad de cuotas
                  <input
                    type="text"
                    inputMode="numeric"
                    value={draft.n}
                    onChange={(e) => setDraft({ ...draft, n: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                    aria-label="Cantidad de cuotas"
                    className={`${field} num`}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {QUICK_N.map((q) => (
                      <button key={q} type="button" onClick={() => setDraft({ ...draft, n: String(q) })}
                        className={`num h-11 min-w-11 rounded-control border px-4 text-[15px] font-medium transition-colors duration-150 ease-soft ${n === q ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line-strong text-fg-2 hover:bg-raised'}`}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                {typed > 0 && n >= 2 && (
                  <p className="num rounded-control bg-raised p-3 text-[13px] leading-5 text-fg-2">
                    {n} cuotas de {formatMoney(perInstallment, draft.currency)}
                    {!draft.totalMode && <> · total {formatMoney(Math.round(typed * n * 100) / 100, draft.currency)}</>}
                  </p>
                )}
              </>
            )}

            <div>
              <div className="mb-2 text-[13px] leading-5 text-fg-2">Categoría</div>
              <CategoryPicker categories={categories} type={draft.kind === 'installments' ? 'expense' : draft.type} value={draft.category_id} onChange={(id) => setDraft({ ...draft, category_id: id })} />
            </div>

            <div className="flex gap-3">
              <label className={`${label} flex-1`}>
                Día del mes (1-28)
                <input type="number" inputMode="numeric" min={1} max={28} value={draft.day} onChange={(e) => setDraft({ ...draft, day: e.target.value })} className={`${field} num`} />
              </label>
              <label className={`${label} flex-1`}>
                Mes de inicio
                <input type="month" value={draft.start_month} onChange={(e) => setDraft({ ...draft, start_month: e.target.value })} className={field} />
              </label>
            </div>

            <label className={label}>
              Nota
              <input type="text" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Ej: Alquiler, Heladera" className={field} />
            </label>

            {msg && <p role="alert" className="text-[13px] leading-5 text-neg">{msg}</p>}

            <div className="flex gap-2 pt-1">
              {draft.id && <Button variant="danger" onClick={() => void del()} disabled={busy}>Eliminar</Button>}
              <Button variant="secondary" className="flex-1" onClick={() => setDraft(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => void save()} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
