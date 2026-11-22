import { useState } from 'react'
import { useStore } from '../app/store'
import { t, tParts } from '../app/i18n'
import { Icon, type IconName } from '../components/Icon'
import { Logo } from '../components/Logo'
import { Avatar, Pill, Screen, TabBar, cx, type Tone } from '../components/ui'

type Period = 'today' | 'week' | 'month'

const numbers: Record<Period, { sales: string; profit: string; salesDelta: string; profitDelta: string }> = {
  today: { sales: '186', profit: '71', salesDelta: '8% vs yesterday', profitDelta: '5% vs yesterday' },
  week: { sales: '1,120', profit: '430', salesDelta: '6% vs last week', profitDelta: '9% vs last week' },
  month: { sales: '4,280', profit: '1,605', salesDelta: '12% vs Oct', profitDelta: '18% vs Oct' },
}

export function AgendaItem({
  icon,
  tone,
  title,
  meta,
  time,
  onClick,
}: {
  icon: IconName
  tone: Tone
  title: string
  meta: string
  time: string
  onClick?: () => void
}) {
  const bg = tone === 'plum' ? 'bg-brand-soft' : 'bg-accent-soft'
  return (
    <button type="button" onClick={onClick} className={cx('flex w-full items-center gap-3 rounded-2xl p-3 text-start transition active:scale-[0.98]', bg)}>
      <span className={cx('grid size-9 place-items-center rounded-xl bg-white', tone === 'plum' ? 'text-plum' : 'text-coral')}>
        <Icon name={icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{t(title)}</span>
        <span className="block truncate text-xs text-ink-2">{tParts(meta)}</span>
      </span>
      <span className="text-xs font-semibold">{t(time)}</span>
    </button>
  )
}

export function Home() {
  const { businessName, firstUse, isGuest, openSheet, startOrder, push, tasks } = useStore()
  const [period, setPeriod] = useState<Period>('month')
  const n = numbers[period]
  const newDeliveries = tasks.filter((t) => t.id.startsWith('t-TL') && t.state !== 'done')

  return (
    <Screen>
      <div className="no-scrollbar flex-1 overflow-y-auto pb-6">
        {/* Dark header */}
        <div className="bg-brand-gradient rounded-b-[32px] px-5 pt-14 pb-24 text-white">
          <div className="flex items-center justify-between">
            <Logo height={30} />
            <div className="flex items-center gap-2">
              <button type="button" aria-label={t('Notifications')} className="relative grid size-10 place-items-center rounded-full bg-white/15">
                <Icon name="bell" size={19} />
                <span className="absolute top-2.5 end-2.5 size-2 rounded-full bg-coral ring-2 ring-plum" />
              </button>
              <Avatar name={t('Layla Ahmad')} size={40} light />
            </div>
          </div>
          <p className="mt-6 text-sm text-white/70">{t(firstUse ? 'Welcome,' : 'Good afternoon,')}</p>
          <h1 className="font-display text-[26px] font-semibold">{t(businessName)}</h1>
          <div className="mt-4 flex gap-5 text-sm">
            {(
              [
                ['today', 'Today'],
                ['week', 'This week'],
                ['month', 'This month'],
              ] as [Period, string][]
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setPeriod(k)}
                className={cx('relative pb-1.5 transition', period === k ? 'font-semibold text-white' : 'text-white/60')}
              >
                {t(l)}
                <span className={cx('absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-coral transition-transform', period === k ? 'scale-x-100' : 'scale-x-0')} />
              </button>
            ))}
          </div>
        </div>

        {/* Overview card overlapping the header */}
        <div className="-mt-16 px-5">
          <div className="anim-rise rounded-3xl bg-white p-5 shadow-raised">
            <div className="flex items-center justify-between">
              <span className="font-display text-base font-semibold">{t('Overview')}</span>
              {firstUse ? <Pill tone="plum" dot={false}>{t('New')}</Pill> : <Pill tone="coral" dot={false}>{t('Sample data')}</Pill>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {[
                ['Sales', firstUse ? '0' : n.sales, n.salesDelta],
                ['Net profit', firstUse ? '0' : n.profit, n.profitDelta],
              ].map(([label, value, delta], i) => (
                <div key={label} className={cx(i === 1 && 'border-s border-line ps-4')}>
                  <div key={value + period} className="anim-fade flex items-baseline gap-1">
                    <span className="font-display text-[34px] leading-none font-bold">{value}</span>
                    <span className="text-xs font-medium text-ink-2">{t('JD')}</span>
                  </div>
                  <div className={cx('mt-1.5 flex items-center gap-1 text-xs font-medium', firstUse ? 'text-ink-2' : 'text-success')}>
                    {!firstUse && <Icon name="trendUp" size={13} />}
                    {t(firstUse ? 'No sales yet' : delta)}
                  </div>
                  <div className="text-xs text-ink-2">{t(label)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-accent-soft px-3 py-2.5 text-xs font-medium text-burgundy">
              <Icon name={firstUse ? 'sparkle' : 'coins'} size={16} className="text-coral" />
              {t(firstUse ? 'Your numbers appear after your first order' : 'To collect: JD 96 · 4 cash-on-delivery orders')}
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 pt-4">
          {firstUse ? (
            <>
              {isGuest && (
                <div className="flex items-center gap-3 rounded-2xl bg-canvas px-4 py-3">
                  <Icon name="edit" size={18} className="text-plum" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{t('You’re using TALI as a guest')}</div>
                    <div className="text-xs text-ink-2">{t('Data is saved on this phone only')}</div>
                  </div>
                  <button type="button" onClick={() => openSheet('backup')} className="text-sm font-semibold text-coral">
                    {t('Back up')}
                  </button>
                </div>
              )}
              <div className="rounded-[20px] bg-white p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-semibold">{t('Get started')}</span>
                  <span className="text-xs text-ink-2">{t('0 of 3')}</span>
                </div>
                {(
                  [
                    ['products', 'Add your first product', 'Name, price, cost and stock', () => push({ name: 'addProduct' }, 'up')],
                    ['orders', 'Add your first order', 'From WhatsApp, Instagram or in person', () => startOrder()],
                    ['receipt', 'Record an expense', 'So your profit is real', () => push({ name: 'finances' })],
                  ] as [IconName, string, string, () => void][]
                ).map(([icon, title, s, fn], i) => (
                  <button
                    key={title}
                    type="button"
                    onClick={fn}
                    className={cx('flex w-full items-center gap-3 py-3 text-start transition active:opacity-60', i < 2 && 'border-b border-line')}
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-plum">
                      <Icon name={icon} size={19} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{t(title)}</span>
                      <span className="block text-xs text-ink-2">{t(s)}</span>
                    </span>
                    <Icon name="chevronRight" size={18} className="text-ink-2" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                {(
                  [
                    ['Order', 'coral', () => startOrder()],
                    ['Product', 'plum', () => push({ name: 'addProduct' }, 'up')],
                    ['Expense', 'neutral', () => push({ name: 'finances' })],
                  ] as [string, Tone, () => void][]
                ).map(([l, tone, fn]) => (
                  <button
                    key={l}
                    type="button"
                    onClick={fn}
                    className="flex shrink-0 items-center gap-2 rounded-[20px] bg-white py-2 ps-2 pe-3.5 shadow-soft transition active:scale-95"
                  >
                    <span
                      className={cx(
                        'grid size-8 shrink-0 place-items-center rounded-xl',
                        tone === 'coral' ? 'bg-accent-soft text-coral' : tone === 'plum' ? 'bg-brand-soft text-plum' : 'bg-canvas text-burgundy',
                      )}
                    >
                      <Icon name="plus" size={18} />
                    </span>
                    <span className="text-[13px] font-semibold">{t(l)}</span>
                  </button>
                ))}
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-display text-base font-semibold">{t('Today')}</span>
                  <button type="button" onClick={() => push({ name: 'planner' })} className="text-sm font-semibold text-burgundy">
                    {t('Planner →')}
                  </button>
                </div>
                <div className="space-y-2">
                  {newDeliveries.map((t) => (
                    <div key={t.id} className="anim-rise">
                      <AgendaItem icon="truck" tone="plum" title={t.title} meta={t.meta} time={t.time} onClick={() => push({ name: 'tasks' })} />
                    </div>
                  ))}
                  <AgendaItem icon="truck" tone="plum" title="Deliver #TL-1046" meta="Dana Saleh · Khalda" time="9:30 AM" onClick={() => push({ name: 'orderDetails', id: 'TL-1046' })} />
                  <AgendaItem icon="tasks" tone="coral" title="Call supplier" meta="Packaging quote" time="11:15 AM" onClick={() => push({ name: 'tasks' })} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <TabBar active="home" />
    </Screen>
  )
}
