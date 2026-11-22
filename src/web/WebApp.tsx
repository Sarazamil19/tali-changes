// Desktop web dashboard — shell, navigation, sign in and quick-create modals.
import { useEffect, useState, type ReactNode } from 'react'
import { useStore } from '../app/store'
import { jd, type Payment, type TaskKind } from '../app/data'
import { t } from '../app/i18n'
import { Icon, type IconName } from '../components/Icon'
import { Logo } from '../components/Logo'
import { Avatar, Button, Chip, Field, cx } from '../components/ui'
import { CalculatorPage, FinancesPage, InsightsPage, SettingsPage } from './Business'
import { Dashboard } from './Dashboard'
import { LangToggle, Modal } from './kit'
import { PlannerPage } from './Planner'
import { CustomersPage, OrdersPage, ProductsPage } from './Records'

export type WebPage = 'dashboard' | 'insights' | 'orders' | 'products' | 'customers' | 'planner' | 'finances' | 'calculator' | 'settings'
type ModalKind = 'order' | 'product' | 'task'
export type WebNav = { go: (p: WebPage, id?: string) => void; open: (m: ModalKind, arg?: string) => void }

const sections: { label: string; items: [WebPage, string, IconName][] }[] = [
  {
    label: 'Overview',
    items: [
      ['dashboard', 'Dashboard', 'home'],
      ['insights', 'Insights', 'insights'],
    ],
  },
  {
    label: 'Business',
    items: [
      ['orders', 'Orders', 'orders'],
      ['products', 'Products', 'products'],
      ['customers', 'Customers', 'users'],
      ['planner', 'Planner', 'calendar'],
      ['finances', 'Finances', 'wallet'],
      ['calculator', 'Price Calculator', 'calculator'],
    ],
  },
]

const crumbs: Record<WebPage, [string, string]> = {
  dashboard: ['Overview', 'Dashboard'],
  insights: ['Overview', 'Insights'],
  orders: ['Business', 'Orders'],
  products: ['Business', 'Products'],
  customers: ['Business', 'Customers'],
  planner: ['Business', 'Planner'],
  finances: ['Business', 'Finances'],
  calculator: ['Business', 'Price Calculator'],
  settings: ['Account', 'Settings'],
}

// ------------------------------------------------------------------
// Sign in (web requires an account)
// ------------------------------------------------------------------
function SignIn({ onDone }: { onDone: () => void }) {
  const { lang, setLang } = useStore()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('+962 79 555 0100')
  return (
    <div className="grid min-h-screen grid-cols-[minmax(0,640px)_1fr] bg-subtle">
      <div className="bg-brand-gradient relative overflow-hidden p-16 text-white">
        <div className="pointer-events-none absolute -top-32 -end-32 size-[520px] rounded-full" style={{ background: 'radial-gradient(circle, rgb(228 109 80 / 0.4), transparent 65%)' }} />
        <Logo height={48} />
        <div className="anim-float absolute top-[220px] start-[200px] w-[320px] rounded-3xl border border-white/25 bg-white/12 p-6 backdrop-blur-md" style={{ ['--r' as string]: '-3deg' }}>
          <div className="text-sm text-white/75">{t('Sales this month')}</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-display text-4xl font-bold">{lang === 'ar' ? '4,280 د.أ' : 'JD 4,280'}</span>
            <span className="rounded-full bg-coral px-2 py-0.5 text-xs font-semibold">▲ 12%</span>
          </div>
        </div>
        <div className="anim-float absolute top-[400px] start-[110px] flex w-[320px] items-center gap-3 rounded-2xl bg-white p-3.5 text-ink shadow-raised" style={{ ['--r' as string]: '2deg', animationDelay: '1s' }}>
          <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-plum">
            <Icon name="truck" size={19} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold">{t('3 deliveries today')}</span>
            <span className="block text-xs text-ink-2">{t('Next: Dana Saleh · 9:30 AM')}</span>
          </span>
        </div>
        <div className="absolute inset-x-16 bottom-16">
          <h1 className="font-display text-[44px] leading-tight font-semibold">{t('Every step takes you further.')}</h1>
          <p className="mt-3 max-w-md text-white/80">{t('One account for the TALI app and this dashboard. Your orders, stock and profit stay in sync.')}</p>
        </div>
      </div>
      <div className="grid place-items-center p-10">
        <div className="w-full max-w-[420px] space-y-5">
          <div className="flex justify-end">
            <LangToggle lang={lang} setLang={setLang} />
          </div>
          <h1 className="font-display text-4xl font-semibold">{t('Welcome back')}</h1>
          <p className="text-ink-2">{t('Sign in with the phone number you use in the app. We’ll text you a one-time code.')}</p>
          <Field label={t('Phone number')} value={phone} onChange={setPhone} inputMode="tel" />
          {step === 'code' && (
            <div className="anim-rise">
              <div className="mb-1.5 text-xs font-semibold">{t('Enter the 6-digit code we sent')}</div>
              <div className="flex gap-2" dir="ltr">
                {['4', '8', '2', '1', '9', '6'].map((d, i) => (
                  <span key={i} className="grid h-14 flex-1 place-items-center rounded-2xl border border-line bg-white font-display text-xl font-semibold">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Button icon={step === 'phone' ? 'arrowRight' : 'check'} className="w-full" onClick={() => (step === 'phone' ? setStep('code') : onDone())}>
            {step === 'phone' ? t('Send code') : t('Sign in')}
          </Button>
          <div className="flex items-center gap-3 text-xs text-ink-2">
            <span className="h-px flex-1 bg-line" />
            {t('New to TALI?')}
            <span className="h-px flex-1 bg-line" />
          </div>
          <Button variant="outline" className="w-full" onClick={onDone}>
            {t('Create an account')}
          </Button>
          <div className="flex items-start gap-3 rounded-2xl bg-canvas px-4 py-3.5">
            <Icon name="sparkle" size={20} className="text-coral" />
            <div>
              <div className="text-sm font-semibold">{t('Used TALI as a guest on your phone?')}</div>
              <div className="text-xs text-ink-2">{t('Tap “Back up” in the app first, so your orders appear here.')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Quick-create modals
// ------------------------------------------------------------------
function NewOrderModal({ customerId, onClose, onSaved }: { customerId?: string; onClose: () => void; onSaved: (id: string) => void }) {
  const { customers, products, draft, setDraft, setQty, saveOrder } = useStore()
  useEffect(() => {
    setDraft({ customerId: customerId ?? 'c1', qty: { p1: 2, p2: 1 }, payment: 'Paid', deliveryFee: 3, discount: 2 })
  }, [customerId, setDraft])
  const lines = Object.entries(draft.qty).map(([id, n]) => ({ p: products.find((x) => x.id === id)!, n }))
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.n, 0)
  const total = subtotal + draft.deliveryFee - draft.discount
  return (
    <Modal
      wide
      title={t('New order')}
      onClose={onClose}
      footer={
        <>
          <span className="me-auto self-center text-sm text-ink-2">
            {t('Total')}: <span className="font-display text-lg font-bold text-burgundy">{jd(total)}</span>
          </span>
          <Button variant="secondary" size="md" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button icon="check" size="md" disabled={lines.length === 0} onClick={() => onSaved(saveOrder())}>
            {t('Save order')}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-semibold">{t('Customer')}</div>
          <div className="space-y-1.5">
            {customers.map((c) => {
              const on = draft.customerId === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDraft({ customerId: c.id })}
                  className={cx('flex w-full items-center gap-3 rounded-2xl p-2.5 text-start transition', on ? 'bg-brand-soft' : 'bg-white hover:bg-canvas')}
                >
                  <Avatar name={t(c.name)} size={34} light={on} />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{t(c.name)}</span>
                    <span className="block text-xs text-ink-2">{c.phone}</span>
                  </span>
                  <span className={cx('grid size-5 place-items-center rounded-full', on ? 'bg-brand text-white' : 'border-[1.5px] border-line')}>
                    {on && <Icon name="check" size={12} strokeWidth={2.6} />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold">{t('Products')}</div>
          <div className="space-y-1.5">
            {products.map((p) => {
              const n = draft.qty[p.id] ?? 0
              return (
                <div key={p.id} className={cx('flex items-center gap-3 rounded-2xl bg-white p-2.5', n > 0 && 'ring-1 ring-blush')}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{t(p.name)}</span>
                    <span className="block text-xs text-ink-2">
                      {jd(p.price)} · {t('{n} in stock', { n: p.stock })}
                    </span>
                  </span>
                  <button type="button" aria-label={t('Less')} disabled={n === 0} onClick={() => setQty(p.id, n - 1)} className="grid size-7 place-items-center rounded-full bg-canvas disabled:opacity-40">
                    <Icon name="minus" size={14} />
                  </button>
                  <span className="w-4 text-center text-sm font-semibold">{n}</span>
                  <button type="button" aria-label={t('Add')} disabled={n >= p.stock} onClick={() => setQty(p.id, n + 1)} className="grid size-7 place-items-center rounded-full bg-brand text-white disabled:opacity-40">
                    <Icon name="plus" size={14} />
                  </button>
                </div>
              )
            })}
          </div>
          <div className="mt-4 mb-2 text-xs font-semibold">{t('Payment')}</div>
          <div className="flex flex-wrap gap-2">
            {(['Paid', 'Unpaid', 'Cash on delivery'] as Payment[]).map((p) => (
              <Chip key={p} selected={draft.payment === p} onClick={() => setDraft({ payment: p })}>
                {t(p)}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

function AddProductModal({ onClose }: { onClose: () => void }) {
  const { addProduct, showToast } = useStore()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('14.00')
  const [cost, setCost] = useState('5.00')
  const [stock, setStock] = useState('20')
  const [alertAt, setAlertAt] = useState('5')
  const pr = parseFloat(price) || 0
  const co = parseFloat(cost) || 0
  const margin = pr > 0 ? Math.round(((pr - co) / pr) * 100) : 0
  return (
    <Modal
      title={t('New product')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            icon="check"
            size="md"
            disabled={!name.trim() || pr <= 0}
            onClick={() => {
              addProduct({ name: name.trim(), price: pr, cost: co, stock: parseInt(stock) || 0, alertAt: parseInt(alertAt) || 0 })
              showToast(t('{name} added', { name: name.trim() }))
              onClose()
            }}
          >
            {t('Save product')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('Product name')} value={name} onChange={setName} placeholder={t('Oud & Amber candle')} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('Selling price')} prefix={t('JD')} value={price} onChange={setPrice} inputMode="decimal" />
          <Field label={t('Cost price')} prefix={t('JD')} value={cost} onChange={setCost} inputMode="decimal" />
          <Field label={t('In stock')} value={stock} onChange={setStock} inputMode="numeric" />
          <Field label={t('Low-stock alert at')} value={alertAt} onChange={setAlertAt} inputMode="numeric" />
        </div>
        <div className="bg-brand-gradient flex items-center justify-between rounded-2xl px-5 py-4 text-white">
          <span className="text-sm text-white/80">{t('You make per item')}</span>
          <span className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold">{jd(Math.max(0, pr - co))}</span>
            <span className="rounded-full bg-coral px-2 py-0.5 text-xs font-semibold">{t('{n}% margin', { n: margin })}</span>
          </span>
        </div>
      </div>
    </Modal>
  )
}

function AddTaskModal({ onClose }: { onClose: () => void }) {
  const { addTask, showToast } = useStore()
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<TaskKind>('task')
  const [time, setTime] = useState(t('11:15 AM'))
  const [when, setWhen] = useState<'today' | 'upcoming'>('today')
  return (
    <Modal
      title={t('New task')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            icon="check"
            size="md"
            disabled={!title.trim()}
            onClick={() => {
              addTask({ title: title.trim(), meta: kind === 'reminder' ? 'Reminder' : 'Task', time, when, state: 'todo', kind })
              showToast(t('Task added to your Planner'))
              onClose()
            }}
          >
            {t('Save task')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('Title')} value={title} onChange={setTitle} placeholder={t('Call supplier about packaging')} />
        <div>
          <div className="mb-2 text-xs font-semibold">{t('Type')}</div>
          <div className="flex gap-2">
            <Chip selected={kind === 'task'} onClick={() => setKind('task')}>
              {t('Task')}
            </Chip>
            <Chip selected={kind === 'reminder'} onClick={() => setKind('reminder')}>
              {t('Reminder')}
            </Chip>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-2 text-xs font-semibold">{t('Date')}</div>
            <div className="flex gap-2">
              <Chip selected={when === 'today'} onClick={() => setWhen('today')}>
                {t('Today')}
              </Chip>
              <Chip selected={when === 'upcoming'} onClick={() => setWhen('upcoming')}>
                {t('Upcoming')}
              </Chip>
            </div>
          </div>
          <Field label={t('Time')} value={time} onChange={setTime} />
        </div>
      </div>
    </Modal>
  )
}

// ------------------------------------------------------------------
// Shell
// ------------------------------------------------------------------
function SideItem({ icon, label, active, badge, onClick }: { icon: IconName; label: string; active: boolean; badge?: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-start text-sm transition',
        active ? 'bg-white font-semibold text-burgundy shadow-soft' : 'text-ink hover:bg-white/60',
      )}
    >
      <Icon name={icon} size={18} />
      <span className="flex-1">{label}</span>
      {badge}
    </button>
  )
}

export type WebSession = { signedIn: boolean; setSignedIn: (v: boolean) => void; page: WebPage; setPage: (p: WebPage) => void }

export function WebApp({ onMobile, session }: { onMobile: () => void; session: WebSession }) {
  const { lang, setLang, orders, tasks, businessName, toast } = useStore()
  const { signedIn, setSignedIn, page, setPage } = session
  const [openId, setOpenId] = useState<string | undefined>()
  const [pageKey, setPageKey] = useState(0)
  const [modal, setModal] = useState<{ kind: ModalKind; arg?: string } | null>(null)

  const nav: WebNav = {
    go: (p, id) => {
      setPage(p)
      setOpenId(id)
      setPageKey((k) => k + 1)
    },
    open: (kind, arg) => setModal({ kind, arg }),
  }

  if (!signedIn) return <SignIn onDone={() => setSignedIn(true)} />

  const newCount = orders.filter((o) => o.status === 'New').length
  const taskCount = tasks.filter((x) => x.when === 'today' && x.state !== 'done').length
  const badge = (n: number, coral = false) =>
    n > 0 ? <span className={cx('rounded-full px-2 text-xs font-semibold', coral ? 'bg-coral text-white' : 'bg-brand-soft text-plum')}>{n}</span> : null

  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr] bg-subtle">
      <aside className="sticky top-0 flex h-screen flex-col gap-5 overflow-y-auto px-4 py-6">
        <div className="px-2 text-burgundy">
          <Logo height={34} />
        </div>
        <button type="button" className="flex items-center gap-3 rounded-2xl bg-white p-3 text-start shadow-soft">
          <Avatar name={t(businessName)} size={36} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{t(businessName)}</span>
            <span className="block text-xs text-ink-2">{t('Home business')}</span>
          </span>
          <Icon name="chevronDown" size={16} className="text-ink-2" />
        </button>
        {sections.map((s) => (
          <div key={s.label}>
            <div className="mb-1.5 px-3 text-[11px] font-semibold tracking-wide text-ink-2 uppercase">{t(s.label)}</div>
            <div className="space-y-0.5">
              {s.items.map(([k, l, icon]) => (
                <SideItem
                  key={k}
                  icon={icon}
                  label={t(l)}
                  active={page === k}
                  onClick={() => nav.go(k)}
                  badge={k === 'orders' ? badge(newCount) : k === 'planner' ? badge(taskCount, page === 'planner') : undefined}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="mt-auto space-y-1 rounded-2xl bg-white/70 p-2 shadow-soft">
          <SideItem icon="settings" label={t('Settings')} active={page === 'settings'} onClick={() => nav.go('settings')} />
          <SideItem icon="help" label={t('Help & support')} active={false} onClick={() => undefined} />
        </div>
        <div className="flex items-center gap-3 px-2">
          <Avatar name={t('Layla Ahmad')} size={36} />
          <span className="flex-1">
            <span className="block text-sm font-semibold">{t('Layla Ahmad')}</span>
            <span className="block text-xs text-ink-2">{t('Owner')}</span>
          </span>
          <button type="button" aria-label={t('Sign out')} onClick={() => setSignedIn(false)} className="text-ink-2 hover:text-burgundy">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-8 py-6">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-ink-2">
            <Icon name="home" size={16} />
            {t(crumbs[page][0])}
            <span>/</span>
            <span className="font-semibold text-ink">{t(crumbs[page][1])}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onMobile}
              className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-burgundy shadow-soft transition hover:shadow-raised"
            >
              <Icon name="phone" size={16} />
              {t('Mobile app')}
            </button>
            <LangToggle lang={lang} setLang={setLang} />
            <button type="button" aria-label={t('Notifications')} className="relative grid size-10 place-items-center rounded-full bg-white shadow-soft">
              <Icon name="bell" size={18} />
              <span className="absolute top-2.5 end-2.5 size-2 rounded-full bg-coral ring-2 ring-white" />
            </button>
          </div>
        </header>
        <div key={`${page}-${pageKey}-${lang}`} className="anim-rise">
          {page === 'dashboard' && <Dashboard nav={nav} />}
          {page === 'orders' && <OrdersPage nav={nav} openId={openId} />}
          {page === 'products' && <ProductsPage nav={nav} />}
          {page === 'customers' && <CustomersPage nav={nav} />}
          {page === 'planner' && <PlannerPage nav={nav} />}
          {page === 'finances' && <FinancesPage />}
          {page === 'calculator' && <CalculatorPage />}
          {page === 'insights' && <InsightsPage />}
          {page === 'settings' && <SettingsPage />}
        </div>
      </main>

      {modal?.kind === 'order' && (
        <NewOrderModal
          customerId={modal.arg}
          onClose={() => setModal(null)}
          onSaved={(id) => {
            setModal(null)
            nav.go('orders', id)
          }}
        />
      )}
      {modal?.kind === 'product' && <AddProductModal onClose={() => setModal(null)} />}
      {modal?.kind === 'task' && <AddTaskModal onClose={() => setModal(null)} />}

      {toast && (
        <div key={toast.key} role="status" className="anim-toast fixed bottom-8 left-1/2 z-[60] rounded-full bg-burgundy px-5 py-3 text-sm font-semibold text-white shadow-raised">
          {toast.text}
        </div>
      )}
    </div>
  )
}
