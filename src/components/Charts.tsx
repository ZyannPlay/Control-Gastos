import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { convert, formatMoney } from '../lib/fx'
import { monthLabel } from '../lib/stats'
import type { Category } from '../lib/types'
import { CategoryIcon } from './ui/CategoryIcon'

type Cur = 'ARS' | 'USD'

/** Labels de ejes: Geist Mono 11px en fg-3. Grilla muda con hairline. */
const AXIS = { fontSize: 11, fill: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }
const GRID = 'var(--line)'
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--raised)',
  border: '1px solid var(--line-strong)',
  borderRadius: 10,
  color: 'var(--fg)',
  fontSize: 12,
  boxShadow: 'none',
}
const TOOLTIP_ITEM = { color: 'var(--fg)' }
const TOOLTIP_LABEL = { color: 'var(--fg-3)' }

function compact(n: number): string {
  return new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

function Empty({ text, className = 'h-40' }: { text: string; className?: string }) {
  return <div className={`grid place-items-center text-[13px] text-fg-3 ${className}`}>{text}</div>
}

export interface RankedCategory { name: string; category?: Pick<Category, 'icon' | 'color'> | null; value: number }

/** Lista rankeada con barras finas. Valores en ARS; se convierten a `currency` con `rate`. La primera va en acento. */
export function CategoryRanking({ data, currency = 'ARS', rate = 1, limit = 6 }: { data: RankedCategory[]; currency?: Cur; rate?: number; limit?: number }) {
  const rows = data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value)
  const total = rows.reduce((s, r) => s + r.value, 0)
  if (!rows.length) return <Empty text="Sin gastos en este período" />
  return (
    <ul className="space-y-4">
      {rows.slice(0, limit).map((r, i) => {
        const pct = total > 0 ? (r.value / total) * 100 : 0
        return (
          <li key={r.name} className="flex items-center gap-3">
            <CategoryIcon category={r.category} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[15px] leading-5">{r.name}</span>
                <span className="num whitespace-nowrap text-[15px] leading-5 font-medium">{formatMoney(convert(r.value, 'ARS', currency, rate), currency)}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised">
                  <div className={`h-full rounded-full ${i === 0 ? 'bg-accent' : 'bg-fg-3'}`} style={{ width: `${Math.max(2, pct)}%` }} />
                </div>
                <span className="num w-9 text-right font-mono text-[12px] leading-4 text-fg-3">{Math.round(pct)}%</span>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Bloque secundario: barras neutras, mes actual (el último) en acento. */
export function MonthlyBars({
  data, currency = 'ARS', rate = 1,
}: { data: { month: string; income: number; expense: number }[]; currency?: Cur; rate?: number }) {
  if (!data.length) return <Empty text="Sin datos" />
  const rows = data.map((d) => ({
    label: monthLabel(d.month).slice(0, 3),
    Ingresos: convert(d.income, 'ARS', currency, rate),
    Gastos: convert(d.expense, 'ARS', currency, rate),
  }))
  const last = rows.length - 1
  return (
    <div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={compact} width={40} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              itemStyle={TOOLTIP_ITEM}
              labelStyle={TOOLTIP_LABEL}
              cursor={{ fill: 'var(--raised)' }}
              formatter={(v) => formatMoney(Number(v), currency)}
            />
            <Bar dataKey="Gastos" radius={[3, 3, 0, 0]} maxBarSize={14}>
              {rows.map((_, i) => <Cell key={i} fill={i === last ? 'var(--accent)' : 'var(--fg-3)'} />)}
            </Bar>
            <Bar dataKey="Ingresos" fill="var(--fg-3)" fillOpacity={0.3} radius={[3, 3, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[12px] leading-4 text-fg-3">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-fg-3" />Gastos</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-fg-3 opacity-30" />Ingresos</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-accent" />Mes actual</span>
      </div>
    </div>
  )
}

/**
 * Gráfico principal: gasto acumulado (línea suave en acento) contra el total presupuestado (línea punteada neutra).
 * `budget` llega en ARS; `days` es la cantidad de días del mes para fijar el eje.
 */
export function TrendLine({
  data, budget, days, currency = 'ARS', rate = 1,
}: { data: { day: number; total: number }[]; budget?: number; days?: number; currency?: Cur; rate?: number }) {
  if (!data.length) return <Empty text="Sin datos" className="h-72" />
  const rows = data.map((d) => ({ day: d.day, Acumulado: convert(d.total, 'ARS', currency, rate) }))
  const limit = budget && budget > 0 ? convert(budget, 'ARS', currency, rate) : null
  const end = days ?? rows[rows.length - 1].day
  const ticks = Array.from(new Set([1, 8, 15, 22, end])).filter((t) => t <= end)
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="day" type="number" domain={[1, end]} ticks={ticks} tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis
            tick={AXIS} axisLine={false} tickLine={false} tickFormatter={compact} width={44}
            domain={[0, (max: number) => Math.max(max, limit ?? 0)]}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={TOOLTIP_ITEM}
            labelStyle={TOOLTIP_LABEL}
            cursor={{ stroke: 'var(--line-strong)' }}
            labelFormatter={(d) => `Día ${d}`}
            formatter={(v) => formatMoney(Number(v), currency)}
          />
          {limit !== null && (
            <ReferenceLine
              y={limit} stroke="var(--fg-3)" strokeDasharray="2 4" strokeWidth={1.5}
              label={{ value: 'Presupuesto', position: 'insideTopLeft', fill: 'var(--fg-3)', fontSize: 11, fontFamily: 'var(--font-mono)', dy: -14 }}
            />
          )}
          <Line
            type="monotone" dataKey="Acumulado" stroke="var(--accent)" strokeWidth={2.5} dot={false}
            activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
