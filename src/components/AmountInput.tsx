import type { Currency } from '../lib/types'
import { Segmented } from './ui'

interface Props {
  amount: string
  onAmountChange: (v: string) => void
  currency: Currency
  onCurrencyChange: (c: Currency) => void
  autoFocus?: boolean
}

export default function AmountInput({ amount, onAmountChange, currency, onCurrencyChange, autoFocus }: Props) {
  const handle = (v: string) => {
    // solo dígitos y un separador decimal (coma o punto)
    let s = v.replace(/[^0-9.,]/g, '')
    const idx = s.search(/[.,]/)
    if (idx >= 0) s = s.slice(0, idx + 1) + s.slice(idx + 1).replace(/[.,]/g, '')
    onAmountChange(s)
  }
  return (
    <div className="flex items-center gap-3">
      <span className="num text-[40px] leading-[48px] font-medium text-fg-3">{currency === 'ARS' ? '$' : 'US$'}</span>
      <input
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        placeholder="0"
        value={amount}
        onChange={(e) => handle(e.target.value)}
        aria-label="Monto"
        className="num h-12 min-w-0 flex-1 bg-transparent text-[40px] leading-[48px] font-medium tracking-[-0.02em] text-fg outline-none placeholder:text-fg-3"
      />
      <Segmented
        label="Moneda"
        className="w-[120px] shrink-0"
        value={currency}
        onChange={onCurrencyChange}
        options={[{ value: 'ARS', label: 'ARS' }, { value: 'USD', label: 'USD' }]}
      />
    </div>
  )
}
