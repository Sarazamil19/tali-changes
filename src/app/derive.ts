// Turns stored data (timestamps) into what the screens show ("Today · 9:30 AM", "3 days ago", units sold this month…).
// Used for real accounts and for data kept on this phone. The sample data already has these fields filled in.
import type { Customer, Expense, Order, Product, Task } from './data'
import type { SentMessage } from './store'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const dayDiff = (a: Date, b: Date) => Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000)

/** "9:30 AM" */
export function fmtTime(d: Date) {
  const h = d.getHours()
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}
/** "13:05" */
export const fmtClock = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
/** "Today" / "Yesterday" / "Tomorrow" / "24 Nov" */
export function dayLabel(d: Date, now = new Date()) {
  const diff = dayDiff(d, now)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff === 1) return 'Tomorrow'
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** "9:30 AM" today or tomorrow → ISO timestamp */
export function dueFrom(when: 'today' | 'upcoming', time: string, now = new Date()) {
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  const d = startOfDay(now)
  if (when === 'upcoming') d.setDate(d.getDate() + 1)
  if (m) {
    let h = Number(m[1]) % 12
    if ((m[3] ?? '').toUpperCase() === 'PM') h += 12
    if (!m[3] && Number(m[1]) >= 12) h = Number(m[1])
    d.setHours(h, Number(m[2]))
  }
  return d.toISOString()
}

/** Next delivery slot: 9:30 AM today if still ahead, otherwise tomorrow. */
export function nextDeliverySlot(now = new Date()) {
  const d = startOfDay(now)
  d.setHours(9, 30)
  if (d <= now) d.setDate(d.getDate() + 1)
  return d.toISOString()
}

export const sameMonth = (iso: string | undefined, now = new Date()) => {
  if (!iso) return false
  const d = new Date(iso)
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export type Snapshot = {
  businessName: string
  goal: number
  channels: Record<'instagram' | 'website' | 'talabat' | 'careem', boolean>
  products: Product[]
  customers: Customer[]
  orders: Order[]
  tasks: Task[]
  expenses: Expense[]
  messages: SentMessage[]
}

export const emptySnapshot = (): Snapshot => ({
  businessName: '',
  goal: 1000,
  channels: { instagram: true, website: false, talabat: false, careem: false },
  products: [],
  customers: [],
  orders: [],
  tasks: [],
  expenses: [],
  messages: [],
})

const live = (o: Order) => o.status !== 'Cancelled'

export function derive(s: Snapshot, now = new Date()): Snapshot {
  const orders = s.orders
    .map((o) => {
      const created = new Date(o.createdAt ?? now)
      const delivery = o.deliveryAt ? new Date(o.deliveryAt) : null
      return {
        ...o,
        day: dayLabel(created, now),
        time: fmtClock(created),
        delivery: delivery ? `${dayLabel(delivery, now)} · ${fmtTime(delivery)}` : '—',
      }
    })
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  const totals = new Map<string, { n: number; spent: number; last: number }>()
  const sold = new Map<string, number>()
  for (const o of orders) {
    if (!live(o)) continue
    const total = o.lines.reduce((t, l) => t + (l.price ?? 0) * l.qty, 0) + o.deliveryFee - o.discount
    const days = -dayDiff(new Date(o.createdAt ?? now), now)
    const c = totals.get(o.customerId) ?? { n: 0, spent: 0, last: Infinity }
    totals.set(o.customerId, { n: c.n + 1, spent: c.spent + total, last: Math.min(c.last, days) })
    if (sameMonth(o.createdAt, now)) for (const l of o.lines) sold.set(l.productId, (sold.get(l.productId) ?? 0) + l.qty)
  }

  const customers = s.customers.map((c) => {
    const x = totals.get(c.id)
    return { ...c, orders: x?.n ?? 0, spent: Math.round((x?.spent ?? 0) * 100) / 100, lastOrderDays: x ? x.last : undefined }
  })
  const products = s.products.map((p) => ({ ...p, sold: sold.get(p.id) ?? 0 }))

  const tasks = s.tasks
    .map((t) => {
      const due = new Date(t.dueAt ?? now)
      const diff = dayDiff(due, now)
      const done = t.doneAt && !/[AP]M$/.test(t.doneAt) ? fmtTime(new Date(t.doneAt)) : t.doneAt
      return {
        ...t,
        when: (diff <= 0 ? 'today' : 'upcoming') as Task['when'],
        time: fmtTime(due),
        meta: diff > 1 && t.kind !== 'delivery' && !t.meta ? dayLabel(due, now) : t.meta,
        doneAt: done,
      }
    })
    .sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''))

  const expenses = s.expenses
    .map((e) => ({ ...e, date: e.spentOn ? dayLabel(new Date(e.spentOn + 'T12:00:00'), now) : e.date }))
    .sort((a, b) => (b.spentOn ?? '').localeCompare(a.spentOn ?? ''))

  const messages = s.messages.map((m) => ({ ...m, at: /^\d{2}:\d{2}$/.test(m.at) ? m.at : fmtClock(new Date(m.at)) }))

  return { ...s, orders, customers, products, tasks, expenses, messages }
}
