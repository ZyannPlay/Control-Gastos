import { describe, it, expect } from 'vitest'
import {
  toARS,
  totalsByType,
  spentByCategory,
  monthlyTotals,
  budgetProgress,
  shiftMonth,
  monthLabel,
  cumulativeDaily,
  daysInMonth,
} from './stats'
import type { Transaction } from './types'

function tx(over: Partial<Transaction> = {}): Transaction {
  return {
    id: over.id ?? 't',
    user_id: 'u',
    type: 'expense',
    amount: 100,
    currency: 'ARS',
    fx_rate: 1200,
    category_id: 'c1',
    date: '2026-11-05',
    note: null,
    created_at: '2026-11-05T00:00:00Z',
    ...over,
  }
}

describe('toARS', () => {
  it('devuelve el monto tal cual si es ARS', () => {
    expect(toARS({ amount: 1500, currency: 'ARS', fx_rate: 1200 })).toBe(1500)
  })

  it('multiplica por fx_rate si es USD', () => {
    expect(toARS({ amount: 10, currency: 'USD', fx_rate: 1200 })).toBe(12000)
  })

  it('ignora fx_rate para ARS', () => {
    expect(toARS({ amount: 50, currency: 'ARS', fx_rate: 999 })).toBe(50)
  })
})

describe('totalsByType', () => {
  it('suma ingresos y gastos en ARS y calcula balance', () => {
    const txs = [
      tx({ id: '1', type: 'income', amount: 100000, currency: 'ARS' }),
      tx({ id: '2', type: 'income', amount: 100, currency: 'USD', fx_rate: 1000 }),
      tx({ id: '3', type: 'expense', amount: 30000, currency: 'ARS' }),
      tx({ id: '4', type: 'expense', amount: 5, currency: 'USD', fx_rate: 1000 }),
    ]
    expect(totalsByType(txs)).toEqual({ income: 200000, expense: 35000, balance: 165000 })
  })

  it('devuelve ceros con lista vacía', () => {
    expect(totalsByType([])).toEqual({ income: 0, expense: 0, balance: 0 })
  })
})

describe('spentByCategory', () => {
  it('suma por categoría en ARS, orden descendente', () => {
    const txs = [
      tx({ id: '1', category_id: 'a', amount: 100 }),
      tx({ id: '2', category_id: 'b', amount: 500 }),
      tx({ id: '3', category_id: 'a', amount: 1000 }),
      tx({ id: '4', category_id: 'c', amount: 1, currency: 'USD', fx_rate: 2000 }), // 2000 ARS
    ]
    expect(spentByCategory(txs)).toEqual([
      { category_id: 'a', total: 1100 },
      { category_id: 'c', total: 2000 },
      { category_id: 'b', total: 500 },
    ].sort((x, y) => y.total - x.total))
  })

  it('ignora los ingresos por defecto', () => {
    const txs = [
      tx({ id: '1', type: 'income', category_id: 'sueldo', amount: 999999 }),
      tx({ id: '2', type: 'expense', category_id: 'comida', amount: 300 }),
    ]
    expect(spentByCategory(txs)).toEqual([{ category_id: 'comida', total: 300 }])
  })

  it('con type "income" devuelve solo ingresos', () => {
    const txs = [
      tx({ id: '1', type: 'income', category_id: 'sueldo', amount: 999 }),
      tx({ id: '2', type: 'expense', category_id: 'comida', amount: 300 }),
    ]
    expect(spentByCategory(txs, 'income')).toEqual([{ category_id: 'sueldo', total: 999 }])
  })

  it('agrupa category_id null como su propia clave', () => {
    const txs = [tx({ id: '1', category_id: null, amount: 40 })]
    expect(spentByCategory(txs)).toEqual([{ category_id: null, total: 40 }])
  })
})

describe('monthlyTotals', () => {
  it('agrupa por mes y ordena ascendente', () => {
    const txs = [
      tx({ id: '1', date: '2026-12-01', amount: 10 }),
      tx({ id: '2', date: '2026-10-15', amount: 20 }),
      tx({ id: '3', date: '2026-10-30', type: 'income', amount: 500 }),
      tx({ id: '4', date: '2026-11-02', amount: 5, currency: 'USD', fx_rate: 100 }),
    ]
    expect(monthlyTotals(txs)).toEqual([
      { month: '2026-10', income: 500, expense: 20 },
      { month: '2026-11', income: 0, expense: 500 },
      { month: '2026-12', income: 0, expense: 10 },
    ])
  })

  it('lista vacía devuelve lista vacía', () => {
    expect(monthlyTotals([])).toEqual([])
  })
})

describe('budgetProgress', () => {
  it('79% es ok', () => {
    const r = budgetProgress({ amount: 1000, currency: 'ARS' }, 790, 1200)
    expect(r.pct).toBeCloseTo(79)
    expect(r.status).toBe('ok')
  })

  it('80% es warning', () => {
    const r = budgetProgress({ amount: 1000, currency: 'ARS' }, 800, 1200)
    expect(r.pct).toBeCloseTo(80)
    expect(r.status).toBe('warning')
  })

  it('99% es warning', () => {
    expect(budgetProgress({ amount: 1000, currency: 'ARS' }, 990, 1200).status).toBe('warning')
  })

  it('100% es over', () => {
    const r = budgetProgress({ amount: 1000, currency: 'ARS' }, 1000, 1200)
    expect(r.pct).toBeCloseTo(100)
    expect(r.status).toBe('over')
  })

  it('más de 100% es over y pct supera 100', () => {
    const r = budgetProgress({ amount: 1000, currency: 'ARS' }, 1500, 1200)
    expect(r.status).toBe('over')
    expect(r.pct).toBeCloseTo(150)
  })

  it('presupuesto en USD se convierte a ARS con la cotización', () => {
    // 100 USD * 1200 = 120000 ARS de límite
    const r = budgetProgress({ amount: 100, currency: 'USD' }, 60000, 1200)
    expect(r.limit).toBe(120000)
    expect(r.spent).toBe(60000)
    expect(r.pct).toBeCloseTo(50)
    expect(r.status).toBe('ok')
  })

  it('presupuesto en USD cambia de estado según la cotización', () => {
    // 60000 gastados contra 100 USD: a 1000 es 60% ok... a 500 es 120% over
    expect(budgetProgress({ amount: 100, currency: 'USD' }, 60000, 500).status).toBe('over')
  })

  it('presupuesto 0 con gasto > 0 es over', () => {
    const r = budgetProgress({ amount: 0, currency: 'ARS' }, 100, 1200)
    expect(r.pct).toBe(100)
    expect(r.status).toBe('over')
  })

  it('presupuesto 0 sin gasto es ok con 0%', () => {
    const r = budgetProgress({ amount: 0, currency: 'ARS' }, 0, 1200)
    expect(r.pct).toBe(0)
    expect(r.status).toBe('ok')
  })
})

describe('shiftMonth', () => {
  it('cruza el año hacia atrás', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
  })

  it('cruza el año hacia adelante', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })

  it('mueve dentro del año', () => {
    expect(shiftMonth('2026-06', 3)).toBe('2026-09')
    expect(shiftMonth('2026-06', -5)).toBe('2026-01')
  })

  it('n = 0 no cambia el mes', () => {
    expect(shiftMonth('2026-07', 0)).toBe('2026-07')
  })

  it('saltos de más de un año', () => {
    expect(shiftMonth('2026-03', 14)).toBe('2027-05')
    expect(shiftMonth('2026-03', -15)).toBe('2024-12')
  })
})

describe('monthLabel', () => {
  it('devuelve el nombre del mes en español y el año', () => {
    expect(monthLabel('2026-11')).toBe('noviembre 2026')
    expect(monthLabel('2026-01')).toBe('enero 2026')
    expect(monthLabel('2026-09')).toBe('septiembre 2026')
    expect(monthLabel('2026-12')).toBe('diciembre 2026')
  })
})

describe('daysInMonth', () => {
  it('maneja febrero bisiesto y no bisiesto', () => {
    expect(daysInMonth('2024-02')).toBe(29)
    expect(daysInMonth('2026-02')).toBe(28)
  })

  it('meses de 30 y 31 días', () => {
    expect(daysInMonth('2026-04')).toBe(30)
    expect(daysInMonth('2026-12')).toBe(31)
  })
})

describe('cumulativeDaily', () => {
  it('acumula gasto por día y devuelve un punto por día del mes', () => {
    const txs = [
      tx({ id: '1', date: '2026-11-01', amount: 100 }),
      tx({ id: '2', date: '2026-11-03', amount: 50 }),
      tx({ id: '3', date: '2026-11-03', amount: 1, currency: 'USD', fx_rate: 1000 }), // 1000
    ]
    const r = cumulativeDaily(txs, '2026-11')
    expect(r).toHaveLength(30)
    expect(r[0]).toEqual({ day: 1, total: 100 })
    expect(r[1]).toEqual({ day: 2, total: 100 })
    expect(r[2]).toEqual({ day: 3, total: 1150 })
    expect(r[29]).toEqual({ day: 30, total: 1150 })
  })

  it('ignora ingresos y otros meses', () => {
    const txs = [
      tx({ id: '1', type: 'income', date: '2026-11-01', amount: 999 }),
      tx({ id: '2', date: '2026-10-31', amount: 999 }),
      tx({ id: '3', date: '2026-11-02', amount: 7 }),
    ]
    const r = cumulativeDaily(txs, '2026-11')
    expect(r[0].total).toBe(0)
    expect(r[1].total).toBe(7)
    expect(r[29].total).toBe(7)
  })

  it('respeta upToDay', () => {
    const txs = [tx({ id: '1', date: '2026-11-02', amount: 10 })]
    const r = cumulativeDaily(txs, '2026-11', 5)
    expect(r).toHaveLength(5)
    expect(r.at(-1)).toEqual({ day: 5, total: 10 })
  })
})
