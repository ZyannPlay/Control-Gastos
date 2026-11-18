import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:opacity-90',
  secondary: 'border border-line-strong bg-surface text-fg hover:bg-raised',
  ghost: 'text-fg-2 hover:bg-raised hover:text-fg',
  danger: 'border border-line-strong bg-surface text-neg hover:bg-raised',
}

/** Botón: alto 44 (touch), radio de control, transición solo de color + press scale. */
export function Button({ variant = 'primary', block = false, size = 'md', className = '', children, ...rest }:
  { variant?: Variant; block?: boolean; size?: 'md' | 'sm'; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const h = size === 'sm' ? 'h-9 px-3 text-[14px]' : 'h-11 px-4 text-[15px]'
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap transition-[background-color,color,opacity,transform] duration-150 ease-soft active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${h} ${block ? 'w-full' : ''} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
