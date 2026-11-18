import type { LucideIcon, LucideProps } from 'lucide-react'

/** Ícono de línea: un solo set (lucide), stroke 1.5, toma el color del texto. */
export function Icon({ icon: I, size = 18, ...rest }: { icon: LucideIcon; size?: number } & Omit<LucideProps, 'ref'>) {
  return <I size={size} strokeWidth={1.5} aria-hidden="true" {...rest} />
}
