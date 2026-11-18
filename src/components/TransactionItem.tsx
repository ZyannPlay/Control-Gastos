import { Link } from 'react-router-dom'
import type { Category, Transaction } from '../lib/types'
import { convert, formatMoney } from '../lib/fx'

export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const fmtShort = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })

export default function TransactionItem({ tx, category }: { tx: Transaction; category?: Category | null }) {
  const other = tx.currency === 'ARS' ? 'USD' : 'ARS'
  const eq = convert(tx.amount, tx.currency, other, tx.fx_rate)
  const isExp = tx.type === 'expense'
  return (
    <Link
      to={`/editar/${tx.id}`}
      className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-white px-3 py-2 active:bg-slate-100 dark:bg-slate-900 dark:active:bg-slate-800"
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl"
        style={{ backgroundColor: (category?.color ?? '#94a3b8') + '33' }}
      >
        {category?.icon ?? '❓'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{tx.note || category?.name || 'Sin categoría'}</span>
        <span className="block truncate text-xs text-slate-500">
          {tx.note && category ? `${category.name} · ` : ''}{fmtShort.format(parseLocalDate(tx.date))}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className={`block text-sm font-semibold ${isExp ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {isExp ? '-' : '+'}{formatMoney(tx.amount, tx.currency)}
        </span>
        <span className="block text-xs text-slate-500">{formatMoney(eq, other)}</span>
      </span>
    </Link>
  )
}
