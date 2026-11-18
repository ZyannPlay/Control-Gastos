import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Repeat, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, SectionTitle } from '../components/ui/Card'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { Icon } from '../components/ui/Icon'
import { PageHeader } from '../components/ui/PageHeader'
import { Segmented } from '../components/ui/Segmented'
import { Sheet } from '../components/ui/Sheet'
import { useAuth } from '../hooks/useAuth'
import { useCategories } from '../hooks/useCategories'
import { useFxRate } from '../hooks/useFxRate'
import { formatMoney } from '../lib/fx'
import { deleteMyAccount } from '../lib/account'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../lib/categoryIcons'
import type { TxType } from '../lib/types'

const row = 'flex min-h-13 items-center justify-between gap-3 px-5'
const input = 'h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-[15px] text-fg placeholder:text-fg-3'

export default function Ajustes() {
  const { user, signOut } = useAuth()
  const { rate } = useFxRate()
  const { categories, add, remove, error } = useCategories()
  const [type, setType] = useState<TxType>('expense')
  const [icon, setIcon] = useState('tag')
  const [name, setName] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[4])
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [delText, setDelText] = useState('')
  const [delBusy, setDelBusy] = useState(false)
  const [delErr, setDelErr] = useState<string | null>(null)

  async function onDeleteAccount() {
    if (delBusy || delText.trim() !== 'ELIMINAR') return
    setDelBusy(true)
    setDelErr(null)
    const err = await deleteMyAccount()
    setDelBusy(false)
    if (err) setDelErr(err)
  }

  async function onAdd() {
    if (busy) return
    if (!name.trim()) return setMsg('Poné un nombre')
    setBusy(true)
    const err = await add({ name: name.trim(), icon, color, type })
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

  return (
    <div>
      <PageHeader title="Ajustes" />
      <div className="space-y-6 px-4 pb-6">
        <section>
          <SectionTitle>Cuenta</SectionTitle>
          <Card pad={false}>
            <div className={row}>
              <span className="text-[15px] text-fg-2">Correo</span>
              <span className="min-w-0 truncate text-[15px]">{user?.email}</span>
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle>Dólar blue</SectionTitle>
          <Card pad={false} className="divide-y divide-line">
            {rate ? (
              <>
                <div className={row}>
                  <span className="text-[15px] text-fg-2">Compra</span>
                  <span className="num font-mono text-[15px]">{formatMoney(rate.compra, 'ARS')}</span>
                </div>
                <div className={row}>
                  <span className="text-[15px] text-fg-2">Venta</span>
                  <span className="num font-mono text-[15px]">{formatMoney(rate.venta, 'ARS')}</span>
                </div>
                {rate.fecha && (
                  <div className="flex min-h-10 items-center px-5 font-mono text-[12px] text-fg-3">
                    Actualizado: {new Date(rate.fecha).toLocaleString('es-AR')}
                  </div>
                )}
              </>
            ) : (
              <div className={`${row} text-[13px] text-fg-3`}>Cargando…</div>
            )}
          </Card>
        </section>

        <Card pad={false}>
          <Link to="/fijos" className={`${row} rounded-card transition-colors hover:bg-raised`}>
            <span className="flex items-center gap-3 text-[15px]"><Icon icon={Repeat} className="text-fg-2" />Fijos y cuotas</span>
            <Icon icon={ChevronRight} className="text-fg-3" />
          </Link>
        </Card>

        <section>
          <SectionTitle>Categorías</SectionTitle>
          <Card pad={false}>
            <div className="border-b border-line p-3">
              <Segmented
                label="Tipo de categoría" value={type} onChange={setType}
                options={[{ value: 'expense', label: 'Gastos' }, { value: 'income', label: 'Ingresos' }]}
              />
            </div>
            <ul className="divide-y divide-line">
              {shown.map((c) => (
                <li key={c.id} className="flex min-h-13 items-center gap-3 pr-2 pl-5">
                  <CategoryIcon category={c} size={32} />
                  <span className="min-w-0 flex-1 truncate text-[15px]">{c.name}</span>
                  <button
                    aria-label={`Eliminar ${c.name}`}
                    onClick={() => onRemove(c.id, c.name)}
                    className="grid h-11 w-11 place-items-center rounded-control text-fg-3 transition-colors hover:bg-raised hover:text-fg"
                  >
                    <Icon icon={Trash2} />
                  </button>
                </li>
              ))}
              {shown.length === 0 && <li className="flex min-h-13 items-center px-5 text-[13px] text-fg-3">Sin categorías</li>}
            </ul>
          </Card>
        </section>

        <section>
          <SectionTitle>Nueva categoría de {type === 'expense' ? 'gasto' : 'ingreso'}</SectionTitle>
          <Card className="space-y-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" aria-label="Nombre" className={input} />
            <div role="group" aria-label="Ícono" className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_ICONS).map(([key, I]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={`Ícono ${key}`}
                  aria-pressed={icon === key}
                  onClick={() => setIcon(key)}
                  className={`grid h-9 w-9 place-items-center rounded-control transition-colors duration-150 ease-soft ${
                    icon === key ? 'bg-raised text-fg ring-2 ring-accent' : 'text-fg-2 hover:bg-raised'
                  }`}
                >
                  <Icon icon={I} />
                </button>
              ))}
            </div>
            <div role="group" aria-label="Color" className="flex flex-wrap">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className="grid h-11 w-11 place-items-center"
                >
                  <span
                    className={`h-7 w-7 rounded-full ${color === c ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                </button>
              ))}
            </div>
            <Button block onClick={onAdd} disabled={busy}>{busy ? 'Agregando…' : 'Agregar categoría'}</Button>
            {(msg || error) && <p className="text-[13px] leading-5 text-neg">{msg ?? error}</p>}
          </Card>
        </section>

        <Button block variant="secondary" onClick={() => void signOut()}>Cerrar sesión</Button>

        <section>
          <SectionTitle>Datos y privacidad</SectionTitle>
          <Card pad={false} className="divide-y divide-line">
            <Link to="/privacidad" className={`${row} rounded-t-card transition-colors hover:bg-raised`}>
              <span className="text-[15px]">Política de privacidad</span>
              <Icon icon={ChevronRight} className="text-fg-3" />
            </Link>
            <div className="p-3">
              <Button
                block variant="danger"
                onClick={() => { setDelText(''); setDelErr(null); setDelOpen(true) }}
              >
                Eliminar mi cuenta
              </Button>
            </div>
          </Card>
          <div className="pt-4 text-center font-mono text-[12px] leading-4 text-fg-3">Versión 1.1.1</div>
        </section>
      </div>

      <Sheet open={delOpen} onClose={() => setDelOpen(false)} title="Eliminar mi cuenta">
        <div className="space-y-4">
          <p className="text-[15px] leading-6 text-fg-2">
            Se borran todos tus datos (gastos, categorías, presupuestos y fijos). Esta acción es irreversible.
          </p>
          <label className="block text-[13px] leading-5 text-fg-2">
            Para confirmar, escribí <span className="font-mono text-fg">ELIMINAR</span>
            <input
              value={delText}
              onChange={(e) => setDelText(e.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              className={`${input} mt-1`}
            />
          </label>
          {delErr && <p className="text-[13px] leading-5 text-neg" role="alert">{delErr}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDelOpen(false)} disabled={delBusy}>Cancelar</Button>
            <button
              onClick={() => void onDeleteAccount()}
              disabled={delBusy || delText.trim() !== 'ELIMINAR'}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-control bg-neg px-4 text-[15px] font-medium text-white transition-[opacity,transform] duration-150 ease-soft active:scale-[0.98] disabled:opacity-40"
            >
              {delBusy ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
