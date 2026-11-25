// Growth tools shared by the mobile app and the web dashboard:
// Today's brief rows, the monthly goal ring and form, product coach labels, and WhatsApp offers to a customer group.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useStore } from '../app/store'
import { getLang, t } from '../app/i18n'
import { jd0, type Customer, type Product } from '../app/data'
import { buildMessage, templateLabel, whatsappLink, type TemplateId } from '../app/whatsapp'
import {
  briefItems,
  coachInfo,
  coachLabel,
  coachTip,
  goalProgress,
  groupInfo,
  groups,
  inGroup,
  lastOrderText,
  monthSales,
  suggestedPrice,
  type BriefItem,
  type Group,
} from '../app/growth'
import { daysLeftInMonth, fullDate, monthName } from '../app/calendar'
import { cloudEnabled } from '../app/cloud'
import { Icon } from './Icon'
import { Avatar, Button, Chip, IconBox, Pill, cx } from './ui'
import { WA, waGreen } from './WhatsApp'

// ------------------------------------------------------------------
// Today's brief
// ------------------------------------------------------------------

/** Brief items that haven't been dismissed. */
export function useBrief() {
  const { orders, products, customers, tasks, goal, dismissed } = useStore()
  return briefItems({ orders, products, customers, tasks, goal }).filter((i) => !dismissed.includes(i.id))
}

/** Adds a restock task for every low-stock product. */
export function useRestock() {
  const { products, addTask, showToast, dismissBrief } = useStore()
  return () => {
    const low = products.filter((p) => p.stock <= p.alertAt)
    low.forEach((p) => addTask({ title: `Restock: ${p.name}`, meta: 'Suggested from low stock', time: '1:00 PM', when: 'today', state: 'todo', kind: 'reminder' }))
    dismissBrief('stock')
    showToast(t('{n} restock tasks added to your Planner', { n: low.length }))
  }
}

export function BriefRow({ item, onAction, onDismiss }: { item: BriefItem; onAction: (i: BriefItem) => void; onDismiss?: (id: string) => void }) {
  return (
    <div className="anim-rise flex items-start gap-3 rounded-2xl bg-white p-3 shadow-soft">
      <IconBox icon={item.icon} tone={item.tone} size={38} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span className="min-w-0 flex-1 text-sm leading-snug font-semibold">{item.title}</span>
          {item.growth && (
            <span className="mt-0.5 shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-coral">{t('Grow')}</span>
          )}
        </div>
        <div className="mt-0.5 text-xs leading-snug text-ink-2">{item.detail}</div>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onAction(item)}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-brand px-3.5 text-xs font-semibold text-white transition active:scale-95"
          >
            {item.cta}
            <Icon name="arrowRight" size={13} />
          </button>
          {onDismiss && (
            <button type="button" onClick={() => onDismiss(item.id)} className="text-xs font-medium text-ink-2 hover:text-ink">
              {t('Dismiss')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Greeting at the top of the brief. */
export function BriefHeader({ count }: { count: number }) {
  return (
    <div className="bg-brand-gradient flex items-center gap-3 rounded-3xl p-4 text-white shadow-raised">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15">
        <Icon name="sparkle" size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-white/70">{fullDate()}</span>
        <span className="block font-semibold">
          {count === 0 ? t('All clear for today 🎉') : count === 1 ? t('1 thing needs you today') : t('{n} things need you today', { n: count })}
        </span>
      </span>
    </div>
  )
}

// ------------------------------------------------------------------
// Monthly goal
// ------------------------------------------------------------------

export function GoalRing({ pct, size = 88, stroke = 9, light = false, children }: { pct: number; size?: number; stroke?: number; light?: boolean; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={light ? 'stroke-white/20' : 'stroke-canvas'} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className={cx('transition-all duration-700', pct >= 100 ? 'stroke-success' : 'stroke-coral')}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-center">{children ?? <span className="font-display text-lg font-bold">{pct}%</span>}</span>
    </span>
  )
}

export function useGoal() {
  const { goal, orders, products } = useStore()
  const sales = monthSales(orders, products)
  return { goal, sales, daysLeft: daysLeftInMonth(), ...goalProgress(goal, sales) }
}

/** Short line under the ring: pace or celebration. */
export function goalLine(g: ReturnType<typeof useGoal>) {
  if (g.reached) return t('Goal reached, well done! 🎉')
  return t('{left} to go · {d} days left · about {perDay} a day', { left: jd0(g.left), d: g.daysLeft, perDay: jd0(g.perDay) })
}

export function GoalForm({ onDone }: { onDone: () => void }) {
  const { setGoal, showToast } = useStore()
  const g = useGoal()
  const [value, setValue] = useState(String(g.goal))
  const n = parseInt(value.replace(/\D/g, '')) || 0
  const preview = goalProgress(n, g.sales)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-soft">
        <GoalRing pct={preview.pct} />
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-semibold">{t('{sales} sold so far', { sales: jd0(g.sales) })}</div>
          <div className="mt-0.5 text-xs leading-snug text-ink-2">
            {preview.reached ? t('You’ve already passed this goal 🎉') : t('{left} to go · about {perDay} a day', { left: jd0(preview.left), perDay: jd0(preview.perDay) })}
          </div>
        </div>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold">{t('Sales goal for {month}', { month: monthName() })}</span>
        <span className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-white px-4 focus-within:border-plum focus-within:ring-4 focus-within:ring-brand-soft">
          <span className="text-sm text-ink-2">{t('JD')}</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="numeric"
            dir="ltr"
            aria-label={t('Sales goal for {month}', { month: monthName() })}
            className="min-w-0 flex-1 bg-transparent font-display text-lg font-bold outline-none rtl:text-end"
          />
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        {(cloudEnabled ? [0.5, 1, 1.5, 2].map((k) => Math.max(100, Math.round((g.goal * k) / 100) * 100)) : [4500, 5000, 6000, 7500]).filter((v, i, all) => all.indexOf(v) === i).map((v) => (
          <Chip key={v} selected={n === v} onClick={() => setValue(String(v))}>
            {jd0(v)}
          </Chip>
        ))}
      </div>
      {!cloudEnabled && <p className="text-xs text-ink-2">{t('Tip: aim a little higher than last month (JD 3,820 in October).')}</p>}
      <Button
        icon="check"
        className="w-full"
        disabled={n <= 0}
        onClick={() => {
          setGoal(n)
          showToast(t('Goal set: {v}', { v: jd0(n) }))
          onDone()
        }}
      >
        {t('Save goal')}
      </Button>
    </div>
  )
}

// ------------------------------------------------------------------
// Product coach
// ------------------------------------------------------------------

export function CoachPill({ product }: { product: Product }) {
  const info = coachInfo[coachLabel(product)]
  return (
    <Pill tone={info.tone} dot={false}>
      <span aria-hidden="true">{info.emoji}</span>
      {t(info.label)}
    </Pill>
  )
}

/** The coach's advice for one product, with a one-tap fix when there is one. */
export function CoachCard({ product, onPromote, onPriceApplied }: { product: Product; onPromote?: () => void; onPriceApplied?: (price: number) => void }) {
  const { updateProduct, showToast, addTask } = useStore()
  const label = coachLabel(product)
  const info = coachInfo[label]
  const price = suggestedPrice(product)
  return (
    <div className="rounded-3xl bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon name="sparkle" size={16} className="text-coral" />
          {t('Product coach')}
        </span>
        <CoachPill product={product} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{coachTip(product)}</p>
      {label === 'underpriced' && (
        <Button
          size="md"
          variant="accent"
          className="mt-3 w-full"
          icon="trendUp"
          onClick={() => {
            updateProduct(product.id, { price })
            onPriceApplied?.(price)
            showToast(t('Price changed to {p}', { p: jd0(price) }))
          }}
        >
          {t('Use {p} as the new price', { p: jd0(price) })}
        </Button>
      )}
      {label === 'gem' && onPromote && (
        <button
          type="button"
          onClick={onPromote}
          style={waGreen}
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition hover:brightness-95 active:scale-[0.97]"
        >
          <Icon name="whatsapp" size={18} />
          {t('Promote to VIP customers')}
        </button>
      )}
      {label === 'star' && product.stock <= product.alertAt && (
        <Button
          size="md"
          variant="secondary"
          className="mt-3 w-full"
          icon="alarm"
          onClick={() => {
            addTask({ title: `Restock: ${product.name}`, meta: 'Suggested from low stock', time: '1:00 PM', when: 'today', state: 'todo', kind: 'reminder' })
            showToast(t('Restock reminder added to Planner'))
          }}
        >
          {t('Remind me to restock')}
        </Button>
      )}
    </div>
  )
}

// ------------------------------------------------------------------
// Customer groups
// ------------------------------------------------------------------

export function GroupChips({ value, onChange, customers }: { value: Group; onChange: (g: Group) => void; customers: Customer[] }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5">
      {groups.map((g) => {
        const n = customers.filter((c) => inGroup(c, g)).length
        return (
          <button
            key={g}
            type="button"
            aria-pressed={value === g}
            onClick={() => onChange(g)}
            className={cx(
              'inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-medium whitespace-nowrap transition active:scale-95',
              value === g ? 'bg-brand text-white' : 'bg-white text-ink ring-1 ring-line ring-inset',
            )}
          >
            {groupInfo[g].emoji && <span aria-hidden="true">{groupInfo[g].emoji}</span>}
            {t(groupInfo[g].label)}
            <span className={cx('text-xs', value === g ? 'text-white/70' : 'text-ink-2')}>{n}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Small group labels beside a customer's name. */
export function GroupTags({ customer }: { customer: Customer }) {
  const tags = (['vip', 'quiet', 'new'] as Group[]).filter((g) => inGroup(customer, g))
  if (!tags.length) return null
  return (
    <span className="inline-flex gap-1">
      {tags.map((g) => (
        <span
          key={g}
          className={cx(
            'rounded-full px-1.5 py-px text-[10px] font-semibold whitespace-nowrap',
            g === 'vip' ? 'bg-accent-soft text-coral' : g === 'quiet' ? 'bg-canvas text-ink-2' : 'bg-brand-soft text-plum',
          )}
        >
          {t(groupInfo[g].label)}
        </span>
      ))}
    </span>
  )
}

// ------------------------------------------------------------------
// Offer to a group — one WhatsApp message per customer, sent one by one
// ------------------------------------------------------------------

const nameToken = () => (getLang() === 'ar' ? '[الاسم]' : '[name]')

export function CampaignComposer({ initialGroup = 'quiet', productId, onDone }: { initialGroup?: Group; productId?: string; onDone: () => void }) {
  const { customers, products, businessName, logMessage, showToast, lang } = useStore()
  const product = products.find((p) => p.id === productId)
  const options: TemplateId[] = product ? ['promo', 'vip', 'winback', 'hello'] : ['winback', 'vip', 'hello']
  const pick = (g: Group): TemplateId => (product ? 'promo' : g === 'quiet' ? 'winback' : g === 'vip' ? 'vip' : 'hello')
  const [group, setGroup] = useState<Group>(initialGroup)
  const [tpl, setTpl] = useState<TemplateId>(pick(initialGroup))
  const [sent, setSent] = useState<string[]>([])
  const people = customers.filter((c) => inGroup(c, group))

  const generated = useMemo(() => {
    const token = nameToken()
    const placeholder: Customer = { id: '', name: token, phone: '', area: '', channel: 'WhatsApp', orders: 0, spent: 0 }
    return buildMessage(tpl, { customer: placeholder, products, business: businessName, product })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tpl, products, businessName, product, lang])
  const [text, setText] = useState(generated)
  useEffect(() => setText(generated), [generated])
  const box = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  const personal = (c: Customer) => text.split(nameToken()).join(t(c.name.split(' ')[0]))
  const send = (c: Customer) => {
    window.open(whatsappLink(c.phone, personal(c)), '_blank', 'noopener,noreferrer')
    logMessage({ customerId: c.id, template: tpl })
    setSent((s) => (s.includes(c.id) ? s : [...s, c.id]))
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-xs font-semibold">{t('Send to')}</div>
        <GroupChips
          value={group}
          onChange={(g) => {
            setGroup(g)
            setTpl(pick(g))
          }}
          customers={customers}
        />
        <p className="mt-1.5 text-[11px] text-ink-2">{t(groupInfo[group].hint)}</p>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold">{t('Message')}</div>
        <div className="flex flex-wrap gap-2">
          {options.map((id) => (
            <Chip key={id} selected={tpl === id} onClick={() => setTpl(id)}>
              {t(templateLabel[id])}
            </Chip>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: WA.chat }} className="rounded-2xl p-3">
        <div style={{ backgroundColor: WA.bubble }} className="ms-auto max-w-[92%] rounded-2xl rounded-se-md p-3 shadow-sm">
          <textarea
            ref={box}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            aria-label={t('Message')}
            className="block w-full resize-none overflow-hidden bg-transparent text-sm leading-relaxed text-ink outline-none"
          />
        </div>
      </div>
      <p className="text-[11px] text-ink-2">{t('{token} becomes each customer’s first name. Tap the message to edit it.', { token: nameToken() })}</p>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-semibold">
          <span>{people.length === 1 ? t('1 customer') : t('{n} customers', { n: people.length })}</span>
          <span className="text-success">{t('{s} of {n} sent', { s: people.filter((c) => sent.includes(c.id)).length, n: people.length })}</span>
        </div>
        <div className="space-y-2">
          {people.map((c) => {
            const done = sent.includes(c.id)
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-soft">
                <Avatar name={t(c.name)} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{t(c.name)}</span>
                  <span className="block truncate text-xs text-ink-2">{lastOrderText(c)}</span>
                </span>
                {done ? (
                  <span className="inline-flex h-8 items-center gap-1 rounded-full bg-success-soft px-3 text-xs font-semibold text-success">
                    <Icon name="check" size={14} />
                    {t('Sent')}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => send(c)}
                    style={waGreen}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white transition active:scale-95"
                  >
                    <Icon name="whatsapp" size={14} />
                    {t('Send')}
                  </button>
                )}
              </div>
            )
          })}
          {people.length === 0 && <p className="text-sm text-ink-2">{t('No customers in this group yet.')}</p>}
        </div>
      </div>

      <Button
        variant={sent.length ? 'primary' : 'secondary'}
        className="w-full"
        onClick={() => {
          if (sent.length) showToast(sent.length === 1 ? t('Offer sent to 1 customer') : t('Offer sent to {n} customers', { n: sent.length }))
          onDone()
        }}
      >
        {t('Finish')}
      </Button>
    </div>
  )
}
