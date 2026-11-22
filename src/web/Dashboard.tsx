import { useStore } from '../app/store'
import { jd, jd0, orderTotals } from '../app/data'
import { t } from '../app/i18n'
import { Icon } from '../components/Icon'
import { Avatar, Button, Pill, StatusBadge, cx } from '../components/ui'
import { AgendaItem } from '../screens/Home'
import { Bar, Donut, KpiCard, PageTitle, Panel, PanelHeader, Td, Th } from './kit'
import type { WebNav } from './WebApp'

const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
const sales = [2600, 2900, 3150, 3400, 3820, 4280]
const profit = [900, 1000, 1120, 1250, 1380, 1605]

function SalesChart() {
  const W = 620
  const H = 210
  const x = (i: number) => 40 + (i * (W - 60)) / 5
  const y = (v: number) => 10 + (1 - v / 5000) * (H - 30)
  const line = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ')
  return (
    <div dir="ltr">
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full">
        <defs>
          <linearGradient id="web-sales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6B163C" stopOpacity="0.16" />
            <stop offset="1" stopColor="#6B163C" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1000, 2000, 3000, 4000, 5000].map((v) => (
          <g key={v}>
            <line x1="40" x2={W - 20} y1={y(v)} y2={y(v)} stroke="#e8e1dc" strokeDasharray={v ? '3 5' : undefined} />
            <text x="0" y={y(v) + 4} fontSize="10" fill="#817674">
              {v ? `${v / 1000}k` : '0'}
            </text>
          </g>
        ))}
        <path d={`${line(sales)} L${x(5)} ${y(0)} L${x(0)} ${y(0)} Z`} fill="url(#web-sales)" />
        <path d={line(sales)} fill="none" stroke="#6B163C" strokeWidth="2.5" strokeLinecap="round" />
        <path d={line(profit)} fill="none" stroke="#E46D50" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={x(5)} x2={x(5)} y1="8" y2={y(0)} stroke="#E46D50" strokeDasharray="3 4" />
        <circle cx={x(5)} cy={y(4280)} r="5" fill="#fff" stroke="#6B163C" strokeWidth="2.5" />
        <circle cx={x(5)} cy={y(1605)} r="5" fill="#fff" stroke="#E46D50" strokeWidth="2.5" />
        {months.map((m, i) => (
          <text key={m} x={x(i)} y={H + 18} fontSize="11" fill="#817674" textAnchor="middle" fontWeight={i === 5 ? 600 : 400}>
            {t(m)}
          </text>
        ))}
      </svg>
    </div>
  )
}

export function Dashboard({ nav }: { nav: WebNav }) {
  const { orders, customers, products, tasks, toggleTask, addTask, showToast } = useStore()
  const today = tasks.filter((x) => x.when === 'today')
  const done = today.filter((x) => x.state === 'done').length
  const low = products.filter((p) => p.stock <= p.alertAt)
  const best = [
    { id: 'p1', sold: 64, share: 38, total: 896 },
    { id: 'p3', sold: 41, share: 24, total: 574 },
    { id: 'p2', sold: 52, share: 20, total: 468 },
    { id: 'p5', sold: 18, share: 19, total: 450 },
  ]
  const barColors = ['bg-plum', 'bg-coral', 'bg-blush', 'bg-brand-soft']

  return (
    <div className="space-y-6">
      <PageTitle
        kicker={
          <div className="mb-1 flex items-center gap-2 text-sm text-ink-2">
            {t('Good afternoon, Layla')} <Pill tone="coral" dot={false}>{t('Sample data')}</Pill>
          </div>
        }
        title={
          <>
            {t('Sales are up')} <span className="text-coral">12%</span> {t('this month')}
          </>
        }
        subtitle={t('Layla’s Candles · 1–22 November 2026')}
        actions={
          <>
            <Pill tone="neutral" dot={false}>{t('This month')}</Pill>
            <Button variant="secondary" icon="products" size="md" onClick={() => nav.open('product')}>
              {t('Add product')}
            </Button>
            <Button icon="plus" size="md" onClick={() => nav.open('order')}>
              {t('Add new order')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard hero icon="receipt" label={t('Total sales')} value={jd0(4280)} delta="12%" foot={t('vs October')} />
        <KpiCard icon="orders" label={t('Orders')} value={String(orders.length + 131)} delta="8%" foot={t('vs October')} />
        <KpiCard icon="wallet" label={t('Expenses')} value={jd0(1135)} delta="3%" foot={t('vs October')} up={false} />
        <KpiCard icon="coins" label={t('Net profit')} value={jd0(1605)} delta="18%" foot={t('37% of sales')} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Panel>
          <PanelHeader
            title={t('Sales & profit')}
            subtitle={t('Monthly sales vs net profit · Jun–Nov')}
            right={
              <span className="flex gap-4 text-xs text-ink-2">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-plum" />
                  {t('Sales')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-coral" />
                  {t('Net profit')}
                </span>
              </span>
            }
          />
          <div className="mb-2 flex items-center gap-3">
            <span className="font-display text-2xl font-bold">{jd0(20250)}</span>
            <Pill tone="success" dot={false}>▲ {t('12% vs Oct')}</Pill>
            <span className="text-xs text-ink-2">{t('total sales in 6 months')}</span>
          </div>
          <SalesChart />
        </Panel>
        <Panel>
          <PanelHeader title={t('Where your sales went')} right={<Pill tone="neutral" dot={false}>{t('Nov')}</Pill>} />
          <Donut
            parts={[
              { value: 36, color: '#6B163C' },
              { value: 27, color: '#E8C5BD' },
              { value: 37, color: '#E46D50' },
            ]}
            center={jd0(4280)}
            sub={t('total sales')}
          />
          <div className="mt-5 space-y-2.5 text-sm">
            {[
              ['bg-plum', 'Product costs', '36%', 1540],
              ['bg-blush', 'Expenses', '27%', 1135],
              ['bg-coral', 'Net profit', '37%', 1605],
            ].map(([c, l, p, v]) => (
              <div key={l as string} className="flex items-center gap-2.5">
                <span className={cx('size-2.5 rounded-full', c as string)} />
                <span className="flex-1">{t(l as string)}</span>
                <span className="text-xs text-ink-2">{p}</span>
                <span className="w-20 text-end font-semibold">{jd0(v as number)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-accent-soft px-3 py-2.5 text-xs font-medium text-burgundy">
            <Icon name="sparkle" size={15} className="text-coral" />
            {t('You keep about JD 37 of every JD 100 you sell.')}
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title={t('Recent orders')}
          subtitle={t('{n} orders this month · {k} new', { n: orders.length + 131, k: orders.filter((o) => o.status === 'New').length })}
          right={
            <button type="button" onClick={() => nav.go('orders')} className="flex items-center gap-1 text-sm font-semibold text-burgundy">
              {t('View all')} <Icon name="arrowRight" size={16} />
            </button>
          }
        />
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <Th>{t('Order')}</Th>
              <Th>{t('Customer')}</Th>
              <Th className="hidden md:table-cell">{t('Channel')}</Th>
              <Th>{t('Total')}</Th>
              <Th className="hidden md:table-cell">{t('Payment')}</Th>
              <Th>{t('Status')}</Th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 5).map((o) => {
              const c = customers.find((x) => x.id === o.customerId)!
              return (
                <tr key={o.id} onClick={() => nav.go('orders', o.id)} className="anim-fade cursor-pointer transition hover:bg-subtle">
                  <Td className="font-semibold whitespace-nowrap">#{o.id}</Td>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <span className="hidden sm:inline-flex">
                        <Avatar name={t(c.name)} size={30} />
                      </span>
                      {t(c.name)}
                    </span>
                  </Td>
                  <Td className="hidden md:table-cell text-ink-2">{t(o.channel)}</Td>
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
      </Panel>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Panel className="flex flex-col">
          <PanelHeader
            title={t('Today')}
            subtitle={t('Sunday, 22 November')}
            right={
              <button type="button" onClick={() => nav.go('planner')} className="text-sm font-semibold text-burgundy">
                {t('Planner →')}
              </button>
            }
          />
          <div className="space-y-2">
            {today
              .filter((x) => x.state !== 'done')
              .slice(0, 4)
              .map((x) => (
                <AgendaItem
                  key={x.id}
                  icon={x.kind === 'delivery' ? 'truck' : x.kind === 'reminder' ? 'alarm' : 'tasks'}
                  tone={x.kind === 'delivery' ? 'plum' : 'coral'}
                  title={x.title}
                  meta={x.meta}
                  time={x.time}
                  onClick={() => toggleTask(x.id)}
                />
              ))}
          </div>
          <div className="mt-auto pt-4">
            <div className="mb-1.5 flex justify-between text-xs text-ink-2">
              <span>{t('Tasks done today')}</span>
              <span className="font-semibold text-ink">
                {done} / {today.length}
              </span>
            </div>
            <Bar value={done} max={Math.max(1, today.length)} color="bg-coral" />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title={t('Best-selling products')} right={<Pill tone="neutral" dot={false}>{t('This month')}</Pill>} />
          <div className="mb-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold">{jd0(2388)}</span>
            <span className="text-xs text-ink-2">{t('from your top 4 products')}</span>
          </div>
          <div className="mb-4 flex h-2 gap-1 overflow-hidden rounded-full">
            {best.map((b, i) => (
              <span key={b.id} className={barColors[i]} style={{ width: `${b.share}%` }} />
            ))}
          </div>
          <div className="space-y-3">
            {best.map((b, i) => {
              const p = products.find((x) => x.id === b.id)!
              return (
                <div key={b.id} className="flex items-center gap-3">
                  <span className={cx('size-2 rounded-full', barColors[i])} />
                  <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-coral">
                    <Icon name="products" size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{t(p.name)}</span>
                    <span className="block text-xs text-ink-2">{t('{n} sold · {s}%', { n: b.sold, s: b.share })}</span>
                  </span>
                  <span className="text-sm font-semibold">{jd0(b.total)}</span>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader title={t('Low stock')} subtitle={t('Below your alert level')} right={<Pill tone="coral" dot={false}>{t('{n} items', { n: low.length })}</Pill>} />
          <div className="space-y-4">
            {low.map((p) => (
              <div key={p.id}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-semibold">{t(p.name)}</span>
                  <span className="font-semibold text-coral">{t('{n} left', { n: p.stock })}</span>
                </div>
                <Bar value={p.stock} max={p.alertAt} color="bg-coral" />
                <div className="mt-1 text-[11px] text-ink-2">{t('Alert at {n}', { n: p.alertAt })}</div>
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            icon="tasks"
            size="md"
            className="mt-auto w-full"
            onClick={() => {
              low.forEach((p) => addTask({ title: `Restock: ${p.name}`, meta: 'Suggested from low stock', time: '1:00 PM', when: 'today', state: 'todo', kind: 'reminder' }))
              showToast(t('{n} restock tasks added to your Planner', { n: low.length }))
            }}
          >
            {t('Create restock tasks')}
          </Button>
        </Panel>
      </div>
    </div>
  )
}
