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
