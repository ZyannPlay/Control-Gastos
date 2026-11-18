import { NavLink } from 'react-router-dom'
import { BarChart3, House, List, Plus, Target } from 'lucide-react'
import { Icon } from './ui'

const items = [
  { to: '/', label: 'Inicio', end: true, icon: House },
  { to: '/movimientos', label: 'Movimientos', icon: List },
  { to: '/presupuestos', label: 'Presupuestos', icon: Target },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
]

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] leading-4 font-medium transition-colors ${
    isActive ? 'text-fg' : 'text-fg-3 hover:text-fg-2'
  }`

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-center px-2">
        {items.slice(0, 2).map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end} className={linkCls}>
            {({ isActive }) => (<><span className={isActive ? 'text-accent-ink' : ''}><Icon icon={i.icon} size={20} /></span><span>{i.label}</span></>)}
          </NavLink>
        ))}
        <div className="flex flex-1 justify-center">
          <NavLink
            to="/nuevo"
            aria-label="Agregar movimiento"
            className="grid h-12 w-12 place-items-center rounded-control bg-accent text-on-accent transition-[opacity,transform] duration-150 ease-soft hover:opacity-90 active:scale-[0.97]"
          >
            <Icon icon={Plus} size={24} />
          </NavLink>
        </div>
        {items.slice(2).map((i) => (
          <NavLink key={i.to} to={i.to} className={linkCls}>
            {({ isActive }) => (<><span className={isActive ? 'text-accent-ink' : ''}><Icon icon={i.icon} size={20} /></span><span>{i.label}</span></>)}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
