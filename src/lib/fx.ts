// Cotización dólar blue desde dolarapi.com, cacheada por día.
const KEY = 'fx_blue_v1'
const FALLBACK = 1200

export interface FxRate { compra: number; venta: number; fecha: string }

export async function getBlueRate(): Promise<FxRate> {
  const d = new Date()
  const today = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  try {
    const cached = JSON.parse(localStorage.getItem(KEY) ?? 'null') as (FxRate & { day: string }) | null
    if (cached && cached.day === today) return cached
  } catch { /* sin storage */ }
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue')
    if (!res.ok) throw new Error(String(res.status))
    const j = await res.json()
    const compra = Number(j?.compra), venta = Number(j?.venta)
    if (!(venta > 0) || !(compra > 0)) throw new Error('cotización inválida')
    const rate: FxRate = { compra, venta, fecha: String(j.fechaActualizacion ?? '') }
    try { localStorage.setItem(KEY, JSON.stringify({ ...rate, day: today })) } catch { /* */ }
    return rate
  } catch {
    try {
      const old = JSON.parse(localStorage.getItem(KEY) ?? 'null') as FxRate | null
      if (old) return old
    } catch { /* */ }
    return { compra: FALLBACK, venta: FALLBACK, fecha: '' }
  }
}

/** Convierte un monto a la moneda destino usando la cotización dada. */
export function convert(amount: number, from: 'ARS' | 'USD', to: 'ARS' | 'USD', rate: number): number {
  if (from === to) return amount
  return from === 'USD' ? amount * rate : amount / rate
}

export function formatMoney(amount: number, currency: 'ARS' | 'USD'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency, maximumFractionDigits: currency === 'ARS' ? 0 : 2,
  }).format(amount)
}
