import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCategories } from '../hooks/useCategories'
import { useFxRate } from '../hooks/useFxRate'
import { formatMoney } from '../lib/fx'
import type { TxType } from '../lib/types'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899']

export default function Ajustes() {
  const { user, signOut } = useAuth()
  const { rate } = useFxRate()
  const { categories, add, remove, error } = useCategories()
  const [type, setType] = useState<TxType>('expense')
  const [icon, setIcon] = useState('🏷️')
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[4])
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onAdd() {
    if (busy) return
    if (!name.trim()) return setMsg('Poné un nombre')
    const emoji = Array.from(icon.trim()).slice(0, 8).join('')
    if (!emoji) return setMsg('Poné un emoji')
    setBusy(true)
    const err = await add({ name: name.trim(), icon: emoji, color, type })
    setBusy(false)
    if (err) return setMsg(err)
    setMsg(null)
    setName('')
  }
  async function onRemove(id: string, n: string) {
    if (!confirm(`¿Eliminar la categoría "${n}"?`)) return
    const err = await remove(id)
    if (err) setMsg(err)
  }

  const shown = categories.filter((c) => c.type === type)
  const card = 'rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800'
  const input = 'h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Ajustes</h1>

      <section className={card}>
        <div className="text-xs text-slate-500 dark:text-slate-400">Cuenta</div>
        <div className="mt-1 break-all font-medium text-slate-900 dark:text-slate-100">{user?.email}</div>
      </section>

      <section className={card}>
        <div className="text-xs text-slate-500 dark:text-slate-400">Dólar blue</div>
        {rate ? (
          <>
            <div className="mt-1 flex gap-6 text-slate-900 dark:text-slate-100">
              <div>Compra <b>{formatMoney(rate.compra, 'ARS')}</b></div>
              <div>Venta <b>{formatMoney(rate.venta, 'ARS')}</b></div>
            </div>
            {rate.fecha && (
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Actualizado: {new Date(rate.fecha).toLocaleString('es-AR')}
              </div>
            )}
          </>
        ) : (
          <div className="mt-1 text-slate-500">Cargando…</div>
        )}
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Categorías</h2>
        <div className="flex overflow-hidden rounded-xl border border-slate-300 dark:border-slate-600">
          {([['expense', 'Gastos'], ['income', 'Ingresos']] as const).map(([t, l]) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`h-11 flex-1 font-medium ${type === t ? 'bg-teal-700 text-white' : 'text-slate-700 dark:text-slate-200'}`}
            >
              {l}
            </button>
          ))}
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {shown.map((c) => (
            <li key={c.id} className="flex min-h-11 items-center gap-3 py-1">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="flex-1 text-slate-900 dark:text-slate-100">{c.icon} {c.name}</span>
              <button
                aria-label={`Eliminar ${c.name}`}
                onClick={() => onRemove(c.id, c.name)}
                className="h-11 w-11 text-lg text-red-500"
              >
                🗑
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="py-2 text-sm text-slate-500">Sin categorías</li>}
        </ul>

        <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-700">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Nueva categoría de {type === 'expense' ? 'gasto' : 'ingreso'}
          </div>
          <div className="flex gap-2">
            <input value={icon} onChange={(e) => setIcon(e.target.value)} aria-label="Emoji" className={`${input} w-14 text-center text-xl`} />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className={`${input} min-w-0 flex-1`} />
          </div>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
                className={`h-9 w-9 rounded-full ${color === c ? 'ring-2 ring-slate-900 ring-offset-2 dark:ring-white dark:ring-offset-slate-800' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button onClick={onAdd} disabled={busy} className="h-12 w-full rounded-xl bg-teal-700 font-semibold text-white active:bg-teal-800 disabled:opacity-50">
            {busy ? 'Agregando…' : 'Agregar categoría'}
          </button>
          {(msg || error) && <p className="text-sm text-red-600 dark:text-red-400">{msg ?? error}</p>}
        </div>
      </section>

      <button
        onClick={() => void signOut()}
        className="h-12 w-full rounded-xl border border-red-300 font-medium text-red-600 dark:border-red-800 dark:text-red-400"
      >
        Cerrar sesión
      </button>
    </div>
  )
}
