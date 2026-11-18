import type { HTMLAttributes, ReactNode } from 'react'

/** Superficie elevada con hairline. padding por defecto 20px. */
export function Card({ children, className = '', pad = true, ...rest }: { children: ReactNode; className?: string; pad?: boolean } & HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-card border border-line bg-surface shadow-sm ${pad ? 'p-5' : ''} ${className}`} {...rest}>{children}</div>
}

/** Título de sección: 13px, peso 500, color secundario, sentence case. */
export function SectionTitle({ children, action, className = '' }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={`mb-2 flex items-center justify-between px-1 ${className}`}>
      <h2 className="text-[13px] leading-5 font-medium text-fg-2">{children}</h2>
      {action}
    </div>
  )
}
