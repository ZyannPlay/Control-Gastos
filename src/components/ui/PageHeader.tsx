import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Icon } from './Icon'

/** Encabezado de página: título 28px peso 500; botón volver opcional; acción a la derecha. */
export function PageHeader({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: boolean | string; action?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="flex min-h-16 items-center gap-2 px-4 pt-4 pb-2">
      {back && (
        <button type="button" aria-label="Volver" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}
          className="-ml-2 grid h-11 w-11 place-items-center rounded-control text-fg-2 transition-colors hover:bg-raised">
          <Icon icon={ChevronLeft} size={20} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {subtitle && <p className="text-[13px] leading-5 text-fg-3">{subtitle}</p>}
        <h1 className="truncate text-[28px] leading-8 font-medium tracking-[-0.01em]">{title}</h1>
      </div>
      {action}
    </header>
  )
}
