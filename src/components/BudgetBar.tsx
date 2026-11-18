import { formatMoney } from '../lib/fx'
import type { BudgetStatus } from '../lib/stats'
import type { Category } from '../lib/types'
import { CategoryIcon } from './ui/CategoryIcon'

interface Props {
  category?: Pick<Category, 'icon' | 'color'> | null
  name: string
  spent: number
  limit: number
  pct: number
  status: BudgetStatus
  onClick?: () => void
}

const BAR: Record<BudgetStatus, string> = { ok: 'bg-accent', warning: 'bg-warn', over: 'bg-neg' }
const TXT: Record<BudgetStatus, string> = { ok: 'text-fg-2', warning: 'text-warn', over: 'text-neg' }

/** Fila de presupuesto (va dentro de una lista agrupada). */
export default function BudgetBar({ category, name, spent, limit, pct, status, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-raised"
    >
      <CategoryIcon category={category} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[15px] leading-5">{name}</span>
          <span className={`num font-mono text-[13px] leading-5 ${TXT[status]}`}>{Math.round(pct)}%</span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={`h-full rounded-full ${BAR[status]}`} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <div className="num mt-2 font-mono text-[12px] leading-4 text-fg-3">
          {formatMoney(spent, 'ARS')} de {formatMoney(limit, 'ARS')}
        </div>
        {status === 'warning' && <div className="mt-1 text-[13px] leading-5 text-warn">Usaste el {Math.round(pct)}%</div>}
        {status === 'over' && <div className="mt-1 text-[13px] leading-5 text-neg">Te pasaste por {formatMoney(spent - limit, 'ARS')}</div>}
      </div>
    </button>
  )
}
