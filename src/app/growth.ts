// Growth tools — the logic behind Today's brief, the product coach, customer groups and the monthly goal.
// Everything here is worked out from data TALI already has (products, orders, customers).
import { jd, jd0, orderTotals, type Customer, type Order, type Product, type Task } from './data'
import { t } from './i18n'
import type { IconName } from '../components/Icon'
import type { Tone } from '../components/ui'

import { cloudEnabled } from './cloud'
import { sameMonth } from './derive'
import { daysLeftInMonth, monthName } from './calendar'

// ------------------------------------------------------------------
// Product coach
// ------------------------------------------------------------------
export type CoachLabel = 'star' | 'underpriced' | 'gem' | 'slow' | 'steady' | 'new'

export const coachInfo: Record<CoachLabel, { label: string; emoji: string; tone: Tone }> = {
  star: { label: 'Star', emoji: '⭐', tone: 'success' },
  underpriced: { label: 'Underpriced', emoji: '⚠️', tone: 'error' },
  gem: { label: 'Hidden gem', emoji: '💎', tone: 'plum' },
  slow: { label: 'Slow mover', emoji: '🐢', tone: 'coral' },
  steady: { label: 'Steady seller', emoji: '👍', tone: 'neutral' },
  new: { label: 'Too new to tell', emoji: '🌱', tone: 'neutral' },
}

const TARGET_MARGIN = 0.45
export const margin = (p: Product) => (p.price > 0 ? (p.price - p.cost) / p.price : 0)
/** A price that gives a 45% margin, rounded up to the nearest half dinar. */
export const suggestedPrice = (p: Product) => Math.ceil((p.cost / (1 - TARGET_MARGIN)) * 2) / 2

export function coachLabel(p: Product): CoachLabel {
  const sold = p.sold ?? 0
  const m = margin(p)
  if (sold === 0) return 'new'
  if (sold >= 25) return m >= 0.4 ? 'star' : 'underpriced'
  if (m >= 0.6) return 'gem'
  if (sold < 10) return 'slow'
  return 'steady'
}

/** The coach's advice for one product, in the current language. */
export function coachTip(p: Product): string {
  const m = Math.round(margin(p) * 100)
  const sold = p.sold ?? 0
  switch (coachLabel(p)) {
    case 'star':
      return p.stock <= p.alertAt
        ? t('Sells a lot with a good profit ({sold} sold this month). Only {n} left, so restock soon.', { sold, n: p.stock })
        : t('Sells a lot with a good profit ({sold} sold this month). Keep it in stock.', { sold })
    case 'underpriced':
      return t('Sells fast, but you keep only {m}% of the price. Try {price} to get a {t}% margin.', {
        m,
        price: jd0(suggestedPrice(p)),
        t: Math.round(TARGET_MARGIN * 100),
      })
    case 'gem':
      return t('Good profit ({m}% margin) but only {sold} sold this month. Show it to your best customers.', { m, sold })
    case 'slow':
      return t('Only {sold} sold this month. Put it in a bundle with a best seller, or sell what’s left at a small discount.', { sold })
    case 'steady':
      return t('Sells regularly with a fair profit. Nothing to change right now.')
    case 'new':
      return t('TALI needs a few sales before it can coach this product.')
  }
}

export function coachCounts(products: Product[]) {
  const c: Record<CoachLabel, number> = { star: 0, underpriced: 0, gem: 0, slow: 0, steady: 0, new: 0 }
  products.forEach((p) => c[coachLabel(p)]++)
  return c
}

// ------------------------------------------------------------------
// Customer groups
// ------------------------------------------------------------------
export type Group = 'all' | 'vip' | 'new' | 'quiet'

export const groupInfo: Record<Group, { label: string; emoji: string; hint: string }> = {
  all: { label: 'All', emoji: '', hint: 'Everyone' },
  vip: { label: 'VIP', emoji: '⭐', hint: 'Spent JD 150 or more' },
  new: { label: 'New', emoji: '🆕', hint: 'One order or none yet' },
  quiet: { label: 'Quiet', emoji: '😴', hint: 'No order in 60+ days' },
}

export const groups: Group[] = ['all', 'vip', 'new', 'quiet']

export function inGroup(c: Customer, g: Group) {
  if (g === 'all') return true
  if (g === 'vip') return c.spent >= 150
  if (g === 'new') return c.orders <= 1
  return (c.lastOrderDays ?? 0) >= 60
}

/** Groups a customer belongs to, for the small labels on each row. */
export const customerGroups = (c: Customer) => (['vip', 'quiet', 'new'] as Group[]).filter((g) => inGroup(c, g))

export function lastOrderText(c: Customer) {
  const d = c.lastOrderDays
  if (d === undefined || c.orders === 0) return t('No orders yet')
  if (d === 0) return t('Ordered today')
  if (d === 1) return t('Ordered yesterday')
  return t('Last order {n} days ago', { n: d })
}

// ------------------------------------------------------------------
// Monthly goal
// ------------------------------------------------------------------
const MONTH_SALES_SO_FAR = 4280 // sales recorded before this session (matches the dashboard)
const LAST_SAMPLE_ORDER = 1048

export function monthSales(orders: Order[], products: Product[]) {
  if (cloudEnabled)
    return orders.filter((o) => o.status !== 'Cancelled' && sameMonth(o.createdAt)).reduce((s, o) => s + orderTotals(o, products).total, 0)
  const added = orders
    .filter((o) => Number(o.id.split('-')[1]) > LAST_SAMPLE_ORDER)
    .reduce((s, o) => s + orderTotals(o, products).total, 0)
  return MONTH_SALES_SO_FAR + added
}

export function goalProgress(goal: number, sales: number) {
  const left = Math.max(0, goal - sales)
  return {
    pct: goal > 0 ? Math.min(100, Math.round((sales / goal) * 100)) : 0,
    left,
    perDay: Math.ceil(left / daysLeftInMonth()),
    reached: sales >= goal,
  }
}

// ------------------------------------------------------------------
// Today's brief — the things worth knowing when the app opens
// ------------------------------------------------------------------
export type BriefAction =
  | { type: 'orders' }
  | { type: 'order'; id: string }
  | { type: 'restock' }
  | { type: 'campaign'; group: Group; productId?: string }
  | { type: 'product'; id: string }
  | { type: 'goal' }

export type BriefItem = {
  id: string
  icon: IconName
  tone: Tone
  title: string
  detail: string
  cta: string
  action: BriefAction
  growth?: boolean
}

/** "9:30 AM" → minutes after midnight */
const toMinutes = (time: string) => {
  const [hm, ap] = time.split(' ')
  const [h, m] = hm.split(':').map(Number)
  return ((h % 12) + (ap === 'PM' ? 12 : 0)) * 60 + (m || 0)
}
const open = (o: Order) => o.status !== 'Delivered' && o.status !== 'Cancelled'

export function briefItems(d: { orders: Order[]; products: Product[]; customers: Customer[]; tasks: Task[]; goal: number }): BriefItem[] {
  const { orders, products, customers, goal } = d
  const items: BriefItem[] = []
  const name = (id: string) => t(customers.find((c) => c.id === id)?.name ?? '')

  const fresh = orders.filter((o) => o.status === 'New')
  if (fresh.length)
    items.push({
      id: 'confirm',
      icon: 'bag',
      tone: 'plum',
      title: fresh.length === 1 ? t('1 new order to confirm') : t('{n} new orders to confirm', { n: fresh.length }),
      detail: `#${fresh[0].id} · ${name(fresh[0].customerId)}`,
      cta: t('Open'),
      action: fresh.length === 1 ? { type: 'order', id: fresh[0].id } : { type: 'orders' },
    })

  const today = orders.filter((o) => open(o) && o.delivery.startsWith('Today'))
  if (today.length)
    items.push({
      id: 'deliveries',
      icon: 'truck',
      tone: 'plum',
      title: today.length === 1 ? t('1 delivery today') : t('{n} deliveries today', { n: today.length }),
      detail: t('First one at {time}', { time: t(today.map((o) => o.delivery.split(' · ')[1]).sort((a, b) => toMinutes(a) - toMinutes(b))[0]) }),
      cta: t('See orders'),
      action: { type: 'orders' },
    })

  const cod = orders.filter((o) => open(o) && o.payment === 'Cash on delivery')
  if (cod.length)
    items.push({
      id: 'collect',
      icon: 'coins',
      tone: 'coral',
      title: t('Collect {amount} in cash', { amount: jd(cod.reduce((s, o) => s + orderTotals(o, products).total, 0)) }),
      detail: t('{n} cash-on-delivery orders', { n: cod.length }),
      cta: t('See orders'),
      action: { type: 'orders' },
    })

  const low = products.filter((p) => p.stock <= p.alertAt)
  if (low.length)
    items.push({
      id: 'stock',
      icon: 'alert',
      tone: 'coral',
      title: t('{n} products are running low', { n: low.length }),
      detail: low.map((p) => t(p.name).split(/[,،]/)[0]).join(' · '),
      cta: t('Restock'),
      action: { type: 'restock' },
    })

  const quiet = customers.filter((c) => inGroup(c, 'quiet'))
  if (quiet.length)
    items.push({
      id: 'quiet',
      icon: 'users',
      tone: 'plum',
      title: t('{n} customers have gone quiet', { n: quiet.length }),
      detail: t('No order in 60+ days · send them a win-back offer'),
      cta: t('Send offer'),
      action: { type: 'campaign', group: 'quiet' },
      growth: true,
    })

  const under = products.find((p) => coachLabel(p) === 'underpriced')
  if (under)
    items.push({
      id: `under-${under.id}`,
      icon: 'trendUp',
      tone: 'error',
      title: t('{name} may be underpriced', { name: t(under.name) }),
      detail: t('Sells fast, but the margin is only {m}% · try {price}', { m: Math.round(margin(under) * 100), price: jd0(suggestedPrice(under)) }),
      cta: t('Review'),
      action: { type: 'product', id: under.id },
      growth: true,
    })

  const gem = products.find((p) => coachLabel(p) === 'gem')
  if (gem)
    items.push({
      id: `gem-${gem.id}`,
      icon: 'sparkle',
      tone: 'plum',
      title: t('{name} is a hidden gem', { name: t(gem.name) }),
      detail: t('{m}% margin but few sales · show it to your VIPs', { m: Math.round(margin(gem) * 100) }),
      cta: t('Promote'),
      action: { type: 'campaign', group: 'vip', productId: gem.id },
      growth: true,
    })

  const g = goalProgress(goal, monthSales(orders, products))
  items.push({
    id: 'goal',
    icon: 'insights',
    tone: g.reached ? 'success' : 'coral',
    title: g.reached ? t('You reached your {month} goal! 🎉', { month: monthName() }) : t('{left} to go for your {month} goal', { left: jd0(g.left), month: monthName() }),
    detail: g.reached ? t('{pct}% of {goal}', { pct: g.pct, goal: jd0(goal) }) : t('About {perDay} a day · {d} days left', { perDay: jd0(g.perDay), d: daysLeftInMonth() }),
    cta: t('See goal'),
    action: { type: 'goal' },
    growth: true,
  })

  return items
}
