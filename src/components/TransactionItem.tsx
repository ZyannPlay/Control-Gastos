import { Link } from 'react-router-dom'
import type { Category, Transaction } from '../lib/types'
import { convert } from '../lib/fx'
import { CategoryIcon, Equiv, Money } from './ui'

export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const fmtShort = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })
const fmtMeta = (s: string) => fmtShort.format(parseLocalDate(s)).replace('.', '')

export default function TransactionItem({ tx, category }: { tx: Transaction; category?: Category | null }) {
  const other = tx.currency === 'ARS' ? 'USD' : 'ARS'
  const eq = convert(tx.amount, tx.currency, other, tx.fx_rate)
  const isExp = tx.type === 'expense'
  const noteHasCuota = /\(cuota\s*\d+\s*\/\s*\d+\)/i.test(tx.note ?? '')
  const badge = tx.installment_number
    ? (noteHasCuota ? 'Cuota' : `Cuota ${tx.installment_number}`)
    : tx.recurring_id ? 'Fijo' : null
  return (
    <Link
      to={`/editar/${tx.id}`}
      className="flex h-16 items-center gap-3 px-4 transition-colors hover:bg-raised active:bg-raised"
    >
      <CategoryIcon category={category} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[15px] leading-5">
          <span className="truncate">{tx.note || category?.name || 'Sin categoría'}</span>
          {badge && (
            <span className="shrink-0 rounded-tag bg-raised px-1.5 py-0.5 font-mono text-[11px] leading-4 text-fg-3">{badge}</span>
          )}
        </span>
        <span className="block truncate text-[13px] leading-5 text-fg-3">
          {tx.note && category ? `${category.name} · ` : ''}{fmtMeta(tx.date)}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <Money amount={tx.amount} currency={tx.currency} kind={isExp ? 'expense' : 'income'} className="text-[15px] leading-5 font-medium" />
        <Equiv amount={eq} currency={other} />
      </span>
    </Link>
  )
}
