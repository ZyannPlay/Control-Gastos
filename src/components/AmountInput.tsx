import type { Currency } from '../lib/types'

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
      <span className="text-3xl font-semibold text-slate-400">{currency === 'ARS' ? '$' : 'US$'}</span>
      <input
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        placeholder="0"
        value={amount}
        onChange={(e) => handle(e.target.value)}
        aria-label="Monto"
        className="min-w-0 flex-1 bg-transparent text-5xl font-bold outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
      />
      <div className="flex shrink-0 rounded-full bg-slate-200 p-1 dark:bg-slate-800" role="group" aria-label="Moneda">
        {(['ARS', 'USD'] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onCurrencyChange(c)}
            className={`min-h-[44px] min-w-[52px] rounded-full px-3 text-sm font-semibold ${
              currency === c ? 'bg-white text-emerald-700 shadow dark:bg-slate-600 dark:text-white' : 'text-slate-500'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}
