import { describe, expect, it } from 'vitest'
import { dueOccurrences, installmentProgress, nextOccurrence } from './recurring'
import type { RecurringRule } from './types'

const base: RecurringRule = {
  id: 'r1', user_id: 'u', kind: 'fixed', type: 'expense', amount: 100, currency: 'ARS',
  category_id: null, note: null, day_of_month: 10, start_month: '2026-08',
  installments_total: null, active: true, created_at: '',
}

describe('dueOccurrences', () => {
  it('fijo que empezó hace 3 meses con día ya pasado: 4 ocurrencias', () => {
    const r = dueOccurrences(base, new Date(2026, 10, 15))
    expect(r.map((o) => o.period)).toEqual(['2026-08', '2026-09', '2026-10', '2026-11'])
    expect(r[0].date).toBe('2026-08-10')
    expect(r[0].installment_number).toBeNull()
  })
  it('día aún no alcanzado este mes: 3 ocurrencias', () => {
    expect(dueOccurrences(base, new Date(2026, 10, 9))).toHaveLength(3)
  })
  it('el mismo día cuenta', () => {
    expect(dueOccurrences(base, new Date(2026, 10, 10))).toHaveLength(4)
  })
  it('cuotas que terminan', () => {
    const r: RecurringRule = { ...base, kind: 'installments', installments_total: 3 }
    const o = dueOccurrences(r, new Date(2027, 5, 1))
    expect(o.map((x) => x.installment_number)).toEqual([1, 2, 3])
  })
  it('cruce de año', () => {
    const r: RecurringRule = { ...base, kind: 'installments', installments_total: 4, start_month: '2026-11', day_of_month: 5 }
    const o = dueOccurrences(r, new Date(2027, 1, 20))
    expect(o.map((x) => x.period)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
    expect(o[2].date).toBe('2027-01-05')
  })
  it('regla inactiva', () => {
    expect(dueOccurrences({ ...base, active: false }, new Date(2027, 0, 1))).toEqual([])
    expect(nextOccurrence({ ...base, active: false }, new Date(2027, 0, 1))).toBeNull()
  })
  it('empieza en el futuro: ninguna', () => {
    expect(dueOccurrences({ ...base, start_month: '2027-01' }, new Date(2026, 10, 15))).toEqual([])
  })
})

describe('nextOccurrence / installmentProgress', () => {
  const inst: RecurringRule = { ...base, kind: 'installments', installments_total: 3 }
  it('próxima de un fijo', () => {
    expect(nextOccurrence(base, new Date(2026, 10, 15))).toEqual({ date: '2026-12-10', installment_number: null })
  })
  it('próxima cuota', () => {
    expect(nextOccurrence(inst, new Date(2026, 8, 15))).toEqual({ date: '2026-10-10', installment_number: 3 })
  })
  it('al terminar las cuotas devuelve null', () => {
    expect(nextOccurrence(inst, new Date(2026, 9, 10))).toBeNull()
  })
  it('progreso', () => {
    expect(installmentProgress(inst, new Date(2026, 8, 15))).toEqual({ paid: 2, total: 3 })
    expect(installmentProgress(base, new Date())).toBeNull()
  })
})
