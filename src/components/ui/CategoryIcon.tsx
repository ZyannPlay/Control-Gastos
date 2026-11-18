import type { Category } from '../../lib/types'
import { categoryIcon } from '../../lib/categoryIcons'
import { Icon } from './Icon'

/** Caja fija de 36px con el ícono en gris y el color de la categoría como punto chico. */
export function CategoryIcon({ category, size = 36 }: { category?: Pick<Category, 'icon' | 'color'> | null; size?: number }) {
  return (
    <span className="relative grid shrink-0 place-items-center rounded-control bg-raised text-fg-2" style={{ width: size, height: size }}>
      <Icon icon={categoryIcon(category?.icon)} size={18} />
      {category?.color && (
        <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface" style={{ background: category.color }} />
      )}
    </span>
  )
}
