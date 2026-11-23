// Shared forms used on mobile (inside a bottom sheet) and on desktop (inside a modal):
// - NewCustomerForm: add a customer (from New order or Customers)
// - StatusPicker: choose an order's status directly instead of tapping through each step
import { useState, type ReactNode } from 'react'
import { useStore } from '../app/store'
import type { Channel, OrderStatus } from '../app/data'
import { t } from '../app/i18n'
import { Icon } from './Icon'
import { Button, Chip, Field, cx } from './ui'

/** Mobile bottom sheet that slides up over the current screen. */
export function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-40">
      <button type="button" aria-label={t('Close')} onClick={onClose} className="anim-fade absolute inset-0 bg-burgundy/45" />
      <div role="dialog" aria-modal="true" className="anim-up no-scrollbar absolute inset-x-0 bottom-0 max-h-[88%] overflow-y-auto rounded-t-[32px] bg-subtle px-5 pt-3 pb-8 shadow-raised">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button type="button" aria-label={t('Close')} onClick={onClose} className="grid size-9 place-items-center rounded-full bg-white shadow-soft">
            <Icon name="x" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// New customer
// ------------------------------------------------------------------
const channels: Channel[] = ['Instagram', 'WhatsApp', 'Website', 'In person']

export function NewCustomerForm({ onSaved }: { onSaved: (id: string) => void }) {
  const { addCustomer, showToast } = useStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [area, setArea] = useState('')
  const [channel, setChannel] = useState<Channel>('Instagram')
  const digits = phone.replace(/\D/g, '')
  const phoneOk = digits.length >= 9
  const valid = name.trim().length > 1 && phoneOk

  return (
    <div className="space-y-4">
      <Field label={t('Full name')} value={name} onChange={setName} placeholder={t('e.g. Sara Nasser')} />
      <div>
        <Field label={t('Phone number')} value={phone} onChange={setPhone} placeholder="079 123 4567" inputMode="tel" />
        {phone && !phoneOk && <p className="mt-1 text-xs text-error">{t('Enter a full phone number')}</p>}
      </div>
      <Field label={t('Area (optional)')} value={area} onChange={setArea} placeholder={t('e.g. Amman, Khalda')} />
      <div>
        <div className="mb-2 text-xs font-semibold">{t('Where do they order from?')}</div>
        <div className="flex flex-wrap gap-2">
          {channels.map((c) => (
            <Chip key={c} selected={channel === c} onClick={() => setChannel(c)}>
              {t(c)}
            </Chip>
          ))}
        </div>
      </div>
      <Button
        icon="check"
        className="w-full"
        disabled={!valid}
        onClick={() => {
          const id = addCustomer({ name: name.trim(), phone: phone.trim(), area: area.trim() || '—', channel })
          showToast(t('{name} added', { name: name.trim() }))
          onSaved(id)
        }}
      >
        {t('Save customer')}
      </Button>
    </div>
  )
}

// ------------------------------------------------------------------
// Order status picker
// ------------------------------------------------------------------
const flow: OrderStatus[] = ['New', 'Confirmed', 'Processing', 'Shipped', 'Delivered']
const hint: Record<OrderStatus, string> = {
  New: 'Just received',
  Confirmed: 'Details agreed with the customer',
  Processing: 'Being made or packed',
  Shipped: 'With the courier',
  Delivered: 'In the customer’s hands',
  Cancelled: 'Order won’t go ahead',
}

export function StatusPicker({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  const { orders, setOrderStatus, showToast } = useStore()
  const order = orders.find((o) => o.id === orderId)
  if (!order) return null
  const current = flow.indexOf(order.status)

  const choose = (s: OrderStatus) => {
    if (s !== order.status) {
      setOrderStatus(order.id, s)
      showToast(t('Order #{id} marked as {status}', { id: order.id, status: t(s) }))
    }
    onDone()
  }

  return (
    <div>
      <ol className="relative">
        {flow.map((s, i) => {
          const done = current >= 0 && i < current
          const active = s === order.status
          return (
            <li key={s} className="relative">
              {i < flow.length - 1 && (
                <span className={cx('absolute start-[19px] top-10 h-[calc(100%-24px)] w-0.5', done || active ? 'bg-coral' : 'bg-line')} />
              )}
              <button
                type="button"
                onClick={() => choose(s)}
                className={cx('flex w-full items-center gap-3 rounded-2xl p-1.5 text-start transition', active ? 'bg-brand-soft' : 'hover:bg-white')}
              >
                <span
                  className={cx(
                    'relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2 ms-1.5',
                    active ? 'border-coral bg-coral text-white' : done ? 'border-coral bg-white text-coral' : 'border-line bg-white',
                  )}
                >
                  {(done || active) && <Icon name="check" size={14} strokeWidth={2.6} />}
                </span>
                <span className="flex-1 py-1.5">
                  <span className={cx('block text-sm', active ? 'font-semibold text-burgundy' : 'font-medium')}>{t(s)}</span>
                  <span className="block text-xs text-ink-2">{t(hint[s])}</span>
                </span>
                {active && <span className="me-2 text-xs font-semibold text-coral">{t('Current')}</span>}
              </button>
            </li>
          )
        })}
      </ol>
      <button
        type="button"
        onClick={() => choose('Cancelled')}
        className={cx(
          'mt-4 flex w-full items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold transition',
          order.status === 'Cancelled' ? 'border-error bg-error-soft text-error' : 'border-error/40 text-error hover:bg-error-soft',
        )}
      >
        <Icon name="x" size={16} />
        {order.status === 'Cancelled' ? t('Order is cancelled') : t('Cancel order')}
      </button>
    </div>
  )
}
