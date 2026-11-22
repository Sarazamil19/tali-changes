import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../app/store'
import { getLang, t, tParts } from '../app/i18n'
import { jd, orderTotals, type OrderStatus, type Payment } from '../app/data'
import { Icon } from '../components/Icon'
import { LastMessage, WhatsAppButton, WhatsAppSheet } from '../components/WhatsApp'
import {
  Avatar,
  Button,
  Card,
  Chip,
  CircleButton,
  Footer,
  Pill,
  Screen,
  Scroll,
  SearchField,
  SectionLabel,
  StatusBadge,
  StatusSpacer,
  TabBar,
  TitleBar,
  TopBar,
  cx,
} from '../components/ui'

// ------------------------------------------------------------------
// Add order — 3 steps (M3 · M4 · M5)
// ------------------------------------------------------------------

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-2 px-5 pt-4 pb-3">
      {['Customer', 'Products', 'Payment'].map((l, i) => (
        <div key={l} className="flex-1">
          <div className="h-1 overflow-hidden rounded-full bg-line">
            <div className={cx('h-full rounded-full bg-coral transition-all duration-500', i < step ? 'w-full' : 'w-0')} />
          </div>
          <div className={cx('mt-1.5 text-xs', i + 1 === step ? 'font-semibold text-ink' : 'text-ink-2')}>{t(l)}</div>
        </div>
      ))}
    </div>
  )
}

function NewOrderHeader({ step }: { step: 1 | 2 | 3 }) {
  const { back, reset } = useStore()
  return (
    <>
      <StatusSpacer />
      <TopBar
        title={t('New order')}
        subtitle={t('Step {n} of 3', { n: step })}
        onBack={back}
        right={
          <button type="button" onClick={() => reset({ name: 'home' }, 'pop')} className="text-sm font-medium text-ink-2">
            {t('Cancel')}
          </button>
        }
      />
      <Stepper step={step} />
    </>
  )
}

export function NewOrderCustomer() {
  const { customers, draft, setDraft, push, showToast } = useStore()
  const [q, setQ] = useState('')
  const list = customers.filter((c) => (c.name + t(c.name) + c.phone).toLowerCase().includes(q.toLowerCase()))
  return (
    <Screen>
      <NewOrderHeader step={1} />
      <Scroll className="space-y-4 pt-2">
        <div>
          <div className="mb-1.5 text-xs font-semibold">{t('Customer')}</div>
          <SearchField value={q} onChange={setQ} placeholder={t('Search name or phone')} />
        </div>
        <div>
          <div className="mb-2 text-xs text-ink-2">{t('Recent customers')}</div>
          <Card className="p-1.5">
            {list.slice(0, 4).map((c) => {
              const on = draft.customerId === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDraft({ customerId: c.id })}
                  className={cx('flex w-full items-center gap-3 rounded-2xl p-2.5 text-start transition', on ? 'bg-brand-soft' : 'hover:bg-subtle')}
                >
                  <Avatar name={t(c.name)} size={36} light={on} />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{t(c.name)}</span>
                    <span className="block text-xs text-ink-2">{c.phone}</span>
                  </span>
                  <span
                    className={cx(
                      'grid size-6 place-items-center rounded-full transition',
                      on ? 'bg-brand text-white' : 'border-[1.5px] border-line',
                    )}
                  >
                    {on && <Icon name="check" size={14} strokeWidth={2.5} />}
                  </span>
                </button>
              )
            })}
            {list.length === 0 && <p className="p-4 text-center text-sm text-ink-2">{t('No customer found')}</p>}
          </Card>
        </div>
        <button
          type="button"
          onClick={() => showToast(t('New customer form — coming next'))}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-coral/60 py-3.5 text-sm font-semibold text-coral transition active:scale-[0.98]"
        >
          <Icon name="plus" size={18} /> {t('Add new customer')}
        </button>
      </Scroll>
      <Footer>
        <Button icon="arrowRight" className="w-full" disabled={!draft.customerId} onClick={() => push({ name: 'newOrderProducts' })}>
          {t('Next: Products')}
        </Button>
      </Footer>
    </Screen>
  )
}

export function NewOrderProducts() {
  const { products, draft, setQty, push } = useStore()
  const [q, setQ] = useState('')
  const items = Object.entries(draft.qty).reduce((s, [, n]) => s + n, 0)
  const total = Object.entries(draft.qty).reduce((s, [id, n]) => s + (products.find((p) => p.id === id)?.price ?? 0) * n, 0)
  return (
    <Screen>
      <NewOrderHeader step={2} />
      <Scroll className="space-y-3 pt-2">
        <div className="mb-1.5 text-xs font-semibold">{t('Products')}</div>
        <SearchField value={q} onChange={setQ} placeholder={t('Search products')} />
        {products
          .filter((p) => (p.name + t(p.name)).toLowerCase().includes(q.toLowerCase()))
          .map((p) => {
            const n = draft.qty[p.id] ?? 0
            const out = p.stock === 0
            return (
              <div
                key={p.id}
                className={cx(
                  'flex items-center gap-3 rounded-[20px] bg-white p-3 transition',
                  n > 0 ? 'shadow-soft ring-1 ring-blush' : 'shadow-soft',
                  out && 'opacity-50',
                )}
              >
                <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-coral">
                  <Icon name="products" size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{t(p.name)}</span>
                  <span className="block text-xs text-ink-2">
                    {jd(p.price).replace('.00', '')} · {out ? t('Out of stock') : t('{n} in stock', { n: p.stock })}
                  </span>
                </span>
                {out ? null : n === 0 ? (
                  <Button size="sm" variant="secondary" onClick={() => setQty(p.id, 1)}>
                    {t('Add')}
                  </Button>
                ) : (
                  <span className="flex items-center gap-2.5">
                    <button
                      type="button"
                      aria-label={t('Less')}
                      onClick={() => setQty(p.id, n - 1)}
                      className="grid size-8 place-items-center rounded-full bg-canvas text-burgundy active:scale-90"
                    >
                      <Icon name="minus" size={16} />
                    </button>
                    <span key={n} className="anim-pop-in w-4 text-center text-sm font-semibold">
                      {n}
                    </span>
                    <button
                      type="button"
                      aria-label={t('More')}
                      disabled={n >= p.stock}
                      onClick={() => setQty(p.id, n + 1)}
                      className="grid size-8 place-items-center rounded-full bg-brand text-white active:scale-90 disabled:opacity-40"
                    >
                      <Icon name="plus" size={16} />
                    </button>
                  </span>
                )}
              </div>
            )
          })}
      </Scroll>
      <Footer>
        <div className="flex items-center justify-between pb-1">
          <span className="text-sm text-ink-2">
            {items} {t(items === 1 ? 'item' : 'items')}
          </span>
          <span className="font-display text-lg font-bold">{jd(total)}</span>
        </div>
        <Button icon="arrowRight" className="w-full" disabled={items === 0} onClick={() => push({ name: 'newOrderPayment' })}>
          {t('Next: Payment')}
        </Button>
      </Footer>
    </Screen>
  )
}

export function NewOrderPayment() {
  const { products, customers, draft, setDraft, saveOrder, replace, back } = useStore()
  const customer = customers.find((c) => c.id === draft.customerId) ?? customers[0]
  const lines = Object.entries(draft.qty).map(([id, n]) => ({ p: products.find((p) => p.id === id)!, n }))
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.n, 0)
  const total = subtotal + draft.deliveryFee - draft.discount
  const row = 'flex items-center justify-between py-3 text-sm'
  return (
    <Screen>
      <NewOrderHeader step={3} />
      <Scroll className="space-y-3 pt-2">
        <Card className="flex items-center gap-3 p-3">
          <Avatar name={t(customer.name)} size={36} />
          <span className="flex-1">
            <span className="block text-sm font-semibold">{t(customer.name)}</span>
            <span className="block text-xs text-ink-2">
              {lines.reduce((s, l) => s + l.n, 0)} {t('items')} · {t(customer.channel)}
            </span>
          </span>
          <button type="button" onClick={() => { back(); back() }} className="text-xs font-semibold text-burgundy">
            {t('Change')}
          </button>
        </Card>
        <Card className="divide-y divide-line px-4">
          {lines.map((l) => (
            <div key={l.p.id} className={row}>
              <span className="text-ink-2">
                {l.n} × {t(l.p.name)}
              </span>
              <span className="font-semibold">{jd(l.p.price * l.n)}</span>
            </div>
          ))}
          <div className={row}>
            <span className="flex items-center gap-2 text-ink-2">
              <Icon name="truck" size={16} /> {t('Delivery fee')}
            </span>
            <span className="font-semibold">{jd(draft.deliveryFee)}</span>
          </div>
          <div className={row}>
            <span className="flex items-center gap-2 text-ink-2">
              <Icon name="coins" size={16} /> {t('Discount')}
            </span>
            <span className="font-semibold">− {jd(draft.discount)}</span>
          </div>
          <div className={row}>
            <span className="flex items-start gap-2 text-ink-2">
              <Icon name="calendar" size={16} className="mt-0.5 text-coral" />
              <span>
                {t('Delivery')}
                <span className="block text-xs text-coral">{t('Will appear in your Planner')}</span>
              </span>
            </span>
            <span className="font-semibold">{t('Today · 9:30 AM')}</span>
          </div>
        </Card>
        <div className="flex items-center justify-between rounded-[20px] bg-canvas px-4 py-4">
          <span className="text-sm font-semibold">{t('Total')}</span>
          <span className="font-display text-2xl font-bold text-burgundy">{jd(total)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['Paid', 'Unpaid', 'Cash on delivery'] as Payment[]).map((p) => (
            <Chip key={p} selected={draft.payment === p} onClick={() => setDraft({ payment: p })}>
              {t(p)}
            </Chip>
          ))}
        </div>
      </Scroll>
      <Footer>
        <Button
          icon="check"
          className="w-full"
          onClick={() => {
            const id = saveOrder()
            replace({ name: 'orderSaved', id }, 'fade')
          }}
        >
          {t('Save order')}
        </Button>
      </Footer>
    </Screen>
  )
}

// M5a/b · Order saved — check pops in, then Order details slides up
export function OrderSaved({ id }: { id: string }) {
  const { orders, customers, products, resetTo } = useStore()
  const order = orders.find((o) => o.id === id)
  useEffect(() => {
    // details slide up on top of Home, so "back" returns home
    const t = window.setTimeout(() => resetTo([{ name: 'home' }, { name: 'orderDetails', id }], 'up'), 1900)
    return () => window.clearTimeout(t)
  }, [id, resetTo])
  if (!order) return null
  const customer = customers.find((c) => c.id === order.customerId)
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="relative grid size-44 place-items-center">
          <span className="anim-pop-in absolute inset-0 rounded-full bg-success-soft" />
          <span className="anim-pop-in relative grid size-24 place-items-center rounded-full bg-success text-white" style={{ animationDelay: '0.12s' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path className="anim-draw" d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        </div>
        <h1 className="anim-rise mt-8 font-display text-[28px] font-bold" style={{ animationDelay: '0.3s' }}>
          {t('Order saved')}
        </h1>
        <p className="anim-rise mt-1 text-sm text-ink-2" style={{ animationDelay: '0.4s' }}>
          #{order.id} · {t(customer?.name ?? '')} · {jd(orderTotals(order, products).total)}
        </p>
        <span className="anim-rise mt-4 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-2 text-xs font-semibold text-plum" style={{ animationDelay: '0.5s' }}>
          <Icon name="calendar" size={15} /> {t('Added to Planner · Today 9:30 AM')}
        </span>
      </div>
    </Screen>
  )
}

// ------------------------------------------------------------------
// M13 · Orders
// ------------------------------------------------------------------

const baseCounts: Record<OrderStatus, number> = { New: 3, Confirmed: 5, Processing: 2, Shipped: 4, Delivered: 113, Cancelled: 0 }

export function Orders() {
  const { orders, customers, products, push } = useStore()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<OrderStatus | 'All'>('All')
  const counts = useMemo(() => {
    const c = { ...baseCounts }
    orders.forEach((o) => (c[o.status] += 1))
    return c
  }, [orders])
  const total = Object.values(counts).reduce((a, b) => a + b, 0) - 2

  const list = orders.filter((o) => {
    const c = customers.find((x) => x.id === o.customerId)
    const hay = `${o.id} ${c?.name} ${t(c?.name ?? '')} ${c?.phone}`.toLowerCase()
    return (filter === 'All' || o.status === filter) && hay.includes(q.toLowerCase())
  })
  const days = [...new Set(list.map((o) => o.day))]

  return (
    <Screen>
      <StatusSpacer />
      <TitleBar title={t('Orders')} right={<CircleButton icon="plus" label={t('New order')} variant="brand" onClick={() => push({ name: 'newOrderCustomer' }, 'up')} />} />
      <div className="space-y-3 px-5 pb-3">
        <SearchField value={q} onChange={setQ} placeholder={t('Search orders, customers, phone')} />
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {(['All', 'New', 'Confirmed', 'Processing', 'Shipped'] as const).map((s) => (
            <Chip key={s} selected={filter === s} onClick={() => setFilter(s)}>
              <span className="whitespace-nowrap">
                {t(s)} {s === 'All' ? total : counts[s]}
              </span>
            </Chip>
          ))}
        </div>
      </div>
      <Scroll className="space-y-2.5">
        {days.map((d) => (
          <div key={d} className="space-y-2.5">
            <SectionLabel>{t(d)}</SectionLabel>
            {list
              .filter((o) => o.day === d)
              .map((o) => {
                const c = customers.find((x) => x.id === o.customerId)!
                return (
                  <Card key={o.id} onClick={() => push({ name: 'orderDetails', id: o.id })} className="anim-rise flex items-center gap-3 p-3.5">
                    <Avatar name={t(c.name)} size={38} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{t(c.name)}</span>
                      <span className="block truncate text-xs text-ink-2">
                        #{o.id} · {t(o.channel)}
                        {o.day === 'Today' ? ` · ${o.time}` : ''}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold">{jd(orderTotals(o, products).total)}</span>
                      <StatusBadge status={o.status} />
                    </span>
                  </Card>
                )
              })}
          </div>
        ))}
        {list.length === 0 && <p className="pt-10 text-center text-sm text-ink-2">{t('No orders match your search')}</p>}
      </Scroll>
      <TabBar active="orders" />
    </Screen>
  )
}

// ------------------------------------------------------------------
// M6 · Order details
// ------------------------------------------------------------------

const flow: OrderStatus[] = ['New', 'Confirmed', 'Processing', 'Shipped', 'Delivered']

export function OrderDetails({ id }: { id: string }) {
  const { orders, customers, products, setOrderStatus, reset, showToast, messages } = useStore()
  const [wa, setWa] = useState(false)
  const order = orders.find((o) => o.id === id)
  if (!order) return null
  const c = customers.find((x) => x.id === order.customerId)!
  const { total } = orderTotals(order, products)
  const next = flow[flow.indexOf(order.status) + 1]
  const justSaved = order.time === '12:52'
  const payTone = order.payment === 'Paid' ? 'success' : order.payment === 'Unpaid' ? 'error' : 'coral'

  return (
    <Screen>
      <StatusSpacer />
      <TopBar title={t('Order details')} right={<CircleButton icon="more" label={t('More actions')} />} />
      <Scroll className="space-y-3 pt-5">
        <div className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent-soft text-coral">
            <Icon name="bag" size={28} />
          </span>
          <h1 className="mt-3 font-display text-2xl font-semibold">{t('Order #{id}', { id: order.id })}</h1>
          <p className="text-xs text-ink-2">{justSaved ? t('Saved just now · Today, 12:52') : `${t(order.day)}${getLang() === 'ar' ? '،' : ','} ${order.time}`}</p>
          <WhatsAppButton size="md" className="mt-3" onClick={() => setWa(true)} />
        </div>
        <Card className="px-4 py-3">
          <div className="flex items-center gap-3 border-b border-line pb-3">
            <Avatar name={t(c.name)} size={40} />
            <span className="flex-1">
              <span className="block text-sm font-semibold">{t(c.name)}</span>
              <span className="block text-xs text-ink-2">
                {c.phone} · {t(order.channel)}
              </span>
            </span>
            <button type="button" aria-label={t('Message customer')} onClick={() => setWa(true)} className="grid size-10 place-items-center rounded-full bg-success-soft text-success">
              <Icon name="whatsapp" size={18} />
            </button>
          </div>
          <div className="space-y-2 pt-3 text-sm">
            {order.lines.map((l) => {
              const p = products.find((x) => x.id === l.productId)!
              return (
                <div key={l.productId} className="flex justify-between">
                  <span className="text-ink-2">
                    {l.qty} × {t(p.name)}
                  </span>
                  <span className="font-medium">{jd(p.price * l.qty)}</span>
                </div>
              )
            })}
            {order.deliveryFee - order.discount !== 0 && (
              <div className="flex justify-between">
                <span className="text-ink-2">{t('Delivery − discount')}</span>
                <span className="font-medium">{jd(order.deliveryFee - order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 font-bold">
              <span>{t('Total amount')}</span>
              <span className="text-coral">{jd(total)}</span>
            </div>
          </div>
        </Card>
        {[
          ['Status', <span key={order.status} className="anim-pop-in"><StatusBadge status={order.status} /></span>],
          ['Payment', <Pill tone={payTone}>{t(order.payment)}</Pill>],
          [
            'Delivery',
            <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-accent-soft px-2.5 text-xs font-semibold text-coral">
              <Icon name="calendar" size={13} />
              {tParts(order.delivery)}
            </span>,
          ],
        ].map(([label, value]) => (
          <div key={label as string} className="flex h-13 items-center justify-between rounded-[20px] bg-canvas px-4">
            <span className="text-sm font-medium">{t(label as string)}</span>
            {value}
          </div>
        ))}
        <LastMessage messages={messages} orderId={order.id} />
      </Scroll>
      <Footer>
        <Button
          icon="check"
          className="w-full"
          disabled={!next}
          onClick={() => {
            if (!next) return
            setOrderStatus(order.id, next)
            showToast(t('Order #{id} marked as {status}', { id: order.id, status: t(next) }))
          }}
        >
          {next ? t('Mark as {status}', { status: t(next) }) : t('Delivered')}
        </Button>
        <Button variant="secondary" icon="home" className="w-full" onClick={() => reset({ name: 'home' }, 'pop')}>
          {t('Back to home')}
        </Button>
      </Footer>
      {wa && <WhatsAppSheet customerId={c.id} orderId={order.id} onClose={() => setWa(false)} />}
    </Screen>
  )
}
