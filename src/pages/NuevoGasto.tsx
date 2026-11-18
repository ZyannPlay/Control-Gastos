import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTransactions } from '../hooks/useTransactions'
import { toSpanishError } from '../hooks/errors'
import { useCategories } from '../hooks/useCategories'
import { useFxRate } from '../hooks/useFxRate'
import AmountInput from '../components/AmountInput'
import CategoryPicker from '../components/CategoryPicker'
import type { Currency, TxType } from '../lib/types'
import { ChevronLeft } from 'lucide-react'
import { Button, Icon, Segmented } from '../components/ui'

const CUR_KEY = 'last_currency'
const field = 'mt-1 h-12 w-full rounded-control border border-line-strong bg-surface px-4 text-[15px] font-normal text-fg outline-none transition-colors placeholder:text-fg-3 focus:border-accent'

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

  if (loading) return <div className="p-4 text-[13px] text-fg-3">Cargando…</div>
  if (loadFailed) return (
    <div className="space-y-4 p-4">
      <p role="alert" className="rounded-control border border-line bg-surface px-3 py-2 text-[13px] text-neg">{error}</p>
      <Button type="button" variant="secondary" block onClick={done}>Volver</Button>
    </div>
  )

  return (
    <div className="px-4 pt-4 pb-4">
      <header className="mb-4 flex items-center gap-2">
        <button type="button" onClick={done} aria-label="Volver" className="-ml-2 grid h-11 w-11 place-items-center rounded-control text-fg-2 transition-colors hover:bg-raised"><Icon icon={ChevronLeft} size={20} /></button>
        <h1 className="text-[28px] leading-8 font-medium tracking-[-0.01em]">{editing ? 'Editar movimiento' : 'Nuevo movimiento'}</h1>
      </header>

      <Segmented
        label="Tipo"
        className="mb-6"
        value={type}
        onChange={changeType}
        options={[{ value: 'expense', label: 'Gasto' }, { value: 'income', label: 'Ingreso' }]}
      />

      <AmountInput amount={amount} onAmountChange={setAmount} currency={currency} onCurrencyChange={changeCurrency} autoFocus={!editing} />

      <h2 className="mb-2 mt-6 text-[13px] leading-5 font-medium text-fg-2">Categoría</h2>
      <CategoryPicker categories={categories} type={type} value={categoryId} onChange={setCategoryId} />

      <div className="mt-6 grid grid-cols-1 gap-4">
        <label className="block text-[13px] leading-5 font-medium text-fg-2">
          Fecha
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || today())} className={field} />
        </label>
        <label className="block text-[13px] leading-5 font-medium text-fg-2">
          Nota (opcional)
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: almuerzo con Juan" className={field} />
        </label>
      </div>

      {error && <p role="alert" className="mt-4 rounded-control border border-line bg-surface px-3 py-2 text-[13px] text-neg">{error}</p>}

      <Button type="button" block onClick={save} disabled={saving} className="mt-6 h-12">
        {saving ? 'Guardando…' : 'Guardar'}
      </Button>
      {editing && (
        <Button type="button" variant="danger" block onClick={del} disabled={saving} className="mt-3 h-12">
          Eliminar
        </Button>
      )}
    </div>
  )
}
