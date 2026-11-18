// Contrato compartido entre todos los módulos. No cambiar sin coordinar.
export type Currency = 'ARS' | 'USD'
export type TxType = 'expense' | 'income'

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string // emoji
  color: string // hex
  type: TxType
}

export interface Transaction {
  id: string
  user_id: string
  type: TxType
  amount: number
  currency: Currency
  fx_rate: number // cotización dólar blue (venta) al momento de cargarlo
  category_id: string | null
  date: string // YYYY-MM-DD
  note: string | null
  created_at: string
  recurring_id?: string | null // regla que lo generó
  period?: string | null // YYYY-MM del período generado
  installment_number?: number | null // n° de cuota (1..N)
}

export type NewTransaction = Omit<Transaction, 'id' | 'user_id' | 'created_at'>

export interface Budget {
  id: string
  user_id: string
  category_id: string
  month: string // YYYY-MM
  amount: number
  currency: Currency
}

export type NewBudget = Omit<Budget, 'id' | 'user_id'>

// ---- Gastos fijos y cuotas (v2) ----
export type RecurringKind = 'fixed' | 'installments'

/** Regla que genera movimientos automáticamente cada mes. */
export interface RecurringRule {
  id: string
  user_id: string
  kind: RecurringKind // 'fixed' = todos los meses; 'installments' = N cuotas
  type: TxType
  amount: number // monto de CADA mes / CADA cuota
  currency: Currency
  category_id: string | null
  note: string | null
  day_of_month: number // 1-28
  start_month: string // YYYY-MM, primer mes que se genera
  installments_total: number | null // solo 'installments'
  active: boolean
  created_at: string
}

export type NewRecurringRule = Omit<RecurringRule, 'id' | 'user_id' | 'created_at'>
