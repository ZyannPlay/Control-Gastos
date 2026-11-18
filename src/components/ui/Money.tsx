import type { Currency } from '../../lib/types'
import { formatMoney } from '../../lib/fx'

type Kind = 'expense' | 'income' | 'neutral'

/**
 * Monto con cifras tabulares. Gastos: "−" y color de texto normal. Ingresos: "+" en verde (único uso del verde).
 * className controla el tamaño (p. ej. "text-[15px] font-medium" o "text-[32px] font-medium").
 */
export function Money({ amount, currency, kind = 'neutral', className = '' }: { amount: number; currency: Currency; kind?: Kind; className?: string }) {
  const sign = kind === 'expense' ? '−' : kind === 'income' ? '+' : amount < 0 ? '−' : ''
  const color = kind === 'income' ? 'text-pos' : 'text-fg'
  return <span className={`num whitespace-nowrap ${color} ${className}`}>{sign}{formatMoney(Math.abs(amount), currency)}</span>
}

/** FIRMA de la app: el equivalente en la otra moneda, en mono gris. Ej: "≈ US$ 45,00". */
export function Equiv({ amount, currency, className = '' }: { amount: number; currency: Currency; className?: string }) {
  return <span className={`num whitespace-nowrap font-mono text-[12px] leading-4 text-fg-3 ${className}`}>≈ {formatMoney(Math.abs(amount), currency)}</span>
}
