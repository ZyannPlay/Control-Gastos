import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { convert, formatMoney, getBlueRate } from './fx'

const KEY = 'fx_blue_v1'

describe('convert', () => {
  const RATE = 1200

  it('misma moneda devuelve el monto sin cambios', () => {
    expect(convert(500, 'ARS', 'ARS', RATE)).toBe(500)
    expect(convert(7, 'USD', 'USD', RATE)).toBe(7)
  })

  it('USD a ARS multiplica por la cotización', () => {
    expect(convert(10, 'USD', 'ARS', RATE)).toBe(12000)
  })

  it('ARS a USD divide por la cotización', () => {
    expect(convert(12000, 'ARS', 'USD', RATE)).toBe(10)
  })

  it('ida y vuelta conserva el monto', () => {
    const back = convert(convert(33.5, 'USD', 'ARS', 1234), 'ARS', 'USD', 1234)
    expect(back).toBeCloseTo(33.5, 10)
  })
})

describe('formatMoney', () => {
  // Normalizamos espacios no separables (Intl usa U+00A0) para comparar.
  const norm = (s: string) => s.replace(/\s/g, ' ')

  it('ARS sin decimales con separador de miles es-AR', () => {
    const s = norm(formatMoney(1234567.8, 'ARS'))
    expect(s).toContain('1.234.568')
    expect(s).not.toMatch(/,\d{2}/)
    expect(s).toContain('$')
  })

  it('USD con dos decimales y coma decimal', () => {
    const s = norm(formatMoney(1234.5, 'USD'))
    expect(s).toContain('1.234,50')
  })

  it('montos negativos llevan signo', () => {
    expect(norm(formatMoney(-1500, 'ARS'))).toContain('1.500')
    expect(norm(formatMoney(-1500, 'ARS'))).toMatch(/-|−/)
  })
})

describe('getBlueRate', () => {
  let store: Record<string, string>

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = String(v) },
      removeItem: (k: string) => { delete store[k] },
      clear: () => { store = {} },
    })
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-18T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const okResponse = (compra: number, venta: number) => ({
    ok: true,
    status: 200,
    json: async () => ({ compra, venta, fechaActualizacion: '2026-11-18T11:00:00.000Z' }),
  })

  it('pide la cotización a dolarapi y la guarda en caché del día', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(1400, 1430))
    vi.stubGlobal('fetch', fetchMock)

    const r = await getBlueRate()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('dolarapi.com')
    expect(r).toEqual({ compra: 1400, venta: 1430, fecha: '2026-11-18T11:00:00.000Z' })
    expect(JSON.parse(store[KEY]).day).toBe('2026-11-18')
  })

  it('usa la caché si es del mismo día y no llama a fetch', async () => {
    store[KEY] = JSON.stringify({ compra: 1000, venta: 1020, fecha: 'x', day: '2026-11-18' })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const r = await getBlueRate()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(r.venta).toBe(1020)
  })

  it('si la caché es de otro día, vuelve a pedir', async () => {
    store[KEY] = JSON.stringify({ compra: 1000, venta: 1020, fecha: 'x', day: '2026-11-17' })
    const fetchMock = vi.fn().mockResolvedValue(okResponse(1500, 1520))
    vi.stubGlobal('fetch', fetchMock)

    const r = await getBlueRate()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(r.venta).toBe(1520)
  })

  it('si falla la red y hay caché vieja, devuelve la caché vieja', async () => {
    store[KEY] = JSON.stringify({ compra: 900, venta: 950, fecha: 'viejo', day: '2026-11-10' })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    const r = await getBlueRate()
    expect(r.venta).toBe(950)
    expect(r.fecha).toBe('viejo')
  })

  it('si falla la red y no hay caché, usa el fallback 1200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    const r = await getBlueRate()
    expect(r).toEqual({ compra: 1200, venta: 1200, fecha: '' })
  })

  it('si la respuesta HTTP no es ok, usa el fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }))

    const r = await getBlueRate()
    expect(r.venta).toBe(1200)
  })
})
