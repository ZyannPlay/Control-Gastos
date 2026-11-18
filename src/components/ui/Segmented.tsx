/** Control segmentado (Gasto/Ingreso, ARS/USD, Todos/Gastos/Ingresos). La opción activa es una superficie, no un color. */
export function Segmented<T extends string>({ options, value, onChange, label, className = '' }:
  { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  return (
    <div role="group" aria-label={label} className={`flex rounded-control bg-raised p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-9 flex-1 rounded-[6px] px-3 text-[14px] font-medium transition-colors duration-150 ease-soft ${
            value === o.value ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-fg-3 hover:text-fg-2'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
