import type { Budget, Transaction, TxType } from './types'

/** Monto de la transacción en ARS, usando la cotización guardada al cargarla. */
export function toARS(tx: Pick<Transaction, 'amount' | 'currency' | 'fx_rate'>): number {
  return tx.currency === 'USD' ? tx.amount * tx.fx_rate : tx.amount
}

export function totalsByType(txs: Transaction[]): { income: number; expense: number; balance: number } {
  let income = 0
  let expense = 0
  for (const t of txs) {
    if (t.type === 'income') income += toARS(t)
    else expense += toARS(t)
  }
  return { income, expense, balance: income - expense }
}

/** Total por categoría en ARS, ordenado de mayor a menor. */
export function spentByCategory(
  txs: Transaction[],
  type: TxType = 'expense',
): { category_id: string | null; total: number }[] {
  const map = new Map<string | null, number>()
  for (const t of txs) {
    if (t.type !== type) continue
    map.set(t.category_id, (map.get(t.category_id) ?? 0) + toARS(t))
  }
  return [...map.entries()]
    .map(([category_id, total]) => ({ category_id, total }))
    .sort((a, b) => b.total - a.total)
}

export function monthlyTotals(txs: Transaction[]): { month: string; income: number; expense: number }[] {
  const map = new Map<string, { month: string; income: number; expense: number }>()
  for (const t of txs) {
    const month = t.date.slice(0, 7)
    const row = map.get(month) ?? { month, income: 0, expense: 0 }
    if (t.type === 'income') row.income += toARS(t)
    else row.expense += toARS(t)
    map.set(month, row)
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month))
}

export type BudgetStatus = 'ok' | 'warning' | 'over'

export function budgetProgress(
  budget: Pick<Budget, 'amount' | 'currency'>,
  spentARS: number,
  rate: number,
): { spent: number; limit: number; pct: number; status: BudgetStatus } {
  const limit = budget.currency === 'USD' ? budget.amount * rate : budget.amount
  const pct = limit > 0 ? (spentARS / limit) * 100 : spentARS > 0 ? 100 : 0
  const status: BudgetStatus = pct >= 100 ? 'over' : pct >= 80 ? 'warning' : 'ok'
  return { spent: spentARS, limit, pct, status }
}

export function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number)
  const idx = y * 12 + (m - 1) + n
  const ny = Math.floor(idx / 12)
  const nm = (idx % 12) + 1
  return `${ny}-${String(nm).padStart(2, '0')}`
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return `${MESES[m - 1]} ${y}`
}

/** Último día del mes (1-31). */
export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** Gasto diario acumulado (ARS) de un mes: [{day, total}] para cada día 1..n. */
export function cumulativeDaily(txs: Transaction[], month: string, upToDay?: number): { day: number; total: number }[] {
  const n = upToDay ?? daysInMonth(month)
  const perDay = new Array<number>(n + 1).fill(0)
  for (const t of txs) {
    if (t.type !== 'expense' || t.date.slice(0, 7) !== month) continue
    const d = Number(t.date.slice(8, 10))
    if (d >= 1 && d <= n) perDay[d] += toARS(t)
  }
  let acc = 0
  return Array.from({ length: n }, (_, i) => {
    acc += perDay[i + 1]
    return { day: i + 1, total: acc }
  })
}
