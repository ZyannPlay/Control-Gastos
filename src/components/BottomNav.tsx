import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const items = [
  { to: '/', label: 'Inicio', end: true, icon: svg(<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>) },
  { to: '/movimientos', label: 'Movimientos', icon: svg(<><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>) },
  { to: '/presupuestos', label: 'Presupuestos', icon: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 3v9l6.4 6.4" /></>) },
  { to: '/reportes', label: 'Reportes', icon: svg(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>) },
]

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
  }`

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-center">
        {items.slice(0, 2).map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end} className={linkCls}>{i.icon}<span>{i.label}</span></NavLink>
        ))}
        <div className="flex flex-1 justify-center">
          <NavLink
            to="/nuevo"
            aria-label="Agregar movimiento"
            className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 active:scale-95"
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          </NavLink>
        </div>
        {items.slice(2).map((i) => (
          <NavLink key={i.to} to={i.to} className={linkCls}>{i.icon}<span>{i.label}</span></NavLink>
        ))}
      </div>
    </nav>
  )
}
