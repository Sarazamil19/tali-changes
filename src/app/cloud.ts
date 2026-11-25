// Connection to the TALI database (Supabase): sign-in with a WhatsApp code, loading a seller's data,
// saving every change, and live updates so the phone and the laptop stay in sync.
//
// Without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY the app runs as a demo with sample data.
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import type { Customer, Expense, Order, OrderStatus, Product, Task } from './data'
import type { ChannelState, SentMessage } from './store'
import type { TemplateId } from './whatsapp'
import type { Snapshot } from './derive'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const cloudEnabled = Boolean(url && key)
export const supabase: SupabaseClient | null = cloudEnabled ? createClient(url!, key!) : null
export type { Session }

const db = () => {
  if (!supabase) throw new Error('TALI is not connected to a database')
  return supabase
}

/** Throws the Supabase error, if any, so callers can show it. */
function ok<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data
}

// ------------------------------------------------------------------
// Sign-in with a one-time code sent on WhatsApp
// ------------------------------------------------------------------

/** Jordan numbers: "079 555 0148" → "+962795550148". Other numbers must start with +country code. */
export function toE164(raw: string) {
  const digits = raw.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  if (digits.startsWith('962')) return `+${digits}`
  if (digits.startsWith('0')) return `+962${digits.slice(1)}`
  return `+962${digits}`
}

export const isValidPhone = (raw: string) => /^\+\d{9,15}$/.test(toE164(raw))

export async function sendCode(phone: string) {
  if (!supabase) return
  const { error } = await supabase.auth.signInWithOtp({ phone: toE164(phone), options: { channel: 'whatsapp' } })
  if (error) throw new Error(error.message)
}

export async function verifyCode(phone: string, code: string) {
  if (!supabase) return
  const { error } = await supabase.auth.verifyOtp({ phone: toE164(phone), token: code, type: 'sms' })
  if (error) throw new Error(error.message)
}

export async function signOut() {
  await supabase?.auth.signOut()
}

// ------------------------------------------------------------------
// Loading
// ------------------------------------------------------------------

type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

const num = (v: unknown) => Number(v ?? 0)

export async function loadSnapshot(): Promise<Snapshot> {
  const c = db()
  const [biz, products, customers, orders, tasks, expenses, messages] = await Promise.all([
    c.from('businesses').select('*').maybeSingle(),
    c.from('products').select('*').eq('archived', false).order('created_at', { ascending: false }),
    c.from('customers').select('*').order('created_at', { ascending: false }),
    c.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(2000),
    c.from('tasks').select('*').order('due_at').limit(1000),
    c.from('expenses').select('*').order('spent_on', { ascending: false }).limit(1000),
    c.from('messages').select('*').order('sent_at', { ascending: false }).limit(1000),
  ])
  const b = ok(biz) as Row | null
  const orderRows = ok(orders) as Row[]
  const displayId = new Map(orderRows.map((o) => [o.id as string, `TL-${o.number}`]))

  return {
    businessName: b?.name ?? '',
    goal: num(b?.goal ?? 1000),
    channels: (b?.channels ?? { instagram: true, website: false, talabat: false, careem: false }) as ChannelState,
    products: (ok(products) as Row[]).map(
      (p): Product => ({ id: p.id, name: p.name, price: num(p.price), cost: num(p.cost), stock: p.stock, alertAt: p.alert_at }),
    ),
    customers: (ok(customers) as Row[]).map(
      (x): Customer => ({ id: x.id, name: x.name, phone: x.phone, area: x.area, channel: x.channel, orders: 0, spent: 0 }),
    ),
    orders: orderRows.map(
      (o): Order => ({
        id: `TL-${o.number}`,
        uuid: o.id,
        customerId: o.customer_id ?? '',
        channel: o.channel,
        status: o.status,
        payment: o.payment,
        deliveryFee: num(o.delivery_fee),
        discount: num(o.discount),
        createdAt: o.created_at,
        deliveryAt: o.delivery_at ?? undefined,
        lines: ((o.order_items ?? []) as Row[]).map((i) => ({ productId: i.product_id ?? '', qty: i.qty, price: num(i.unit_price), cost: num(i.unit_cost) })),
        day: '',
        time: '',
        delivery: '',
      }),
    ),
    tasks: (ok(tasks) as Row[]).map(
      (x): Task => ({
        id: x.id,
        title: x.title,
        meta: x.meta,
        kind: x.kind,
        state: x.state,
        dueAt: x.due_at,
        doneAt: x.done_at ?? undefined,
        when: 'today',
        time: '',
      }),
    ),
    expenses: (ok(expenses) as Row[]).map(
      (e): Expense => ({ id: e.id, title: e.title, amount: num(e.amount), icon: e.category, spentOn: e.spent_on, date: '' }),
    ),
    messages: (ok(messages) as Row[]).map(
      (m): SentMessage => ({
        id: m.id,
        customerId: m.customer_id ?? '',
        orderId: m.order_id ? displayId.get(m.order_id) : undefined,
        template: m.template as TemplateId,
        at: m.sent_at,
      }),
    ),
  }
}

// ------------------------------------------------------------------
// Saving — one function per change the app makes
// ------------------------------------------------------------------

const productRow = (p: Partial<Product>) => {
  const r: Row = {}
  if (p.name !== undefined) r.name = p.name
  if (p.price !== undefined) r.price = p.price
  if (p.cost !== undefined) r.cost = p.cost
  if (p.stock !== undefined) r.stock = p.stock
  if (p.alertAt !== undefined) r.alert_at = p.alertAt
  return r
}

export const cloud = {
  async addProduct(p: Product) {
    ok(await db().from('products').insert({ id: p.id, ...productRow(p) }))
  },
  async updateProduct(id: string, patch: Partial<Product>) {
    const r = productRow(patch)
    if (Object.keys(r).length) ok(await db().from('products').update(r).eq('id', id))
  },
  async addCustomer(c: Pick<Customer, 'id' | 'name' | 'phone' | 'area' | 'channel'>) {
    ok(await db().from('customers').insert({ id: c.id, name: c.name, phone: c.phone, area: c.area, channel: c.channel }))
  },
  async createOrder(o: Order): Promise<number> {
    return ok(
      await db().rpc('create_order', {
        p_id: o.uuid,
        p_customer: o.customerId || null,
        p_channel: o.channel,
        p_payment: o.payment,
        p_delivery_fee: o.deliveryFee,
        p_discount: o.discount,
        p_delivery_at: o.deliveryAt ?? null,
        p_items: o.lines.map((l) => ({ product_id: l.productId, qty: l.qty })),
      }),
    ) as number
  },
  async setOrderStatus(uuid: string, status: OrderStatus) {
    ok(await db().rpc('set_order_status', { p_id: uuid, p_status: status }))
  },
  async addTask(t: Task) {
    ok(await db().from('tasks').insert({ id: t.id, title: t.title, meta: t.meta, kind: t.kind, state: t.state, due_at: t.dueAt }))
  },
  async setTaskState(id: string, state: Task['state'], doneAt: string | null) {
    ok(await db().from('tasks').update({ state, done_at: doneAt }).eq('id', id))
  },
  async addExpense(e: Expense) {
    ok(await db().from('expenses').insert({ id: e.id, title: e.title, amount: e.amount, category: e.icon, spent_on: e.spentOn }))
  },
  async logMessage(m: SentMessage, orderUuid?: string) {
    ok(await db().from('messages').insert({ id: m.id, customer_id: m.customerId || null, order_id: orderUuid ?? null, template: m.template }))
  },
  async updateBusiness(patch: { name?: string; goal?: number; channels?: ChannelState; lang?: string }) {
    const {
      data: { user },
    } = await db().auth.getUser()
    if (!user) return
    ok(await db().from('businesses').upsert({ owner_id: user.id, ...patch }))
  },

  /** Moves data kept on this phone (used before signing up) into the account. */
  async uploadSnapshot(s: Snapshot) {
    const c = db()
    const { data: last } = await c.from('orders').select('number').order('number', { ascending: false }).limit(1).maybeSingle()
    let next = num((last as Row | null)?.number ?? 1000) + 1
    if (s.businessName) await this.updateBusiness({ name: s.businessName, goal: s.goal, channels: s.channels })
    if (s.products.length) ok(await c.from('products').upsert(s.products.map((p) => ({ id: p.id, ...productRow(p) }))))
    if (s.customers.length)
      ok(await c.from('customers').upsert(s.customers.map((x) => ({ id: x.id, name: x.name, phone: x.phone, area: x.area, channel: x.channel }))))
    const orderUuid = new Map<string, string>()
    const renumbered = new Map<string, string>()
    for (const o of [...s.orders].reverse()) {
      const uuid = o.uuid ?? crypto.randomUUID()
      orderUuid.set(o.id, uuid)
      renumbered.set(o.id, `TL-${next}`)
      ok(
        await c.from('orders').upsert({
          id: uuid,
          number: next++,
          customer_id: o.customerId || null,
          channel: o.channel,
          status: o.status,
          payment: o.payment,
          delivery_fee: o.deliveryFee,
          discount: o.discount,
          delivery_at: o.deliveryAt ?? null,
          created_at: o.createdAt,
        }),
      )
      ok(
        await c.from('order_items').insert(
          o.lines.map((l) => ({ order_id: uuid, product_id: l.productId || null, qty: l.qty, unit_price: l.price ?? 0, unit_cost: l.cost ?? 0 })),
        ),
      )
    }
    if (s.tasks.length)
      ok(
        await c.from('tasks').upsert(
          s.tasks.map((t) => {
            // delivery tasks follow their order (which may get a new number in the account)
            const ref = t.title.match(/^Deliver #(TL-\d+)$/)?.[1]
            return {
              id: t.id,
              title: ref && renumbered.has(ref) ? `Deliver #${renumbered.get(ref)}` : t.title,
              meta: t.meta,
              kind: t.kind,
              state: t.state,
              due_at: t.dueAt,
              done_at: t.doneAt ?? null,
              order_id: ref ? (orderUuid.get(ref) ?? null) : null,
            }
          }),
        ),
      )
    if (s.expenses.length)
      ok(await c.from('expenses').upsert(s.expenses.map((e) => ({ id: e.id, title: e.title, amount: e.amount, category: e.icon, spent_on: e.spentOn }))))
    if (s.messages.length)
      ok(
        await c.from('messages').upsert(
          s.messages.map((m) => ({
            id: m.id,
            customer_id: m.customerId || null,
            order_id: m.orderId ? (orderUuid.get(m.orderId) ?? null) : null,
            template: m.template,
            sent_at: m.at,
          })),
        ),
      )
  },
}

// ------------------------------------------------------------------
// Live sync — any change on another device reloads the data here
// ------------------------------------------------------------------
export function subscribe(onChange: () => void) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel('tali-sync')
    .on('postgres_changes', { event: '*', schema: 'public' }, () => onChange())
    .subscribe()
  return () => {
    supabase?.removeChannel(channel)
  }
}
