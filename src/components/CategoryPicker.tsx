import type { Category, TxType } from '../lib/types'

interface Props {
  categories: Category[]
  type: TxType
  value: string | null
  onChange: (id: string) => void
}

export default function CategoryPicker({ categories, type, value, onChange }: Props) {
  const list = categories.filter((c) => c.type === type)
  if (list.length === 0) return <p className="text-sm text-slate-500">No hay categorías para este tipo.</p>
  return (
    <div className="grid grid-cols-3 gap-2">
      {list.map((c) => {
        const sel = value === c.id
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            aria-pressed={sel}
            style={{ backgroundColor: c.color + (sel ? '55' : '22'), borderColor: sel ? c.color : 'transparent' }}
            className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 py-2 text-center"
          >
            <span className="text-2xl leading-none">{c.icon}</span>
            <span className="w-full truncate text-xs font-medium">{c.name}</span>
          </button>
        )
      })}
    </div>
  )
}
