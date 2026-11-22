// Desktop: Finances, Price calculator, Insights, Settings (+ Sales channels)
import { useState } from 'react'
import { useStore, type ChannelState } from '../app/store'
import { expenses, jd, jd0 } from '../app/data'
import { t } from '../app/i18n'
import { Icon, type IconName } from '../components/Icon'
import { Button, Field, Pill, cx, type Tone } from '../components/ui'
import { Bar, Donut, KpiCard, LangToggle, PageTitle, Panel, PanelHeader, Td, Th } from './kit'

// ------------------------------------------------------------------
// Finances
// ------------------------------------------------------------------
export function FinancesPage() {
  const { showToast } = useStore()
  const flow: [string, number, string][] = [
    ['Sales', 4280, 'bg-plum'],
    ['− Product costs', 1540, 'bg-blush'],
    ['− Expenses', 1135, 'bg-coral/70'],
    ['= Net profit', 1605, 'bg-coral'],
  ]
  const channels: [string, number, string][] = [
    ['Instagram', 58, 'bg-plum'],
    ['WhatsApp', 30, 'bg-coral'],
    ['Website', 8, 'bg-blush'],
    ['In person', 4, 'bg-line'],
  ]
  return (
    <>
      <PageTitle
        title={t('Finances')}
        subtitle={t('Layla’s Candles · 1–22 November 2026')}
        actions={
          <>
            <Pill tone="neutral" dot={false}>{t('This month')}</Pill>
            <Button icon="plus" size="md" onClick={() => showToast(t('Expense form — coming next'))}>
              {t('Record an expense')}
            </Button>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard hero icon="receipt" label={t('Sales')} value={jd0(4280)} delta="12%" foot={t('vs October')} />
        <KpiCard icon="products" label={t('Product costs')} value={jd0(1540)} delta="9%" foot={t('vs October')} up={false} />
        <KpiCard icon="wallet" label={t('Expenses')} value={jd0(1135)} delta="3%" foot={t('vs October')} up={false} />
        <KpiCard icon="coins" label={t('Net profit')} value={jd0(1605)} delta="18%" foot={t('37% of sales')} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader title={t('How your sales became profit')} />
          <div className="space-y-4">
            {flow.map(([l, v, c], i) => (
              <div key={l}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className={i === 3 ? 'font-semibold' : 'text-ink-2'}>{t(l)}</span>
                  <span className={cx('font-semibold', i === 3 && 'text-coral')}>{jd0(v)}</span>
                </div>
                <Bar value={v} max={4280} color={c} />
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-accent-soft px-3 py-2.5 text-xs font-medium text-burgundy">
            <Icon name="sparkle" size={15} className="text-coral" />
            {t('You keep about JD 37 of every JD 100 you sell.')}
          </div>
        </Panel>
        <Panel>
          <PanelHeader title={t('Sales by channel')} />
          <div className="space-y-4">
            {channels.map(([l, p, c]) => (
              <div key={l}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-ink-2">{t(l)}</span>
                  <span className="font-semibold">
                    {p}% · {jd0(Math.round((4280 * p) / 100))}
                  </span>
                </div>
                <Bar value={p} max={100} color={c} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel className="mt-6">
        <PanelHeader title={t('Recent expenses')} />
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <Th>{t('Expense')}</Th>
              <Th>{t('Date')}</Th>
              <Th className="text-end">{t('Total')}</Th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <Td>
                  <span className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-canvas text-burgundy">
                      <Icon name={e.icon} size={17} />
                    </span>
                    <span className="font-medium">{t(e.title)}</span>
                  </span>
                </Td>
                <Td className="text-ink-2">{t(e.date)}</Td>
                <Td className="text-end font-semibold">{jd0(e.amount)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------
// Price calculator
// ------------------------------------------------------------------
export function CalculatorPage() {
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
    <>
      <PageTitle title={t('Price calculator')} subtitle={t('Find a price that covers your costs and leaves a fair profit.')} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel>
            <PanelHeader title={t('1 · Product cost')} />
            <div className="grid grid-cols-3 gap-4">
              <Field label={t('Materials')} prefix={t('JD')} value={materials} onChange={setMaterials} inputMode="decimal" />
              <Field label={t('Packaging')} prefix={t('JD')} value={packaging} onChange={setPackaging} inputMode="decimal" />
              <Field label={t('Other (delivery, fees)')} prefix={t('JD')} value={other} onChange={setOther} inputMode="decimal" />
            </div>
            <div className="mt-4 flex justify-between rounded-2xl bg-subtle px-4 py-3 text-sm">
              <span className="font-medium">{t('Total cost')}</span>
              <span className="font-display text-lg font-bold">{jd(cost)}</span>
            </div>
          </Panel>
          <Panel>
            <PanelHeader title={t('2 · Selling price')} />
            <div className="grid grid-cols-2 items-end gap-4">
              <Field label={t('Your price')} prefix={t('JD')} value={price} onChange={setPrice} inputMode="decimal" />
              <div>
                <div className="mb-1.5 text-xs font-semibold">{t('Or pick a target margin')}</div>
                <div className="flex gap-2">
                  {[50, 60, 70].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPrice((cost / (1 - m / 100)).toFixed(2))}
                      className={cx(
                        'h-12 flex-1 rounded-2xl text-sm font-semibold transition active:scale-95',
                        Math.abs(margin - m) <= 4 ? 'bg-brand text-white' : 'bg-white ring-1 ring-line ring-inset',
                      )}
                    >
                      {m}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
        <div className="bg-brand-gradient h-fit rounded-3xl p-6 text-white shadow-raised">
          <div className="text-sm text-white/75">{t('3 · Profit per item')}</div>
          <div key={profit.toFixed(2)} className="anim-fade mt-2 font-display text-5xl font-bold">
            {jd(profit)}
          </div>
          <span className={cx('mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold', profit >= 0 ? 'bg-coral' : 'bg-error')}>{t('{n}% margin', { n: margin })}</span>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-coral transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, margin))}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-white/75">
            <span>{t('Cost {v}', { v: jd(cost) })}</span>
            <span className="font-semibold text-white">{t('Profit {v}', { v: jd(Math.max(0, profit)) })}</span>
          </div>
          <Button variant="accent" className="mt-6 w-full" icon="check" onClick={() => showToast(t('Price {p} saved to Oud & Amber candle', { p: jd(pr) }))}>
            {t('Save price to a product')}
          </Button>
        </div>
      </div>
    </>
  )
}

// ------------------------------------------------------------------
// Insights
// ------------------------------------------------------------------
export function InsightsPage() {
  const { products } = useStore()
  const best = [
    { id: 'p1', sold: 112 },
    { id: 'p3', sold: 64 },
    { id: 'p2', sold: 58 },
    { id: 'p5', sold: 21 },
  ]
  const insights: [IconName, Tone, string, string][] = [
    ['trendUp', 'success', 'Sales are up 12% on October', 'Mostly from Oud & Amber candles'],
    ['calendar', 'coral', 'Thursday is your best day', '28% of this month’s orders'],
    ['camera', 'plum', 'Instagram brings 58% of orders', 'WhatsApp 30% · Website 8% · In person 4%'],
  ]
  const toneCls: Record<Tone, string> = {
    success: 'bg-success-soft text-success',
    coral: 'bg-accent-soft text-coral',
    plum: 'bg-brand-soft text-plum',
    neutral: 'bg-canvas text-burgundy',
    error: 'bg-error-soft text-error',
  }
  return (
    <>
      <PageTitle title={t('Insights')} subtitle={t('What’s working in your business this month')} actions={<Pill tone="neutral" dot={false}>{t('This month')}</Pill>} />
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {insights.map(([icon, tone, title, s]) => (
          <Panel key={title} className="flex items-center gap-4 p-5">
            <span className={cx('grid size-12 shrink-0 place-items-center rounded-2xl', toneCls[tone])}>
              <Icon name={icon} size={22} />
            </span>
            <span>
              <span className="block font-semibold">{t(title)}</span>
              <span className="block text-xs text-ink-2">{t(s)}</span>
            </span>
          </Panel>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Panel>
          <PanelHeader
            title={t('This month vs last')}
            right={
              <span className="flex gap-4 text-xs text-ink-2">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-plum" />
                  {t('Nov')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blush" />
                  {t('Oct')}
                </span>
              </span>
            }
          />
          <div dir="ltr">
            <svg viewBox="0 0 318 120" className="w-full">
              <defs>
                <linearGradient id="web-trend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#6B163C" stopOpacity="0.18" />
                  <stop offset="1" stopColor="#6B163C" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M4 92 C 40 88, 60 70, 96 74 S 150 84, 180 60 S 240 30, 314 18" fill="none" stroke="#E8C5BD" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 5" />
              <path d="M4 84 C 40 76, 60 56, 96 58 S 150 62, 180 42 S 240 14, 314 8 L314 116 L4 116 Z" fill="url(#web-trend)" />
              <path d="M4 84 C 40 76, 60 56, 96 58 S 150 62, 180 42 S 240 14, 314 8" fill="none" stroke="#6B163C" strokeWidth="2" strokeLinecap="round" />
              <circle cx="314" cy="8" r="3.5" fill="#fff" stroke="#6B163C" strokeWidth="2" />
            </svg>
            <div className="mt-1 flex justify-between text-xs text-ink-2">
              <span>{t('1 Nov')}</span>
              <span>8</span>
              <span>15</span>
              <span>{t('22 Nov')}</span>
            </div>
          </div>
        </Panel>
        <Panel>
          <PanelHeader title={t('Where orders come from')} />
          <Donut
            parts={[
              { value: 58, color: '#6B163C' },
              { value: 30, color: '#E46D50' },
              { value: 8, color: '#E8C5BD' },
              { value: 4, color: '#e8e1dc' },
            ]}
            center="136"
            sub={t('orders')}
          />
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {(
              [
                ['bg-plum', 'Instagram', 58],
                ['bg-coral', 'WhatsApp', 30],
                ['bg-blush', 'Website', 8],
                ['bg-line', 'In person', 4],
              ] as const
            ).map(([c, l, p]) => (
              <span key={l} className="flex items-center gap-2">
                <span className={cx('size-2.5 rounded-full', c)} />
                {t(l)} · {p}%
              </span>
            ))}
          </div>
        </Panel>
      </div>
      <Panel className="mt-6">
        <PanelHeader title={t('Best-selling')} />
        <div className="grid gap-x-10 gap-y-4 lg:grid-cols-2">
          {best.map((b, i) => {
            const p = products.find((x) => x.id === b.id)!
            return (
              <div key={b.id} className="flex items-center gap-3">
                <span className={cx('grid size-8 place-items-center rounded-full text-xs font-bold', i === 0 ? 'bg-coral text-white' : 'bg-canvas text-burgundy')}>{i + 1}</span>
                <span className="flex-1">
                  <span className="mb-1.5 flex justify-between text-sm">
                    <span className="font-semibold">{t(p.name)}</span>
                    <span className="text-ink-2">{t('{n} sold', { n: b.sold })}</span>
                  </span>
                  <Bar value={b.sold} max={112} color={i === 0 ? 'bg-coral' : 'bg-plum'} />
                </span>
              </div>
            )
          })}
        </div>
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------
// Settings (+ Sales channels)
// ------------------------------------------------------------------
type Section = 'profile' | 'language' | 'channels' | 'notifications' | 'account'

export function SettingsPage({ initial = 'channels' }: { initial?: Section }) {
  const { channels, setChannel, showToast, businessName, setBusinessName, lang, setLang } = useStore()
  const [sec, setSec] = useState<Section>(initial)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [notify, setNotify] = useState({ orders: true, stock: true, tasks: false })

  const toggle = (k: keyof ChannelState, name: string) => {
    setChannel(k, !channels[k])
    showToast(t(channels[k] ? '{name} disconnected' : '{name} connected', { name: t(name) }))
  }
  const sync = (name: string) => {
    setSyncing(name)
    window.setTimeout(() => {
      setSyncing(null)
      showToast(t('{name} synced · no new orders', { name: t(name) }))
    }, 1200)
  }

  const nav: [Section, string, IconName][] = [
    ['profile', 'Business profile', 'user'],
    ['language', 'Language', 'globe'],
    ['channels', 'Sales channels', 'link'],
    ['notifications', 'Notifications', 'bell'],
    ['account', 'Account & backup', 'sparkle'],
  ]

  const ChannelCard = ({ k, name, sub, icon, tone, info }: { k: keyof ChannelState; name: string; sub: string; icon: IconName; tone: string; info: string }) => {
    const on = channels[k]
    return (
      <Panel className="space-y-4 p-5">
        <div className="flex items-center gap-3.5">
          <span className={cx('grid size-12 place-items-center rounded-2xl', tone)}>
            <Icon name={icon} size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display font-semibold">{t(name)}</span>
            <span className="block truncate text-xs text-ink-2">{t(sub)}</span>
          </span>
          <Pill tone={on ? 'success' : 'neutral'}>{t(on ? 'Connected' : 'Not connected')}</Pill>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-subtle px-3.5 py-3 text-xs font-medium text-ink-2">
          <Icon name={on ? 'clock' : 'orders'} size={14} className={cx(syncing === name && 'animate-spin')} />
          {syncing === name ? t('Syncing…') : t(on ? info : 'New orders arrive in Orders as “New”')}
        </div>
        {on ? (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" icon="clock" size="md" onClick={() => sync(name)}>
              {t('Sync now')}
            </Button>
            <Button variant="outline" size="md" onClick={() => toggle(k, name)}>
              {t('Disconnect')}
            </Button>
          </div>
        ) : (
          <Button icon="link" size="md" className="w-full" onClick={() => toggle(k, name)}>
            {name === 'Your website' ? t('Connect website') : t('Connect {name}', { name: t(name) })}
          </Button>
        )}
      </Panel>
    )
  }

  return (
    <>
      <PageTitle title={t('Settings')} subtitle={t('Business profile, language and the channels your orders come from.')} />
      <div className="grid items-start gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="rounded-3xl bg-white p-2 shadow-soft">
          {nav.map(([k, l, icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSec(k)}
              className={cx('flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-start text-sm transition', sec === k ? 'bg-canvas font-semibold text-burgundy' : 'text-ink hover:bg-subtle')}
            >
              <Icon name={icon} size={18} />
              {t(l)}
            </button>
          ))}
        </nav>
        <div key={sec} className="anim-fade space-y-5">
          {sec === 'channels' && (
            <>
              <div>
                <h2 className="font-display text-2xl font-semibold">{t('Sales channels')}</h2>
                <p className="mt-1 text-sm text-ink-2">
                  {t('Bring orders from Instagram, your website and delivery apps into TALI. Phone and in-person orders can be added by hand.')}
                </p>
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <ChannelCard k="instagram" name="Instagram" sub="@laylas.candles" icon="camera" tone="bg-accent-soft text-coral" info="Synced 5 min ago · 12 orders this month" />
                <ChannelCard k="website" name="Your website" sub="Shopify or WooCommerce" icon="store" tone="bg-canvas text-burgundy" info="Synced just now" />
              </div>
              <h3 className="font-display text-lg font-semibold">{t('Delivery apps')}</h3>
              <div className="grid gap-5 xl:grid-cols-2">
                <ChannelCard k="talabat" name="Talabat" sub="Restaurant & shop orders" icon="bag" tone="bg-brand-soft text-plum" info="Synced 12 min ago · 4 orders this week" />
                <ChannelCard k="careem" name="Careem" sub="Careem Food & Quik" icon="truck" tone="bg-accent-soft text-coral" info="Synced just now" />
              </div>
              <Panel>
                <PanelHeader title={t('Sync history')} />
                {[
                  ['Today, 12:40', '1 new order imported · #TL-1048'],
                  ['Today, 10:02', 'No new orders'],
                  ['Yesterday, 18:21', '2 new orders imported'],
                ].map(([time, d]) => (
                  <div key={time} className="flex items-center gap-3 border-t border-line py-3 text-sm">
                    <span className="grid size-7 place-items-center rounded-full bg-success-soft text-success">
                      <Icon name="check" size={14} />
                    </span>
                    <span className="flex-1">{t(d)}</span>
                    <span className="text-xs text-ink-2">{t(time)}</span>
                  </div>
                ))}
              </Panel>
              <div className="flex gap-2.5 rounded-2xl bg-brand-soft px-4 py-3 text-xs font-medium text-plum">
                <Icon name="help" size={17} />
                {t('TALI only imports order details each platform allows. It can’t read your private messages.')}
              </div>
            </>
          )}
          {sec === 'profile' && (
            <Panel className="max-w-xl space-y-4">
              <PanelHeader title={t('Business profile')} />
              <Field label={t('Business name')} value={t(businessName)} onChange={setBusinessName} />
              <Field label={t('Phone number')} value="+962 79 555 0100" />
              <Field label={t('Currency')} value={t('Jordanian dinar (JD)')} />
              <Button icon="check" size="md" onClick={() => showToast(t('Saved'))}>
                {t('Save changes')}
              </Button>
            </Panel>
          )}
          {sec === 'language' && (
            <Panel className="max-w-xl">
              <PanelHeader title={t('Language')} subtitle={t('The whole dashboard and app switch instantly.')} />
              <LangToggle lang={lang} setLang={setLang} />
            </Panel>
          )}
          {sec === 'notifications' && (
            <Panel className="max-w-xl">
              <PanelHeader title={t('Notifications')} />
              {(
                [
                  ['orders', 'New orders'],
                  ['stock', 'Low stock alerts'],
                  ['tasks', 'Daily task summary'],
                ] as [keyof typeof notify, string][]
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setNotify((n) => ({ ...n, [k]: !n[k] }))}
                  className="flex w-full items-center justify-between border-t border-line py-3.5 text-sm"
                >
                  {t(l)}
                  <span className={cx('flex h-6 w-11 items-center rounded-full p-0.5 transition', notify[k] ? 'justify-end bg-brand' : 'justify-start bg-line')}>
                    <span className="size-5 rounded-full bg-white shadow-soft" />
                  </span>
                </button>
              ))}
            </Panel>
          )}
          {sec === 'account' && (
            <Panel className="max-w-xl">
              <PanelHeader title={t('Account & backup')} />
              <div className="flex items-center gap-3 rounded-2xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
                <Icon name="check" size={18} /> {t('Your data is backed up to your account.')}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </>
  )
}
