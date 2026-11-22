import { useState } from 'react'
import { useStore, type ChannelState } from '../app/store'
import { t, type Lang } from '../app/i18n'
import { expenses, jd, jd0, orderTotals } from '../app/data'
import { Icon, type IconName } from '../components/Icon'
import { LastMessage, WhatsAppSheet, waGreen } from '../components/WhatsApp'
import {
  Avatar,
  Button,
  Card,
  CircleButton,
  Footer,
  IconBox,
  ListRow,
  Pill,
  Screen,
  Scroll,
  SearchField,
  SectionLabel,
  Segmented,
  StatusBadge,
  StatusSpacer,
  TabBar,
  TitleBar,
  TopBar,
  cx,
  type Tone,
} from '../components/ui'

// Language switch used on More and Settings
function LangSwitch({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <span className="flex rounded-full bg-canvas p-0.5 text-xs" dir="ltr">
      {(
        [
          ['en', 'English'],
          ['ar', 'عربي'],
        ] as [Lang, string][]
      ).map(([l, label]) => (
        <span
          key={l}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            setLang(l)
          }}
          className={cx('rounded-full px-2.5 py-1 font-medium transition', lang === l ? 'bg-white text-burgundy shadow-soft' : 'text-ink-2', l === 'ar' && 'font-arabic')}
        >
          {label}
        </span>
      ))}
    </span>
  )
}

// ------------------------------------------------------------------
// M17 · More
// ------------------------------------------------------------------
export function More() {
  const { push, businessName, isGuest, openSheet, customers, tasks, lang, setLang } = useStore()
  const todayLeft = tasks.filter((t) => t.when === 'today' && t.state !== 'done').length
  const rows: [IconName, Tone, string, string | null, () => void][] = [
    ['users', 'plum', 'Customers', String(customers.length + 81), () => push({ name: 'customers' })],
    ['calendar', 'coral', 'Planner', t('{n} today', { n: todayLeft }), () => push({ name: 'planner' })],
    ['wallet', 'neutral', 'Finances', null, () => push({ name: 'finances' })],
    ['calculator', 'neutral', 'Price Calculator', null, () => push({ name: 'calculator' })],
    ['insights', 'neutral', 'Insights', null, () => push({ name: 'insights' })],
  ]
  return (
    <Screen>
      <StatusSpacer />
      <TitleBar title={t('More')} />
      <Scroll className="space-y-3">
        <div className="bg-brand-gradient flex items-center gap-3 rounded-3xl p-4 text-white shadow-raised">
          <Avatar name={t(businessName)} size={44} light />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{t(businessName)}</span>
            <span className="block text-xs text-white/70">{t(isGuest ? 'Guest · data on this phone only' : 'Account · backed up')}</span>
          </span>
          {isGuest ? (
            <button type="button" onClick={() => openSheet('backup')} className="rounded-full bg-coral px-3.5 py-1.5 text-xs font-semibold shadow-glow">
              {t('Back up')}
            </button>
          ) : (
            <Icon name="check" size={18} />
          )}
        </div>
        <Card className="px-4 py-1">
          {rows.map(([icon, tone, title, meta, fn], i) => (
            <ListRow
              key={title}
              icon={icon}
              tone={tone}
              title={t(title)}
              onClick={fn}
              last={i === rows.length - 1}
              right={meta ? <span className={cx('text-xs', tone === 'coral' ? 'font-semibold text-coral' : 'text-ink-2')}>{meta}</span> : null}
            />
          ))}
        </Card>
        <Card className="px-4 py-1">
          <ListRow icon="settings" title={t('Settings')} onClick={() => push({ name: 'settings' })} />
          <ListRow icon="globe" title={t('Language')} chevron={false} right={<LangSwitch lang={lang} setLang={setLang} />} />
          <ListRow icon="help" title={t('Help & support')} last />
        </Card>
      </Scroll>
      <TabBar active="more" />
    </Screen>
  )
}

// ------------------------------------------------------------------
// M18 · Customers
// ------------------------------------------------------------------
export function Customers() {
  const { customers, push, showToast } = useStore()
  const [q, setQ] = useState('')
  const list = customers.filter((c) => (c.name + t(c.name) + c.phone).toLowerCase().includes(q.toLowerCase()))
  return (
    <Screen>
      <StatusSpacer />
      <TopBar right={<CircleButton icon="plus" label={t('Add customer')} variant="brand" onClick={() => showToast(t('New customer form — coming next'))} />} />
      <div className="space-y-3 px-5 pt-5 pb-3">
        <h1 className="font-display text-[28px] font-bold">{t('Customers')}</h1>
        <SearchField value={q} onChange={setQ} placeholder={t('Search name or phone')} />
        <SectionLabel>{t('{n} customers · sorted by recent', { n: customers.length + 81 })}</SectionLabel>
      </div>
      <Scroll className="space-y-2">
        {list.map((c) => (
          <Card key={c.id} onClick={() => push({ name: 'customerDetails', id: c.id })} className="anim-rise flex items-center gap-3 p-3">
            <Avatar name={t(c.name)} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{t(c.name)}</span>
              <span className="block truncate text-xs text-ink-2">
                {c.phone} · {c.orders} {t(c.orders === 1 ? 'order' : 'orders')}
              </span>
            </span>
            <span className="text-end">
              <span className="block text-sm font-semibold">{jd0(Math.round(c.spent))}</span>
              <span className="block text-xs text-ink-2">{t('spent')}</span>
            </span>
          </Card>
        ))}
      </Scroll>
      <TabBar active="more" />
    </Screen>
  )
}

// ------------------------------------------------------------------
// M19 · Customer details
// ------------------------------------------------------------------
export function CustomerDetails({ id }: { id: string }) {
  const { customers, orders, products, push, startOrder, showToast, messages } = useStore()
  const [wa, setWa] = useState(false)
  const c = customers.find((x) => x.id === id)
  if (!c) return null
  const history = orders.filter((o) => o.customerId === c.id)
  return (
    <Screen>
      <StatusSpacer />
      <TopBar title={t('Customer')} right={<CircleButton icon="edit" label={t('Edit customer')} />} />
      <Scroll className="space-y-4 pt-5">
        <div className="text-center">
          <span className="mx-auto block w-fit">
            <Avatar name={t(c.name)} size={72} />
          </span>
          <h1 className="mt-3 font-display text-2xl font-semibold">{t(c.name)}</h1>
          <p className="text-xs text-ink-2">
            {c.phone} · {t(c.area)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setWa(true)}
            style={waGreen}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition active:scale-[0.97]"
          >
            <Icon name="whatsapp" size={18} />
            {t('WhatsApp')}
          </button>
          <Button variant="secondary" icon="phone" size="md" onClick={() => showToast(t('Calling {phone}', { phone: c.phone }))}>
            {t('Call')}
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['Orders', String(c.orders), false],
            ['Total spent', jd0(Math.round(c.spent)), true],
            ['Last order', t(history[0]?.day ?? '—'), false],
          ].map(([l, v, hi]) => (
            <div key={l as string} className={cx('rounded-2xl p-3', hi ? 'bg-brand-soft' : 'bg-white shadow-soft')}>
              <div className="text-xs text-ink-2">{t(l as string)}</div>
              <div className={cx('mt-0.5 font-display text-lg font-bold', hi && 'text-plum')}>{v}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="font-display text-base font-semibold">{t('Order history')}</div>
          {history.map((o) => (
            <Card key={o.id} onClick={() => push({ name: 'orderDetails', id: o.id })} className="flex items-center gap-3 p-3">
              <IconBox icon="bag" tone="coral" size={38} />
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
            </Card>
          ))}
          {history.length === 0 && <p className="text-sm text-ink-2">{t('No orders yet.')}</p>}
        </div>
        <LastMessage messages={messages} customerId={c.id} />
      </Scroll>
      <Footer>
        <Button icon="plus" className="w-full" onClick={() => startOrder(c.id)}>
          {t('New order for {name}', { name: t(c.name.split(' ')[0]) })}
        </Button>
      </Footer>
      {wa && <WhatsAppSheet customerId={c.id} onClose={() => setWa(false)} />}
    </Screen>
  )
}

// ------------------------------------------------------------------
// M16 · Finances
// ------------------------------------------------------------------
export function Finances() {
  const { showToast, canGoBack } = useStore()
  const [tab, setTab] = useState<'overview' | 'sales' | 'expenses'>('overview')
  const flow: [string, number, string, boolean][] = [
    ['Sales', 4280, 'bg-plum', false],
    ['− Product costs', 1540, 'bg-blush', false],
    ['− Expenses', 1135, 'bg-coral/70', false],
    ['= Net profit', 1605, 'bg-coral', true],
  ]
  return (
    <Screen>
      <StatusSpacer />
      {canGoBack ? (
        <TopBar title={t('Finances')} right={<Pill tone="neutral" dot={false}>{t('This month')}</Pill>} />
      ) : (
        <TitleBar title={t('Finances')} right={<Pill tone="neutral" dot={false}>{t('This month')}</Pill>} />
      )}
      <div className="px-5 pt-4 pb-3">
        <Segmented
          items={[
            { value: 'overview', label: t('Overview') },
            { value: 'sales', label: t('Sales') },
            { value: 'expenses', label: t('Expenses') },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      <Scroll className="space-y-4">
        {tab === 'overview' && (
          <Card className="anim-fade space-y-3 p-4">
            <div className="font-display text-base font-semibold">{t('How your sales became profit')}</div>
            {flow.map(([l, v, color, strong]) => (
              <div key={l}>
                <div className="flex justify-between text-xs">
                  <span className={strong ? 'font-semibold text-ink' : 'text-ink-2'}>{t(l)}</span>
                  <span className={cx('font-semibold', strong ? 'text-sm text-coral' : 'text-ink')}>{jd0(v)}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-canvas">
                  <div className={cx('anim-fade h-full rounded-full', color)} style={{ width: `${(v / 4280) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-2xl bg-accent-soft px-3 py-2.5 text-xs font-medium text-burgundy">
              <Icon name="sparkle" size={15} className="text-coral" />
              {t('You keep about JD 37 of every JD 100 you sell.')}
            </div>
          </Card>
        )}
        {tab === 'sales' && (
          <Card className="anim-fade p-4">
            <div className="font-display text-base font-semibold">{t('Sales by channel')}</div>
            {[
              ['Instagram', 58, 'bg-plum'],
              ['WhatsApp', 30, 'bg-coral'],
              ['Website', 8, 'bg-blush'],
              ['In person', 4, 'bg-line'],
            ].map(([l, p, c]) => (
              <div key={l as string} className="mt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-ink-2">{t(l as string)}</span>
                  <span className="font-semibold">
                    {p}% · {jd0(Math.round((4280 * (p as number)) / 100))}
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-canvas">
                  <div className={cx('h-full rounded-full', c as string)} style={{ width: `${p}%` }} />
                </div>
              </div>
            ))}
          </Card>
        )}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-base font-semibold">{t('Recent expenses')}</span>
            <button type="button" onClick={() => showToast(t('Expense form — coming next'))} className="text-sm font-semibold text-coral">
              {t('+ Add')}
            </button>
          </div>
          <div className="space-y-2">
            {expenses.map((e) => (
              <Card key={e.id} className="flex items-center gap-3 p-3">
                <IconBox icon={e.icon} size={38} />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{t(e.title)}</span>
                  <span className="block text-xs text-ink-2">{t(e.date)}</span>
                </span>
                <span className="text-sm font-semibold">{jd0(e.amount)}</span>
              </Card>
            ))}
          </div>
        </div>
      </Scroll>
      <TabBar active="more" />
    </Screen>
  )
}

// ------------------------------------------------------------------
// M20 · Price calculator
// ------------------------------------------------------------------
function MoneyRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between rounded-2xl bg-subtle px-4 py-3 text-sm">
      <span className="text-ink-2">{t(label)}</span>
      <span className="flex items-center gap-1 font-semibold">
        {t('JD')}
        <input value={value} inputMode="decimal" onChange={(e) => onChange(e.target.value)} className="w-14 bg-transparent text-end outline-none" />
      </span>
    </label>
  )
}

export function PriceCalculator() {
  const { showToast } = useStore()
  const [materials, setMaterials] = useState('3.50')
  const [packaging, setPackaging] = useState('1.00')
  const [other, setOther] = useState('0.50')
  const [price, setPrice] = useState('14.00')
  const cost = [materials, packaging, other].reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const pr = parseFloat(price) || 0
  const profit = pr - cost
  const margin = pr > 0 ? Math.round((profit / pr) * 100) : 0

  return (
    <Screen>
      <StatusSpacer />
      <TopBar title={t('Price calculator')} />
      <Scroll className="space-y-3 pt-5">
        <Card className="space-y-2 p-4">
          <div className="text-xs font-semibold">{t('1 · Product cost')}</div>
          <MoneyRow label="Materials" value={materials} onChange={setMaterials} />
          <MoneyRow label="Packaging" value={packaging} onChange={setPackaging} />
          <MoneyRow label="Other (delivery, fees)" value={other} onChange={setOther} />
          <div className="flex justify-between px-1 pt-1 text-sm">
            <span className="font-medium">{t('Total cost')}</span>
            <span className="font-display text-base font-bold">{jd(cost)}</span>
          </div>
        </Card>
        <Card className="space-y-3 p-4">
          <div className="text-xs font-semibold">{t('2 · Selling price')}</div>
          <label className="flex h-12 items-center gap-1.5 rounded-2xl border border-plum bg-white px-4 ring-4 ring-brand-soft">
            <span className="text-sm text-ink-2">{t('JD')}</span>
            <input value={price} inputMode="decimal" onChange={(e) => setPrice(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
          </label>
          <div className="text-xs text-ink-2">{t('Or pick a target margin')}</div>
          <div className="flex gap-2">
            {[50, 60, 70].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPrice((cost / (1 - m / 100)).toFixed(2))}
                className={cx(
                  'h-9 rounded-full px-4 text-sm font-medium transition active:scale-95',
                  Math.abs(margin - m) <= 4 ? 'bg-brand text-white' : 'bg-white text-ink ring-1 ring-line ring-inset',
                )}
              >
                {m}%
              </button>
            ))}
          </div>
        </Card>
        <div className="bg-brand-gradient rounded-3xl p-5 text-white shadow-raised">
          <div className="text-xs text-white/75">{t('3 · Profit per item')}</div>
          <div className="mt-1 flex items-center gap-2">
            <span key={profit.toFixed(2)} className="anim-fade font-display text-[34px] font-bold">
              {jd(profit)}
            </span>
            <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-semibold', profit >= 0 ? 'bg-coral' : 'bg-error')}>{t('{n}% margin', { n: margin })}</span>
          </div>
        </div>
      </Scroll>
      <Footer>
        <Button icon="check" className="w-full" onClick={() => showToast(t('Price {p} saved to Oud & Amber candle', { p: jd(pr) }))}>
          {t('Save price to a product')}
        </Button>
      </Footer>
    </Screen>
  )
}

// ------------------------------------------------------------------
// M21 · Insights
// ------------------------------------------------------------------
export function Insights() {
  const { products } = useStore()
  const [tab, setTab] = useState<'trends' | 'best'>('trends')
  const best = [
    { id: 'p1', sold: 112 },
    { id: 'p3', sold: 64 },
    { id: 'p2', sold: 58 },
    { id: 'p5', sold: 21 },
  ]
  return (
    <Screen>
      <StatusSpacer />
      <TopBar right={<Pill tone="neutral" dot={false}>{t('This month')}</Pill>} />
      <Scroll className="space-y-3 pt-5">
        <h1 className="font-display text-[28px] font-bold">{t('Insights')}</h1>
        <Segmented
          items={[
            { value: 'trends', label: t('Sales trends') },
            { value: 'best', label: t('Best-selling') },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === 'trends' ? (
          <div className="anim-fade space-y-3">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t('This month vs last')}</span>
                <span className="flex gap-3 text-xs text-ink-2">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-plum" />
                    {t('Nov')}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-blush" />
                    {t('Oct')}
                  </span>
                </span>
              </div>
              <svg viewBox="0 0 318 120" className="mt-3 w-full" direction="ltr">
                <defs>
                  <linearGradient id="tali-trend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#6B163C" stopOpacity="0.2" />
                    <stop offset="1" stopColor="#6B163C" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M4 92 C 40 88, 60 70, 96 74 S 150 84, 180 60 S 240 30, 314 18" fill="none" stroke="#E8C5BD" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 6" />
                <path d="M4 84 C 40 76, 60 56, 96 58 S 150 62, 180 42 S 240 14, 314 8 L314 116 L4 116 Z" fill="url(#tali-trend)" />
                <path className="anim-fade" d="M4 84 C 40 76, 60 56, 96 58 S 150 62, 180 42 S 240 14, 314 8" fill="none" stroke="#6B163C" strokeWidth="3" strokeLinecap="round" />
                <circle cx="314" cy="8" r="5" fill="#fff" stroke="#6B163C" strokeWidth="3" />
              </svg>
              <div className="mt-1 flex justify-between text-[10px] text-ink-2" dir="ltr">
                <span>{t('1 Nov')}</span>
                <span>8</span>
                <span>15</span>
                <span>{t('22 Nov')}</span>
              </div>
            </Card>
            {(
              [
                ['trendUp', 'success', 'Sales are up 12% on October', 'Mostly from Oud & Amber candles'],
                ['calendar', 'coral', 'Thursday is your best day', '28% of this month’s orders'],
                ['camera', 'plum', 'Instagram brings 58% of orders', 'WhatsApp 30% · Website 8% · In person 4%'],
              ] as [IconName, Tone, string, string][]
            ).map(([icon, tone, title, s]) => (
              <Card key={title} className="flex items-center gap-3 p-3.5">
                <IconBox icon={icon} tone={tone} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t(title)}</span>
                  <span className="block truncate text-xs text-ink-2">{t(s)}</span>
                </span>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="anim-fade space-y-3 p-4">
            {best.map((b, i) => {
              const p = products.find((x) => x.id === b.id)!
              return (
                <div key={b.id} className="flex items-center gap-3">
                  <span className={cx('grid size-8 place-items-center rounded-full text-xs font-bold', i === 0 ? 'bg-coral text-white' : 'bg-canvas text-burgundy')}>
                    {i + 1}
                  </span>
                  <span className="flex-1">
                    <span className="flex justify-between text-sm">
                      <span className="font-semibold">{t(p.name)}</span>
                      <span className="text-ink-2">{t('{n} sold', { n: b.sold })}</span>
                    </span>
                    <span className="mt-1.5 block h-1.5 rounded-full bg-canvas">
                      <span className={cx('block h-full rounded-full', i === 0 ? 'bg-coral' : 'bg-plum')} style={{ width: `${(b.sold / 112) * 100}%` }} />
                    </span>
                  </span>
                </div>
              )
            })}
          </Card>
        )}
      </Scroll>
      <TabBar active="more" />
    </Screen>
  )
}

// ------------------------------------------------------------------
// M22 · Settings
// ------------------------------------------------------------------
export function Settings() {
  const { push, businessName, channels, isGuest, openSheet, lang, setLang } = useStore()
  const connected = Object.values(channels).filter(Boolean).length
  return (
    <Screen>
      <StatusSpacer />
      <TopBar />
      <Scroll className="space-y-2.5 pt-5">
        <h1 className="pb-1 font-display text-[28px] font-bold">{t('Settings')}</h1>
        <SectionLabel>{t('Business')}</SectionLabel>
        <Card className="px-4 py-1">
          <ListRow icon="user" tone="plum" title={t('Business profile')} right={<span className="text-xs text-ink-2">{t(businessName)}</span>} />
          <ListRow icon="globe" title={t('Language')} chevron={false} right={<LangSwitch lang={lang} setLang={setLang} />} />
          <ListRow icon="coins" title={t('Currency')} right={<span className="text-xs text-ink-2">{t('JD')}</span>} last />
        </Card>
        <SectionLabel>{t('Sales channels')}</SectionLabel>
        <Card className="px-4 py-1">
          <ListRow
            icon="link"
            tone="plum"
            title={t('Channels')}
            onClick={() => push({ name: 'channels' })}
            right={<Pill tone="success">{t('{n} of 4 connected', { n: connected })}</Pill>}
            last
          />
        </Card>
        <SectionLabel>{t('Account')}</SectionLabel>
        <Card className="px-4 py-1">
          <ListRow
            icon="sparkle"
            tone="coral"
            title={t(isGuest ? 'Back up & create account' : 'Account backed up')}
            onClick={() => isGuest && openSheet('backup')}
          />
          <ListRow icon="bell" title={t('Notifications')} last />
        </Card>
      </Scroll>
      <TabBar active="more" />
    </Screen>
  )
}

// ------------------------------------------------------------------
// M23 · Sales channels (Instagram · Website · Talabat · Careem)
// ------------------------------------------------------------------
export function SalesChannels() {
  const { channels, setChannel, showToast } = useStore()
  const [syncing, setSyncing] = useState(false)
  const toggle = (k: keyof ChannelState, name: string) => {
    setChannel(k, !channels[k])
    showToast(t(channels[k] ? '{name} disconnected' : '{name} connected', { name: t(name) }))
  }
  const ConnectedPill = ({ on }: { on: boolean }) => <Pill tone={on ? 'success' : 'neutral'}>{t(on ? 'Connected' : 'Not connected')}</Pill>

  return (
    <Screen>
      <StatusSpacer />
      <TopBar title={t('Sales channels')} />
      <Scroll className="space-y-3 pt-5">
        <p className="text-sm text-ink-2">
          {t('Bring orders from Instagram, your website and delivery apps into TALI. Phone and in-person orders can be added by hand.')}
        </p>

        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <IconBox icon="camera" tone="coral" size={44} radius={14} />
            <span className="flex-1">
              <span className="block font-semibold">{t('Instagram')}</span>
              <span className="block text-xs text-ink-2">@laylas.candles</span>
            </span>
            <ConnectedPill on={channels.instagram} />
          </div>
          {channels.instagram ? (
            <>
              <div className="flex items-center gap-2 rounded-2xl bg-subtle px-3 py-2.5 text-xs font-medium text-ink-2">
                <Icon name="clock" size={14} className={cx(syncing && 'animate-spin')} />
                {t(syncing ? 'Syncing…' : 'Synced 5 min ago · 12 orders this month')}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="secondary"
                  icon="clock"
                  size="md"
                  onClick={() => {
                    setSyncing(true)
                    window.setTimeout(() => {
                      setSyncing(false)
                      showToast(t('Instagram synced · no new orders'))
                    }, 1200)
                  }}
                >
                  {t('Sync now')}
                </Button>
                <Button variant="outline" size="md" onClick={() => toggle('instagram', 'Instagram')}>
                  {t('Disconnect')}
                </Button>
              </div>
            </>
          ) : (
            <Button icon="link" className="w-full" onClick={() => toggle('instagram', 'Instagram')}>
              {t('Connect Instagram')}
            </Button>
          )}
        </Card>

        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <IconBox icon="store" size={44} radius={14} />
            <span className="flex-1">
              <span className="block font-semibold">{t('Your website')}</span>
              <span className="block text-xs text-ink-2">{t('Shopify & more')}</span>
            </span>
            <ConnectedPill on={channels.website} />
          </div>
          <Button icon="link" variant={channels.website ? 'outline' : 'primary'} className="w-full" onClick={() => toggle('website', 'Website')}>
            {t(channels.website ? 'Disconnect website' : 'Connect website')}
          </Button>
        </Card>

        <SectionLabel>{t('Delivery apps')}</SectionLabel>
        <Card className="px-4 py-1">
          {(
            [
              ['talabat', 'Talabat', 'bag', 'plum', channels.talabat ? '4 orders this week' : 'Restaurant & shop orders'],
              ['careem', 'Careem', 'truck', 'coral', 'Careem Food & Quik'],
            ] as [keyof ChannelState, string, IconName, Tone, string][]
          ).map(([k, name, icon, tone, sub], i) => (
            <div key={k} className={cx('flex items-center gap-3 py-3', i === 0 && 'border-b border-line')}>
              <IconBox icon={icon} tone={tone} />
              <span className="flex-1">
                <span className="block text-sm font-semibold">{t(name)}</span>
                <span className="block text-xs text-ink-2">{t(sub)}</span>
              </span>
              {channels[k] ? (
                <button type="button" onClick={() => toggle(k, name)} title={t('Tap to disconnect')}>
                  <Pill tone="success">{t('Connected')}</Pill>
                </button>
              ) : (
                <Button size="sm" onClick={() => toggle(k, name)}>
                  {t('Connect')}
                </Button>
              )}
            </div>
          ))}
        </Card>

        <div className="flex gap-2.5 rounded-2xl bg-brand-soft px-4 py-3 text-xs font-medium text-plum">
          <Icon name="help" size={17} />
          {t('TALI only imports order details each platform allows. It can’t read your private messages.')}
        </div>
      </Scroll>
    </Screen>
  )
}
