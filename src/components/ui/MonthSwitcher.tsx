import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthLabel, shiftMonth } from '../../lib/stats'
import { Icon } from './Icon'
import { sentence } from '../../lib/format'

/** Selector de mes compacto: ‹ Noviembre 2026 › */
export function MonthSwitcher({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const btn = 'grid h-9 w-9 place-items-center rounded-control text-fg-2 transition-colors hover:bg-raised'
  return (
    <div className="flex items-center justify-between rounded-control border border-line bg-surface px-1 py-1">
      <button type="button" aria-label="Mes anterior" className={btn} onClick={() => onChange(shiftMonth(month, -1))}><Icon icon={ChevronLeft} /></button>
      <span className="text-[15px] font-medium">{sentence(monthLabel(month))}</span>
      <button type="button" aria-label="Mes siguiente" className={btn} onClick={() => onChange(shiftMonth(month, 1))}><Icon icon={ChevronRight} /></button>
    </div>
  )
}
