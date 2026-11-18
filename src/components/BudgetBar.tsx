import { formatMoney } from '../lib/fx'
import type { BudgetStatus } from '../lib/stats'

interface Props {
  icon: string
  name: string
  spent: number
  limit: number
  pct: number
  status: BudgetStatus
  onClick?: () => void
}

const BAR: Record<BudgetStatus, string> = {
  ok: 'bg-emerald-500',
  warning: 'bg-amber-500',
  over: 'bg-red-500',
}
const TXT: Record<BudgetStatus, string> = {
  ok: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  over: 'text-red-600 dark:text-red-400',
}

export default function BudgetBar({ icon, name, spent, limit, pct, status, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block min-h-11 w-full rounded-2xl bg-white p-3 text-left shadow-sm dark:bg-slate-800"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium text-slate-800 dark:text-slate-100">
          <span className="mr-1.5">{icon}</span>
          {name}
        </span>
        <span className={`text-sm font-semibold ${TXT[status]}`}>{Math.round(pct)}%</span>
      </div>
      <div
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-full rounded-full ${BAR[status]}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
        {formatMoney(spent, 'ARS')} de {formatMoney(limit, 'ARS')}
      </div>
      {status === 'warning' && (
        <div className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          Ojo: ya usaste más del 80% del presupuesto
        </div>
      )}
      {status === 'over' && (
        <div className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
          Te pasaste por {formatMoney(spent - limit, 'ARS')}
        </div>
      )}
    </button>
  )
}
