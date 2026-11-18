import type { RecurringRule } from './types'

export interface Occurrence {
  period: string // YYYY-MM
  date: string // YYYY-MM-DD
  installment_number: number | null
}

const pad = (n: number) => String(n).padStart(2, '0')

function occurrenceAt(rule: RecurringRule, k: number): Occurrence {
  const [y, m] = rule.start_month.split('-').map(Number)
  const idx = (m - 1) + k
  const year = y + Math.floor(idx / 12)
  const month = (idx % 12) + 1
  const period = `${year}-${pad(month)}`
  return {
    period,
    date: `${period}-${pad(rule.day_of_month)}`,
    installment_number: rule.kind === 'installments' ? k + 1 : null,
  }
}

function localISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function maxCount(rule: RecurringRule): number {
  return rule.kind === 'installments' ? (rule.installments_total ?? 0) : Infinity
}

export function dueOccurrences(rule: RecurringRule, today: Date): Occurrence[] {
  if (!rule.active) return []
  const t = localISO(today)
  const max = maxCount(rule)
  const out: Occurrence[] = []
  for (let k = 0; k < max && k < 1200; k++) {
    const o = occurrenceAt(rule, k)
    if (o.date > t) break
    out.push(o)
  }
  return out
}

export function nextOccurrence(
  rule: RecurringRule,
  today: Date,
): { date: string; installment_number: number | null } | null {
  if (!rule.active) return null
  const t = localISO(today)
  const max = maxCount(rule)
  for (let k = 0; k < max && k < 1200; k++) {
    const o = occurrenceAt(rule, k)
    if (o.date > t) return { date: o.date, installment_number: o.installment_number }
  }
  return null
}

export function installmentProgress(rule: RecurringRule, today: Date): { paid: number; total: number } | null {
  if (rule.kind !== 'installments' || !rule.installments_total) return null
  const t = localISO(today)
  let paid = 0
  for (let k = 0; k < rule.installments_total; k++) {
    if (occurrenceAt(rule, k).date <= t) paid++
    else break
  }
  return { paid, total: rule.installments_total }
}
