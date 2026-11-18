import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { convert, formatMoney } from '../lib/fx'
import { monthLabel } from '../lib/stats'

type Cur = 'ARS' | 'USD'

const AXIS = { fontSize: 11, fill: '#94a3b8' }
const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  border: '1px solid #334155',
  borderRadius: 12,
  color: '#f1f5f9',
  fontSize: 12,
}

function compact(n: number): string {
  return new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

function Empty({ text }: { text: string }) {
  return <div className="grid h-40 place-items-center text-sm text-slate-500 dark:text-slate-400">{text}</div>
}

export interface PieSlice { name: string; icon?: string; color: string; value: number }

/** Valores recibidos en ARS; se convierten a `currency` con `rate`. */
export function CategoryPie({ data, currency = 'ARS', rate = 1 }: { data: PieSlice[]; currency?: Cur; rate?: number }) {
  const rows = data.filter((d) => d.value > 0).map((d) => ({ ...d, value: convert(d.value, 'ARS', currency, rate) }))
  if (!rows.length) return <Empty text="Sin gastos en este período" />
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
            {rows.map((r, i) => <Cell key={i} fill={r.color} />)}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ color: '#f1f5f9' }}
            formatter={(v) => formatMoney(Number(v), currency)}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MonthlyBars({
  data, currency = 'ARS', rate = 1,
}: { data: { month: string; income: number; expense: number }[]; currency?: Cur; rate?: number }) {
  if (!data.length) return <Empty text="Sin datos" />
  const rows = data.map((d) => ({
    label: monthLabel(d.month).slice(0, 3),
    Ingresos: convert(d.income, 'ARS', currency, rate),
    Gastos: convert(d.expense, 'ARS', currency, rate),
  }))
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.25} vertical={false} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={compact} width={48} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ color: '#f1f5f9' }}
            cursor={{ fill: 'rgba(148,163,184,0.15)' }}
            formatter={(v) => formatMoney(Number(v), currency)}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TrendLine({
  data, currency = 'ARS', rate = 1,
}: { data: { day: number; total: number }[]; currency?: Cur; rate?: number }) {
  if (!data.length) return <Empty text="Sin datos" />
  const rows = data.map((d) => ({ day: d.day, Acumulado: convert(d.total, 'ARS', currency, rate) }))
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.25} vertical={false} />
          <XAxis dataKey="day" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={compact} width={48} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ color: '#f1f5f9' }}
            labelStyle={{ color: '#94a3b8' }}
            labelFormatter={(d) => `Día ${d}`}
            formatter={(v) => formatMoney(Number(v), currency)}
          />
          <Line type="monotone" dataKey="Acumulado" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
