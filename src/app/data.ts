// Sample business data — "Layla's Candles", the persona used across the Figma screens.
import { getLang } from './i18n'

export type OrderStatus = 'New' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
export type Payment = 'Paid' | 'Unpaid' | 'Cash on delivery'
export type Channel = 'Instagram' | 'WhatsApp' | 'Website' | 'In person' | 'Talabat' | 'Careem'

export type Product = {
  id: string
  name: string
  price: number
  cost: number
  stock: number
  alertAt: number
  /** units sold this month — used by the product coach */
  sold?: number
}

export type Customer = {
  id: string
  name: string
  phone: string
  area: string
  channel: Channel
  orders: number
  spent: number
  /** days since their last order (undefined = no orders yet) */
  lastOrderDays?: number
}

export type OrderLine = { productId: string; qty: number }

export type Order = {
  id: string
  customerId: string
  lines: OrderLine[]
  channel: Channel
  day: string
  time: string
  status: OrderStatus
  payment: Payment
  deliveryFee: number
  discount: number
  delivery: string
}

export type TaskKind = 'task' | 'reminder' | 'delivery'
export type TaskState = 'todo' | 'progress' | 'done'

export type Task = {
  id: string
  title: string
  meta: string
  time: string
  when: 'today' | 'upcoming'
  state: TaskState
  kind: TaskKind
  doneAt?: string
}

export type Expense = { id: string; title: string; date: string; amount: number; icon: 'truck' | 'products' | 'camera' }

export const initialProducts: Product[] = [
  { id: 'p1', name: 'Oud & Amber candle', price: 14, cost: 5, stock: 24, alertAt: 5, sold: 64 },
  { id: 'p2', name: 'Olive oil soap, 3-pack', price: 9, cost: 6, stock: 40, alertAt: 10, sold: 52 },
  { id: 'p3', name: 'Rose & Musk candle', price: 14, cost: 5, stock: 18, alertAt: 5, sold: 41 },
  { id: 'p4', name: 'Lavender bath salts', price: 8, cost: 4, stock: 3, alertAt: 10, sold: 9 },
  { id: 'p5', name: 'Gift box, large', price: 25, cost: 11, stock: 2, alertAt: 10, sold: 18 },
  { id: 'p6', name: 'Wooden-wick candle', price: 16, cost: 5, stock: 4, alertAt: 10, sold: 7 },
]

export const initialCustomers: Customer[] = [
  { id: 'c1', name: 'Rania Haddad', phone: '079 555 0148', area: 'Amman, Khalda', channel: 'Instagram', orders: 6, spent: 214, lastOrderDays: 0 },
  { id: 'c2', name: 'Omar Khalil', phone: '078 555 0147', area: 'Amman, Abdoun', channel: 'WhatsApp', orders: 3, spent: 96, lastOrderDays: 0 },
  { id: 'c3', name: 'Dana Saleh', phone: '077 555 0146', area: 'Amman, Khalda', channel: 'Website', orders: 8, spent: 352, lastOrderDays: 1 },
  { id: 'c4', name: 'Yazan Odeh', phone: '079 555 0145', area: 'Zarqa', channel: 'Instagram', orders: 1, spent: 17, lastOrderDays: 1 },
  { id: 'c5', name: 'Lina Masri', phone: '078 555 0144', area: 'Amman, Sweifieh', channel: 'WhatsApp', orders: 4, spent: 160, lastOrderDays: 21 },
  { id: 'c6', name: 'Hala Nasser', phone: '079 555 0143', area: 'Amman, Jabal Amman', channel: 'Instagram', orders: 5, spent: 182, lastOrderDays: 74 },
  { id: 'c7', name: 'Noor Awad', phone: '077 555 0142', area: 'Amman, Tla’ al-Ali', channel: 'Website', orders: 3, spent: 88, lastOrderDays: 63 },
  { id: 'c8', name: 'Sami Daoud', phone: '078 555 0141', area: 'Irbid', channel: 'WhatsApp', orders: 2, spent: 41, lastOrderDays: 96 },
]

export const initialOrders: Order[] = [
  {
    id: 'TL-1048', customerId: 'c1', channel: 'Instagram', day: 'Today', time: '12:40', status: 'New', payment: 'Paid',
    lines: [{ productId: 'p1', qty: 2 }, { productId: 'p2', qty: 1 }], deliveryFee: 3, discount: 2, delivery: 'Today · 9:30 AM',
  },
  {
    id: 'TL-1047', customerId: 'c2', channel: 'WhatsApp', day: 'Today', time: '10:15', status: 'Confirmed', payment: 'Cash on delivery',
    lines: [{ productId: 'p3', qty: 1 }, { productId: 'p4', qty: 1 }], deliveryFee: 2.5, discount: 0, delivery: 'Tomorrow · 2:00 PM',
  },
  {
    id: 'TL-1046', customerId: 'c3', channel: 'Website', day: 'Yesterday', time: '18:02', status: 'Processing', payment: 'Paid',
    lines: [{ productId: 'p5', qty: 2 }, { productId: 'p2', qty: 1 }], deliveryFee: 2, discount: 0, delivery: 'Today · 9:30 AM',
  },
  {
    id: 'TL-1045', customerId: 'c4', channel: 'Instagram', day: 'Yesterday', time: '15:20', status: 'Shipped', payment: 'Cash on delivery',
    lines: [{ productId: 'p4', qty: 1 }, { productId: 'p2', qty: 1 }], deliveryFee: 0, discount: 0, delivery: 'Today · 4:00 PM',
  },
  {
    id: 'TL-1019', customerId: 'c1', channel: 'Instagram', day: '2 Nov', time: '11:05', status: 'Delivered', payment: 'Paid',
    lines: [{ productId: 'p1', qty: 3 }], deliveryFee: 0, discount: 0, delivery: '3 Nov · 1:00 PM',
  },
]

export const initialTasks: Task[] = [
  { id: 't1', title: 'Pay delivery company', meta: 'Done at 9:05 AM', time: '9:00 AM', when: 'today', state: 'done', kind: 'task', doneAt: '9:05 AM' },
  { id: 't2', title: 'Pack order #TL-1046', meta: 'Linked to order', time: '9:30 AM', when: 'today', state: 'progress', kind: 'delivery' },
  { id: 't3', title: 'Call supplier about packaging', meta: 'Packaging quote', time: '11:15 AM', when: 'today', state: 'todo', kind: 'task' },
  { id: 't4', title: 'Restock lavender salts', meta: 'Suggested from low stock', time: '1:00 PM', when: 'today', state: 'todo', kind: 'reminder' },
  { id: 't5', title: 'Post new candle photos', meta: 'Instagram', time: '6:00 PM', when: 'today', state: 'todo', kind: 'task' },
  { id: 't6', title: 'Deliver #TL-1047 to Omar', meta: 'Tomorrow · Abdoun', time: '2:00 PM', when: 'upcoming', state: 'todo', kind: 'delivery' },
  { id: 't7', title: 'Order new wax supply', meta: 'Tue 24 Nov', time: '10:00 AM', when: 'upcoming', state: 'todo', kind: 'reminder' },
]

export const expenses: Expense[] = [
  { id: 'e1', title: 'Delivery company', date: '12 Nov', amount: 310, icon: 'truck' },
  { id: 'e2', title: 'Packaging', date: '8 Nov', amount: 120, icon: 'products' },
  { id: 'e3', title: 'Instagram ads', date: '5 Nov', amount: 85, icon: 'camera' },
]

// Money: "JD 38.00" in English, "38.00 د.أ" in Arabic (Western digits, as used in Jordan)
export const jd = (n: number) => (getLang() === 'ar' ? `${n.toFixed(2)} د.أ` : `JD ${n.toFixed(2)}`)
export const jd0 = (n: number) => {
  const v = n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return getLang() === 'ar' ? `${v} د.أ` : `JD ${v}`
}
export const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export function orderTotals(order: Order, products: Product[]) {
  const subtotal = order.lines.reduce((sum, l) => {
    const p = products.find((x) => x.id === l.productId)
    return sum + (p ? p.price * l.qty : 0)
  }, 0)
  return { subtotal, total: subtotal + order.deliveryFee - order.discount }
}
