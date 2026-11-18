import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTransactions } from '../hooks/useTransactions'
import { toSpanishError } from '../hooks/errors'
import { useCategories } from '../hooks/useCategories'
import { useFxRate } from '../hooks/useFxRate'
import AmountInput from '../components/AmountInput'
import CategoryPicker from '../components/CategoryPicker'
import type { Currency, TxType } from '../lib/types'

const CUR_KEY = 'last_currency'

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function lastCurrency(): Currency {
  try { return localStorage.getItem(CUR_KEY) === 'USD' ? 'USD' : 'ARS' } catch { return 'ARS' }
}

export default function NuevoGasto() {
  const { id } = useParams()
  const editing = !!id
  const navigate = useNavigate()
  const { add, update, remove, get } = useTransactions({ skipFetch: true })
  const { categories } = useCategories()
  const { rate } = useFxRate()

  const [type, setType] = useState<TxType>('expense')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>(lastCurrency)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [origFx, setOrigFx] = useState<number | null>(null)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    get(id).then(({ data: t, error: err }) => {
      if (cancelled) return
      if (err) { setError(`No se pudo cargar el movimiento. ${err}`); setLoadFailed(true); setLoading(false); return }
      if (!t) { setError('No se encontró el movimiento.'); setLoadFailed(true); setLoading(false); return }
      setType(t.type); setAmount(String(t.amount).replace('.', ',')); setCurrency(t.currency)
      setCategoryId(t.category_id); setDate(t.date); setNote(t.note ?? ''); setOrigFx(t.fx_rate)
      setLoading(false)
    }).catch((e) => {
      if (cancelled) return
      setError(`No se pudo cargar el movimiento. ${toSpanishError(e)}`)
      setLoadFailed(true)
      setLoading(false)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const changeCurrency = (c: Currency) => {
    setCurrency(c)
    try { localStorage.setItem(CUR_KEY, c) } catch { /* sin storage */ }
  }
  const changeType = (t: TxType) => { setType(t); setCategoryId(null) }

  const done = () => { if (window.history.length > 1) navigate(-1); else navigate('/') }

  const save = async () => {
    const n = parseFloat(amount.replace(',', '.'))
    if (!(n > 0)) { setError('Ingresá un monto mayor a 0.'); return }
    if (!categoryId) { setError('Elegí una categoría.'); return }
    const fx = editing ? origFx ?? rate?.venta : rate?.venta
    if (!fx) { setError('Todavía no tenemos la cotización. Probá de nuevo en un instante.'); return }
    setError(null); setSaving(true)
    const payload = { type, amount: n, currency, fx_rate: fx, category_id: categoryId, date, note: note.trim() || null }
    const err = editing && id ? await update(id, payload) : await add(payload)
    setSaving(false)
    if (err) setError(err)
    else done()
  }

  const del = async () => {
    if (!id || !window.confirm('¿Eliminar este movimiento?')) return
    setSaving(true)
    const err = await remove(id)
    setSaving(false)
    if (err) setError(err)
    else done()
  }

  if (loading) return <div className="p-6 text-slate-500">Cargando…</div>
  if (loadFailed) return (
    <div className="space-y-4 p-6">
      <p role="alert" className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
      <button type="button" onClick={done} className="min-h-[48px] w-full rounded-xl border border-slate-300 font-semibold dark:border-slate-700">Volver</button>
    </div>
  )

  return (
    <div className="px-4 pt-4">
      <header className="mb-4 flex items-center gap-2">
        <button type="button" onClick={done} aria-label="Volver" className="grid h-11 w-11 place-items-center rounded-full text-2xl">‹</button>
        <h1 className="text-xl font-bold">{editing ? 'Editar movimiento' : 'Nuevo movimiento'}</h1>
      </header>

      <div className="mb-4 flex rounded-full bg-slate-200 p-1 dark:bg-slate-800">
        {([['expense', 'Gasto'], ['income', 'Ingreso']] as const).map(([t, l]) => (
          <button
            key={t}
            type="button"
            onClick={() => changeType(t)}
            className={`min-h-[44px] flex-1 rounded-full text-sm font-semibold ${
              type === t ? (t === 'expense' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white') : 'text-slate-500'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <AmountInput amount={amount} onAmountChange={setAmount} currency={currency} onCurrencyChange={changeCurrency} autoFocus={!editing} />

      <h2 className="mb-2 mt-6 text-sm font-semibold text-slate-500">Categoría</h2>
      <CategoryPicker categories={categories} type={type} value={categoryId} onChange={setCategoryId} />

      <div className="mt-6 grid grid-cols-1 gap-3">
        <label className="block text-sm font-semibold text-slate-500">
          Fecha
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || today())} className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-4 font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        </label>
        <label className="block text-sm font-semibold text-slate-500">
          Nota (opcional)
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: almuerzo con Juan" className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-4 font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        </label>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}

      <button type="button" onClick={save} disabled={saving} className="mt-5 min-h-[52px] w-full rounded-xl bg-emerald-600 text-base font-semibold text-white disabled:opacity-60">
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
      {editing && (
        <button type="button" onClick={del} disabled={saving} className="mb-4 mt-3 min-h-[48px] w-full rounded-xl border border-red-300 font-semibold text-red-600 disabled:opacity-60 dark:border-red-900 dark:text-red-400">
          Eliminar
        </button>
      )}
    </div>
  )
}
