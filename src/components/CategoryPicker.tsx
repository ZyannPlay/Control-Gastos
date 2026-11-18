import type { Category, TxType } from '../lib/types'
import { CategoryIcon } from './ui'

interface Props {
  categories: Category[]
  type: TxType
  value: string | null
  onChange: (id: string) => void
}

export default function CategoryPicker({ categories, type, value, onChange }: Props) {
  const list = categories.filter((c) => c.type === type)
  if (list.length === 0) return <p className="text-[13px] text-fg-3">No hay categorías para este tipo</p>
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
            className={`flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-control px-1 py-2 text-center transition-colors duration-150 ease-soft ${
              sel ? 'bg-accent-soft ring-2 ring-accent' : 'bg-raised hover:bg-line'
            }`}
          >
            <CategoryIcon category={c} size={28} />
            <span className="w-full truncate text-[13px] leading-4 text-fg">{c.name}</span>
          </button>
        )
      })}
    </div>
  )
}
