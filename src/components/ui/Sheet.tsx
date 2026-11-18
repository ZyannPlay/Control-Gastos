import { useEffect, useId, type ReactNode } from 'react'

/** Hoja inferior modal accesible (role=dialog, Escape y fondo cierran). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const id = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-labelledby={id}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-panel border border-line bg-surface p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-float"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
        <h2 id={id} className="mb-4 text-[18px] leading-6 font-medium">{title}</h2>
        {children}
      </div>
    </div>
  )
}
