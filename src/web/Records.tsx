// Desktop: Orders (table + details drawer), Products, Customers
import { useMemo, useState } from 'react'
import { useStore } from '../app/store'
import { jd, jd0, orderTotals, type OrderStatus } from '../app/data'
import { getLang, t, tParts } from '../app/i18n'
import { Icon } from '../components/Icon'
import { Avatar, Button, Pill, SearchField, Segmented, StatusBadge, UnderlineTabs, cx } from '../components/ui'
import { Bar, Drawer, Modal, PageTitle, Panel, Td, Th } from './kit'
import { LastMessage, WhatsAppButton, WhatsAppComposer, waGreen } from '../components/WhatsApp'
import { NewCustomerForm, StatusPicker } from '../components/Sheets'
import type { WebNav } from './WebApp'
import { CampaignComposer, CoachPill, GroupChips, GroupTags } from '../components/Growth'
import { coachCounts, groupInfo, inGroup, lastOrderText, type Group } from '../app/growth'

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
          <div className="no-scrollbar -mx-1 max-w-full overflow-x-auto px-1">
          <UnderlineTabs
            items={(['All', ...flow] as const).map((s) => ({ value: s, label: `${t(s)} · ${counts[s] ?? 0}` }))}
            value={filter}
            onChange={setFilter}
          />
          </div>
          <div className="w-full sm:w-72">
            <SearchField value={q} onChange={setQ} placeholder={t('Search orders, customers, phone')} />
          </div>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <Th>{t('Order')}</Th>
              <Th>{t('Customer')}</Th>
              <Th className="hidden md:table-cell">{t('Date')}</Th>
              <Th className="hidden md:table-cell">{t('Channel')}</Th>
              <Th className="hidden md:table-cell">{t('Delivery')}</Th>
              <Th>{t('Total')}</Th>
              <Th className="hidden md:table-cell">{t('Payment')}</Th>
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
                  <Td className="font-semibold whitespace-nowrap">#{o.id}</Td>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <span className="hidden sm:inline-flex">
                        <Avatar name={t(c.name)} size={30} />
                      </span>
                      <span>
                        <span className="block font-medium">{t(c.name)}</span>
                        <span className="hidden text-xs text-ink-2 sm:block">{c.phone}</span>
                      </span>
                    </span>
                  </Td>
                  <Td className="hidden md:table-cell text-ink-2">
                    {t(o.day)}
                    {o.day === 'Today' || o.day === 'Yesterday' ? ` · ${o.time}` : ''}
                  </Td>
                  <Td className="hidden md:table-cell text-ink-2">{t(o.channel)}</Td>
                  <Td className="hidden md:table-cell text-ink-2">{tParts(o.delivery)}</Td>
                  <Td className="font-semibold whitespace-nowrap">{jd(orderTotals(o, products).total)}</Td>
                  <Td className={cx('hidden md:table-cell', o.payment === 'Paid' ? 'text-ink-2' : 'text-burgundy')}>{t(o.payment)}</Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
        {list.length === 0 && <p className="py-12 text-center text-sm text-ink-2">{t('No orders match your search')}</p>}
      </Panel>
      {open && <OrderDrawer id={open} onClose={() => setOpen(undefined)} />}
    </>
  )
}

export function OrderDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { orders, customers, products, messages } = useStore()
  const [wa, setWa] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const o = orders.find((x) => x.id === id)
  if (!o) return null
  const c = customers.find((x) => x.id === o.customerId)!
  const { total } = orderTotals(o, products)
  const step = flow.indexOf(o.status)
  return (
    <>
    <Drawer onClose={() => !wa && !statusOpen && onClose()}>
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
            <button type="button" aria-label={t('Message customer')} onClick={() => setWa(true)} className="grid size-10 place-items-center rounded-full bg-success-soft text-success">
              <Icon name="whatsapp" size={18} />
            </button>
          </div>
        </div>
        <button type="button" onClick={() => setStatusOpen(true)} className="block w-full rounded-2xl bg-white p-4 text-start shadow-soft transition hover:ring-1 hover:ring-blush">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold text-ink-2 uppercase">
            {t('Progress')}
            <StatusBadge status={o.status} />
          </div>
          <div className="flex items-center gap-1.5">
            {flow.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={cx('h-1.5 rounded-full transition-colors duration-500', i <= step ? 'bg-coral' : 'bg-canvas')} />
                <div className={cx('mt-1.5 text-[11px]', i === step ? 'font-semibold text-ink' : 'text-ink-2')}>{t(s)}</div>
              </div>
            ))}
          </div>
        </button>
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
        <LastMessage messages={messages} orderId={o.id} />
        <WhatsAppButton className="w-full" onClick={() => setWa(true)} />
        <Button icon="tasks" className="w-full" onClick={() => setStatusOpen(true)}>
          {t('Change status')}
        </Button>
      </div>
    </Drawer>
    {statusOpen && (
      <Modal title={t('Order status')} onClose={() => setStatusOpen(false)}>
        <StatusPicker orderId={o.id} onDone={() => setStatusOpen(false)} />
      </Modal>
    )}
    {wa && (
      <Modal title={t('Message on WhatsApp')} onClose={() => setWa(false)}>
        <WhatsAppComposer customerId={c.id} orderId={o.id} onDone={() => setWa(false)} />
      </Modal>
    )}
    </>
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
  const coach = coachCounts(products)

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
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl bg-accent-soft px-4 py-3.5 sm:px-5">
          <Icon name="alert" size={20} className="text-coral" />
          <span className="min-w-0 flex-1 text-sm">
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
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            ['⭐', 'Star', coach.star, 'Sells a lot, good profit'],
            ['💎', 'Hidden gem', coach.gem, 'Good profit, few sales'],
            ['⚠️', 'Underpriced', coach.underpriced, 'Sells fast, low margin'],
            ['🐢', 'Slow mover', coach.slow, 'Few sales, lower profit'],
          ] as [string, string, number, string][]
        ).map(([e, l, n, h]) => (
          <div key={l} className="rounded-2xl bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                <span aria-hidden="true">{e}</span> {t(l)}
              </span>
              <span className="font-display text-xl font-bold">{n}</span>
            </div>
            <div className="mt-1 text-xs text-ink-2">{t(h)}</div>
          </div>
        ))}
      </div>
      <Panel>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <Segmented
            className="w-full sm:w-80"
            items={[
              { value: 'all', label: t('All products') },
              { value: 'inventory', label: t('Inventory') },
            ]}
            value={view}
            onChange={setView}
          />
          <div className="w-full sm:w-72">
            <SearchField value={q} onChange={setQ} placeholder={t('Search products')} />
          </div>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <Th>{t('Product')}</Th>
              <Th>{t('Selling price')}</Th>
              <Th className="hidden md:table-cell">{t('Cost price')}</Th>
              <Th className="hidden md:table-cell">{t('Margin')}</Th>
              <Th className="md:w-56">{t('In stock')}</Th>
              <Th className="hidden sm:table-cell">{t('Coach')}</Th>
              <Th className="hidden lg:table-cell">{t('Status')}</Th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const isLow = p.stock <= p.alertAt
              const margin = Math.round(((p.price - p.cost) / p.price) * 100)
              return (
                <tr key={p.id} onClick={() => nav.open('product', p.id)} className="anim-fade cursor-pointer transition hover:bg-subtle">
                  <Td>
                    <span className="flex items-center gap-3">
                      <span className={cx('hidden size-10 sm:grid place-items-center rounded-xl', isLow ? 'bg-accent-soft text-coral' : 'bg-brand-soft text-plum')}>
                        <Icon name="products" size={18} />
                      </span>
                      <span className="font-semibold">{t(p.name)}</span>
                    </span>
                  </Td>
                  <Td className="font-semibold whitespace-nowrap">{jd(p.price)}</Td>
                  <Td className="hidden md:table-cell text-ink-2">{jd(p.cost)}</Td>
                  <Td className="hidden md:table-cell">{margin}%</Td>
                  <Td>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className={isLow ? 'font-semibold text-coral' : ''}>{p.stock}</span>
                      <span className="hidden text-ink-2 sm:inline">{t('Alert at {n}', { n: p.alertAt })}</span>
                    </div>
                    <Bar value={p.stock} max={40} color={isLow ? 'bg-coral' : 'bg-plum'} />
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <CoachPill product={p} />
                  </Td>
                  <Td className="hidden lg:table-cell">{isLow ? <Pill tone="coral">{t('Low stock')}</Pill> : <Pill tone="success">{t('In stock')}</Pill>}</Td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------
// Customers
// ------------------------------------------------------------------
export function CustomersPage({ nav }: { nav: WebNav }) {
  const { customers, orders, products, showToast, messages } = useStore()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState('c1')
  const [wa, setWa] = useState(false)
  const [adding, setAdding] = useState(false)
  const [group, setGroup] = useState<Group>('all')
  const [offer, setOffer] = useState(false)
  const list = customers.filter((c) => inGroup(c, group) && (c.name + t(c.name) + c.phone).toLowerCase().includes(q.toLowerCase()))
  const c = customers.find((x) => x.id === sel) ?? customers[0]
  const history = orders.filter((o) => o.customerId === c.id)

  return (
    <>
      <PageTitle
        title={t('Customers')}
        subtitle={t('{n} customers · sorted by recent', { n: customers.length + 78 })}
        actions={
          <Button icon="plus" size="md" onClick={() => setAdding(true)}>
            {t('Add customer')}
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <GroupChips value={group} onChange={setGroup} customers={customers} />
            <div className="w-full sm:w-72">
              <SearchField value={q} onChange={setQ} placeholder={t('Search name or phone')} />
            </div>
          </div>
          {group !== 'all' && (
            <div className="anim-fade mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-subtle px-4 py-3">
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">{t('{n} customers', { n: list.length })}</span>
                <span className="text-ink-2"> · {t(groupInfo[group].hint)}</span>
              </span>
              <button
                type="button"
                onClick={() => setOffer(true)}
                style={waGreen}
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white transition hover:brightness-95 active:scale-95"
              >
                <Icon name="whatsapp" size={16} />
                {t('Send offer to this group')}
              </button>
            </div>
          )}
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <Th>{t('Customer')}</Th>
                <Th className="hidden md:table-cell">{t('Area')}</Th>
                <Th className="hidden md:table-cell">{t('Channel')}</Th>
                <Th className="hidden md:table-cell">{t('Orders')}</Th>
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
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium">{t(x.name)}</span>
                          <GroupTags customer={x} />
                        </span>
                        <span className="block text-xs text-ink-2">{group === 'all' ? x.phone : lastOrderText(x)}</span>
                      </span>
                    </span>
                  </Td>
                  <Td className="hidden md:table-cell text-ink-2">{t(x.area)}</Td>
                  <Td className="hidden md:table-cell text-ink-2">{t(x.channel)}</Td>
                  <Td className="hidden md:table-cell">{x.orders}</Td>
                  <Td className="font-semibold">{jd0(Math.round(x.spent))}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              <button
                type="button"
                onClick={() => setWa(true)}
                style={waGreen}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition hover:brightness-95 active:scale-[0.97]"
              >
                <Icon name="whatsapp" size={18} />
                {t('WhatsApp')}
              </button>
              <Button variant="secondary" icon="phone" size="md" onClick={() => showToast(t('Calling {phone}', { phone: c.phone }))}>
                {t('Call')}
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ['Orders', String(c.orders)],
                ['Total spent', jd0(Math.round(c.spent))],
                ['Last order', history[0] ? t(history[0].day) : c.lastOrderDays ? t('{n} days ago', { n: c.lastOrderDays }) : '—'],
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
            <div className="mt-4">
              <LastMessage messages={messages} customerId={c.id} />
            </div>
            <Button icon="plus" className="mt-4 w-full" onClick={() => nav.open('order', c.id)}>
              {t('New order for {name}', { name: t(c.name.split(' ')[0]) })}
            </Button>
          </div>
        </Panel>
      </div>
      {wa && (
        <Modal title={t('Message on WhatsApp')} onClose={() => setWa(false)}>
          <WhatsAppComposer customerId={c.id} onDone={() => setWa(false)} />
        </Modal>
      )}
      {offer && (
        <Modal title={t('Send an offer')} onClose={() => setOffer(false)}>
          <CampaignComposer initialGroup={group} onDone={() => setOffer(false)} />
        </Modal>
      )}
      {adding && (
        <Modal title={t('New customer')} onClose={() => setAdding(false)}>
          <NewCustomerForm
            onSaved={(id) => {
              setAdding(false)
              setSel(id)
            }}
          />
        </Modal>
      )}
    </>
  )
}
