// Sales, costs, expenses and profit for a period, worked out from the seller's orders and expenses.
// The demo keeps the fixed numbers from the Figma screens.
import { useMemo } from 'react'
import { cloudEnabled } from './cloud'
import { orderTotals, type Expense, type Order, type Product } from './data'
import { t } from './i18n'
import { useStore } from './store'
import { today } from './calendar'

export type Period = 'today' | 'week' | 'month'

export type Figures = { sales: number; costs: number; expenses: number; profit: number; count: number }

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function figures(orders: Order[], products: Product[], expenses: Expense[], from: Date, to: Date): Figures {
  let sales = 0
  let costs = 0
  let count = 0
  for (const o of orders) {
    if (o.status === 'Cancelled' || !o.createdAt) continue
    const d = new Date(o.createdAt)
    if (d < from || d >= to) continue
    count++
    sales += orderTotals(o, products).total
    costs += o.lines.reduce((s, l) => s + (l.cost ?? products.find((p) => p.id === l.productId)?.cost ?? 0) * l.qty, 0)
  }
  const spent = expenses
    .filter((e) => e.spentOn && new Date(e.spentOn + 'T12:00:00') >= from && new Date(e.spentOn + 'T12:00:00') < to)
    .reduce((s, e) => s + e.amount, 0)
  return { sales, costs, expenses: spent, profit: sales - costs - spent, count }
}

/** [start, end) of a period, `back` periods ago */
function range(p: Period, back: number, now: Date): [Date, Date] {
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  if (p === 'month') return [new Date(y, m - back, 1), new Date(y, m - back + 1, 1)]
  if (p === 'week') {
    const start = new Date(y, m, d - now.getDay() - 7 * back) // weeks start on Sunday
    return [start, new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)]
  }
  return [new Date(y, m, d - back), new Date(y, m, d - back + 1)]
}

/** % change, or null when there is nothing to compare with */
export const change = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null)

export type Metrics = {
  demo: boolean
  month: Figures
  monthDelta: { sales: number | null; count: number | null; expenses: number | null; profit: number | null }
  period: (p: Period) => { now: Figures; sales: number | null; profit: number | null; vs: string }
  /** last six months, oldest first */
  series: { months: string[]; sales: number[]; profit: number[]; total: number }
  prevMonth: string
  /** this month's sales by channel, biggest first: [channel, % of sales, JD] */
  byChannel: [string, number, number][]
  /** JD kept from every JD 100 sold this month */
  keepPer100: number
}

const DEMO: Record<Period, { sales: number; profit: number; s: number; p: number; vs: string }> = {
  today: { sales: 186, profit: 71, s: 8, p: 5, vs: 'yesterday' },
  week: { sales: 1120, profit: 430, s: 6, p: 9, vs: 'last week' },
  month: { sales: 4280, profit: 1605, s: 12, p: 18, vs: 'Oct' },
}

export function useMetrics(): Metrics {
  const { orders, products, expenses } = useStore()
  return useMemo(() => {
    const now = today()
    const prevMonth = SHORT[(now.getMonth() + 11) % 12]
    if (!cloudEnabled) {
      const month = { sales: 4280, costs: 1540, expenses: 1135, profit: 1605, count: orders.length + 131 }
      return {
        demo: true,
        month,
        monthDelta: { sales: 12, count: 8, expenses: 3, profit: 18 },
        period: (p: Period) => ({
          now: { ...month, sales: DEMO[p].sales, profit: DEMO[p].profit },
          sales: DEMO[p].s,
          profit: DEMO[p].p,
          vs: DEMO[p].vs,
        }),
        series: {
          months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
          sales: [2600, 2900, 3150, 3400, 3820, 4280],
          profit: [900, 1000, 1120, 1250, 1380, 1605],
          total: 20250,
        },
        prevMonth,
        byChannel: (
          [
            ['Instagram', 58],
            ['WhatsApp', 30],
            ['Website', 8],
            ['In person', 4],
          ] as [string, number][]
        ).map(([c, p]) => [c, p, Math.round((4280 * p) / 100)]),
        keepPer100: 37,
      }
    }
    const [mFrom, mTo] = range('month', 0, now)
    const perChannel = new Map<string, number>()
    for (const o of orders) {
      if (o.status === 'Cancelled' || !o.createdAt) continue
      const d = new Date(o.createdAt)
      if (d >= mFrom && d < mTo) perChannel.set(o.channel, (perChannel.get(o.channel) ?? 0) + orderTotals(o, products).total)
    }
    const fig = (p: Period, back: number) => figures(orders, products, expenses, ...range(p, back, now))
    const month = fig('month', 0)
    const last = fig('month', 1)
    const six = [5, 4, 3, 2, 1, 0].map((b) => ({ f: fig('month', b), m: SHORT[(now.getMonth() - b + 12) % 12] }))
    return {
      demo: false,
      month,
      monthDelta: {
        sales: change(month.sales, last.sales),
        count: change(month.count, last.count),
        expenses: change(month.expenses, last.expenses),
        profit: change(month.profit, last.profit),
      },
      period: (p: Period) => {
        const cur = fig(p, 0)
        const prev = fig(p, 1)
        return { now: cur, sales: change(cur.sales, prev.sales), profit: change(cur.profit, prev.profit), vs: p === 'today' ? 'yesterday' : p === 'week' ? 'last week' : prevMonth }
      },
      series: {
        months: six.map((x) => x.m),
        sales: six.map((x) => Math.round(x.f.sales)),
        profit: six.map((x) => Math.round(x.f.profit)),
        total: six.reduce((s, x) => s + x.f.sales, 0),
      },
      prevMonth,
      byChannel: [...perChannel.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([c, v]): [string, number, number] => [c, month.sales ? Math.round((v / month.sales) * 100) : 0, Math.round(v)]),
      keepPer100: month.sales > 0 ? Math.max(0, Math.round((month.profit / month.sales) * 100)) : 0,
    }
  }, [orders, products, expenses])
}

/** "12% vs Oct" / "5% vs yesterday" */
export function vsText(pct: number | null, vs: string) {
  if (pct === null) return t('Nothing to compare yet')
  const p = `${Math.abs(pct)}%`
  if (vs === 'yesterday') return t('{p} vs yesterday', { p })
  if (vs === 'last week') return t('{p} vs last week', { p })
  return t('{p} vs {month}', { p, month: t(vs) })
}

/** 4280 → "4,280" */
export const whole = (n: number) => Math.round(n).toLocaleString('en-US')
