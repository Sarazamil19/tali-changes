// Desktop: Orders (table + details drawer), Products, Customers
import { useMemo, useState } from 'react'
import { useStore } from '../app/store'
import { jd, jd0, orderTotals, type OrderStatus } from '../app/data'
import { getLang, t, tParts } from '../app/i18n'
import { Icon } from '../components/Icon'
import { Avatar, Button, Pill, SearchField, Segmented, StatusBadge, UnderlineTabs, cx } from '../components/ui'
import { Bar, Drawer, PageTitle, Panel, Td, Th } from './kit'
import type { WebNav } from './WebApp'

const flow: OrderStatus[] = ['New', 'Confirmed', 'Processing', 'Shipped', 'Delivered']

// ------------------------------------------------------------------
// Orders
// ------------------------------------------------------------------
export function OrdersPage({ nav, openId }: { nav: WebNav; openId?: string }) {
  const { orders, customers, products } = useStore()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<OrderStatus | 'All'>('All')
  const [open, setOpen] = useState<string | undefined>(openId)

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: orders.length }
    orders.forEach((o) => (c[o.status] = (c[o.status] ?? 0) + 1))
    return c
  }, [orders])

  const list = orders.filter((o) => {
    const c = customers.find((x) => x.id === o.customerId)
    const hay = `${o.id} ${c?.name} ${t(c?.name ?? '')} ${c?.phone}`.toLowerCase()
    return (filter === 'All' || o.status === filter) && hay.includes(q.toLowerCase())
  })

  return (
    <>
      <PageTitle
        title={t('Orders')}
        subtitle={t('{n} orders this month · {k} new', { n: orders.length + 131, k: counts.New ?? 0 })}
        actions={
          <Button icon="plus" size="md" onClick={() => nav.open('order')}>
            {t('Add new order')}
          </Button>
        }
      />
      <Panel>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <UnderlineTabs
            items={(['All', ...flow] as const).map((s) => ({ value: s, label: `${t(s)} · ${counts[s] ?? 0}` }))}
            value={filter}
            onChange={setFilter}
          />
          <div className="w-72">
            <SearchField value={q} onChange={setQ} placeholder={t('Search orders, customers, phone')} />
          </div>
        </div>
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <Th>{t('Order')}</Th>
              <Th>{t('Customer')}</Th>
              <Th>{t('Date')}</Th>
              <Th>{t('Channel')}</Th>
              <Th>{t('Delivery')}</Th>
              <Th>{t('Total')}</Th>
              <Th>{t('Payment')}</Th>
              <Th>{t('Status')}</Th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => {
              const c = customers.find((x) => x.id === o.customerId)!
              return (
                <tr
                  key={o.id}
                  onClick={() => setOpen(o.id)}
                  className={cx('cursor-pointer transition hover:bg-subtle', open === o.id && 'bg-brand-soft/60')}
                >
                  <Td className="font-semibold">#{o.id}</Td>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={t(c.name)} size={30} />
                      <span>
                        <span className="block font-medium">{t(c.name)}</span>
                        <span className="block text-xs text-ink-2">{c.phone}</span>
                      </span>
                    </span>
                  </Td>
                  <Td className="text-ink-2">
                    {t(o.day)}
                    {o.day === 'Today' || o.day === 'Yesterday' ? ` · ${o.time}` : ''}
                  </Td>
                  <Td className="text-ink-2">{t(o.channel)}</Td>
                  <Td className="text-ink-2">{tParts(o.delivery)}</Td>
                  <Td className="font-semibold">{jd(orderTotals(o, products).total)}</Td>
                  <Td className={o.payment === 'Paid' ? 'text-ink-2' : 'text-burgundy'}>{t(o.payment)}</Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {list.length === 0 && <p className="py-12 text-center text-sm text-ink-2">{t('No orders match your search')}</p>}
      </Panel>
      {open && <OrderDrawer id={open} onClose={() => setOpen(undefined)} />}
    </>
  )
}

export function OrderDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { orders, customers, products, setOrderStatus, showToast } = useStore()
  const o = orders.find((x) => x.id === id)
  if (!o) return null
  const c = customers.find((x) => x.id === o.customerId)!
  const { total } = orderTotals(o, products)
  const next = flow[flow.indexOf(o.status) + 1]
  const step = flow.indexOf(o.status)
  return (
    <Drawer onClose={onClose}>
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <div className="text-xs text-ink-2">{t('Order details')}</div>
          <div className="font-display text-xl font-semibold">#{o.id}</div>
        </div>
        <button type="button" aria-label={t('Close')} onClick={onClose} className="grid size-9 place-items-center rounded-full bg-white shadow-soft">
          <Icon name="x" size={18} />
        </button>
      </div>
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="rounded-2xl bg-white p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <Avatar name={t(c.name)} size={42} />
            <span className="flex-1">
              <span className="block font-semibold">{t(c.name)}</span>
              <span className="block text-xs text-ink-2">
                {c.phone} · {t(c.area)}
              </span>
            </span>
            <button type="button" aria-label={t('Message customer')} className="grid size-10 place-items-center rounded-full bg-brand-soft text-plum">
              <Icon name="message" size={18} />
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-soft">
          <div className="mb-3 text-xs font-semibold text-ink-2 uppercase">{t('Progress')}</div>
          <div className="flex items-center gap-1.5">
            {flow.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={cx('h-1.5 rounded-full transition-colors duration-500', i <= step ? 'bg-coral' : 'bg-canvas')} />
                <div className={cx('mt-1.5 text-[11px]', i === step ? 'font-semibold text-ink' : 'text-ink-2')}>{t(s)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2 rounded-2xl bg-white p-4 text-sm shadow-soft">
          {o.lines.map((l) => {
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
          {o.deliveryFee - o.discount !== 0 && (
            <div className="flex justify-between">
              <span className="text-ink-2">{t('Delivery − discount')}</span>
              <span className="font-medium">{jd(o.deliveryFee - o.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-2 font-bold">
            <span>{t('Total amount')}</span>
            <span className="text-coral">{jd(total)}</span>
          </div>
        </div>
        {[
          ['Channel', t(o.channel)],
          ['Payment', t(o.payment)],
          ['Delivery', tParts(o.delivery)],
        ].map(([l, v]) => (
          <div key={l} className="flex items-center justify-between rounded-2xl bg-canvas px-4 py-3 text-sm">
            <span className="font-medium">{t(l)}</span>
            <span className="font-semibold">{v}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t border-line px-6 py-4">
        <Button
          icon="check"
          className="w-full"
          disabled={!next}
          onClick={() => {
            if (!next) return
            setOrderStatus(o.id, next)
            showToast(t('Order #{id} marked as {status}', { id: o.id, status: t(next) }))
          }}
        >
          {next ? t('Mark as {status}', { status: t(next) }) : t('Delivered')}
        </Button>
      </div>
    </Drawer>
  )
}

// ------------------------------------------------------------------
// Products
// ------------------------------------------------------------------
export function ProductsPage({ nav }: { nav: WebNav }) {
  const { products, addTask, showToast } = useStore()
  const [view, setView] = useState<'all' | 'inventory'>('all')
  const [q, setQ] = useState('')
  const list = products
    .filter((p) => (p.name + t(p.name)).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (view === 'inventory' ? a.stock / a.alertAt - b.stock / b.alertAt : 0))
  const low = products.filter((p) => p.stock <= p.alertAt)
  const value = products.reduce((s, p) => s + p.stock * p.cost, 0)

  return (
    <>
      <PageTitle
        title={t('Products')}
        subtitle={t('{n} products · stock worth {v} at cost', { n: products.length, v: jd0(value) })}
        actions={
          <Button icon="plus" size="md" onClick={() => nav.open('product')}>
            {t('Add product')}
          </Button>
        }
      />
      {low.length > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-accent-soft px-5 py-3.5">
          <Icon name="alert" size={20} className="text-coral" />
          <span className="flex-1 text-sm">
            <span className="font-semibold">{t('{n} products are running low', { n: low.length })}</span>
            <span className="text-ink-2"> · {low.map((p) => t(p.name)).join(getLang() === 'ar' ? '، ' : ', ')}</span>
          </span>
          <Button
            size="sm"
            variant="accent"
            onClick={() => {
              low.forEach((p) => addTask({ title: `Restock: ${p.name}`, meta: 'Suggested from low stock', time: '1:00 PM', when: 'today', state: 'todo', kind: 'reminder' }))
              showToast(t('{n} restock tasks added to your Planner', { n: low.length }))
            }}
          >
            {t('Create restock tasks')}
          </Button>
        </div>
      )}
      <Panel>
        <div className="mb-5 flex items-center justify-between gap-4">
          <Segmented
            className="w-80"
            items={[
              { value: 'all', label: t('All products') },
              { value: 'inventory', label: t('Inventory') },
            ]}
            value={view}
            onChange={setView}
          />
          <div className="w-72">
            <SearchField value={q} onChange={setQ} placeholder={t('Search products')} />
          </div>
        </div>
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <Th>{t('Product')}</Th>
              <Th>{t('Selling price')}</Th>
              <Th>{t('Cost price')}</Th>
              <Th>{t('Margin')}</Th>
              <Th className="w-56">{t('In stock')}</Th>
              <Th>{t('Status')}</Th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const isLow = p.stock <= p.alertAt
              const margin = Math.round(((p.price - p.cost) / p.price) * 100)
              return (
                <tr key={p.id} className="anim-fade transition hover:bg-subtle">
                  <Td>
                    <span className="flex items-center gap-3">
                      <span className={cx('grid size-10 place-items-center rounded-xl', isLow ? 'bg-accent-soft text-coral' : 'bg-brand-soft text-plum')}>
                        <Icon name="products" size={18} />
                      </span>
                      <span className="font-semibold">{t(p.name)}</span>
                    </span>
                  </Td>
                  <Td className="font-semibold">{jd(p.price)}</Td>
                  <Td className="text-ink-2">{jd(p.cost)}</Td>
                  <Td>{margin}%</Td>
                  <Td>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className={isLow ? 'font-semibold text-coral' : ''}>{p.stock}</span>
                      <span className="text-ink-2">{t('Alert at {n}', { n: p.alertAt })}</span>
                    </div>
                    <Bar value={p.stock} max={40} color={isLow ? 'bg-coral' : 'bg-plum'} />
                  </Td>
                  <Td>{isLow ? <Pill tone="coral">{t('Low stock')}</Pill> : <Pill tone="success">{t('In stock')}</Pill>}</Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------
// Customers
// ------------------------------------------------------------------
export function CustomersPage({ nav }: { nav: WebNav }) {
  const { customers, orders, products, showToast } = useStore()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState('c1')
  const list = customers.filter((c) => (c.name + t(c.name) + c.phone).toLowerCase().includes(q.toLowerCase()))
  const c = customers.find((x) => x.id === sel) ?? customers[0]
  const history = orders.filter((o) => o.customerId === c.id)

  return (
    <>
      <PageTitle
        title={t('Customers')}
        subtitle={t('{n} customers · sorted by recent', { n: customers.length + 81 })}
        actions={
          <Button icon="plus" size="md" onClick={() => showToast(t('New customer form — coming next'))}>
            {t('Add customer')}
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Panel>
          <div className="mb-5 w-80">
            <SearchField value={q} onChange={setQ} placeholder={t('Search name or phone')} />
          </div>
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <Th>{t('Customer')}</Th>
                <Th>{t('Area')}</Th>
                <Th>{t('Channel')}</Th>
                <Th>{t('Orders')}</Th>
                <Th>{t('Total spent')}</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id} onClick={() => setSel(x.id)} className={cx('cursor-pointer transition hover:bg-subtle', sel === x.id && 'bg-brand-soft/60')}>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={t(x.name)} size={32} />
                      <span>
                        <span className="block font-medium">{t(x.name)}</span>
                        <span className="block text-xs text-ink-2">{x.phone}</span>
                      </span>
                    </span>
                  </Td>
                  <Td className="text-ink-2">{t(x.area)}</Td>
                  <Td className="text-ink-2">{t(x.channel)}</Td>
                  <Td>{x.orders}</Td>
                  <Td className="font-semibold">{jd0(Math.round(x.spent))}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel className="h-fit">
          <div key={c.id} className="anim-fade">
            <div className="text-center">
              <span className="mx-auto block w-fit">
                <Avatar name={t(c.name)} size={72} />
              </span>
              <h2 className="mt-3 font-display text-xl font-semibold">{t(c.name)}</h2>
              <p className="text-xs text-ink-2">
                {c.phone} · {t(c.area)}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" icon="message" size="md" onClick={() => showToast(t('Opening WhatsApp chat with {name}', { name: t(c.name.split(' ')[0]) }))}>
                {t('WhatsApp')}
              </Button>
              <Button variant="secondary" icon="phone" size="md" onClick={() => showToast(t('Calling {phone}', { phone: c.phone }))}>
                {t('Call')}
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ['Orders', String(c.orders)],
                ['Total spent', jd0(Math.round(c.spent))],
                ['Last order', t(history[0]?.day ?? '—')],
              ].map(([l, v]) => (
                <div key={l} className="rounded-2xl bg-subtle p-3">
                  <div className="text-[11px] text-ink-2">{t(l)}</div>
                  <div className="mt-0.5 font-display font-bold">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 mb-2 text-sm font-semibold">{t('Order history')}</div>
            <div className="space-y-2">
              {history.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => nav.go('orders', o.id)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-subtle p-3 text-start transition hover:bg-canvas"
                >
                  <Icon name="bag" size={18} className="text-coral" />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">#{o.id}</span>
                    <span className="block text-xs text-ink-2">
                      {t(o.day)} · {t(o.channel)}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold">{jd(orderTotals(o, products).total)}</span>
                    <StatusBadge status={o.status} />
                  </span>
                </button>
              ))}
              {history.length === 0 && <p className="text-sm text-ink-2">{t('No orders yet.')}</p>}
            </div>
            <Button icon="plus" className="mt-5 w-full" onClick={() => nav.open('order', c.id)}>
              {t('New order for {name}', { name: t(c.name.split(' ')[0]) })}
            </Button>
          </div>
        </Panel>
      </div>
    </>
  )
}
