// WhatsApp composer — pick a ready-made message, edit it, open WhatsApp with it typed in.
// Used as a bottom sheet on mobile and inside a modal on the desktop dashboard.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useStore, type SentMessage } from '../app/store'
import { t } from '../app/i18n'
import { buildMessage, customerTemplates, orderTemplates, templateLabel, whatsappLink, type TemplateId } from '../app/whatsapp'
import { Icon } from './Icon'
import { Avatar, cx } from './ui'

// WhatsApp colours are set as inline styles (not Tailwind classes) so they always render,
// whatever Tailwind setup the project runs on.
export const WA = { green: '#25D366', bubble: '#D9FDD3', chat: '#EFE7DD' }
export const waGreen = { backgroundColor: WA.green }

export function WhatsAppButton({ onClick, size = 'lg', className = '' }: { onClick: () => void; size?: 'lg' | 'md' | 'sm'; className?: string }) {
  const s = { lg: 'h-12 px-5 text-[15px]', md: 'h-10 px-4 text-sm', sm: 'h-8 px-3 text-xs' }[size]
  return (
    <button
      type="button"
      onClick={onClick}
      style={waGreen}
      className={cx('inline-flex items-center justify-center gap-2 rounded-full font-semibold text-white shadow-soft transition hover:brightness-95 active:scale-[0.97]', s, className)}
    >
      <Icon name="whatsapp" size={size === 'sm' ? 14 : 18} />
      {t('WhatsApp customer')}
    </button>
  )
}

export function WhatsAppComposer({ customerId, orderId, onDone }: { customerId: string; orderId?: string; onDone: () => void }) {
  const { customers, orders, products, businessName, logMessage, showToast, lang } = useStore()
  const customer = customers.find((c) => c.id === customerId)!
  const order = orders.find((o) => o.id === orderId)
  const options = order ? orderTemplates : customerTemplates
  const suggested: TemplateId = order ? (order.status === 'Shipped' ? 'delivery' : order.status === 'Delivered' ? 'thanks' : order.payment === 'Paid' ? 'confirm' : 'payment') : 'hello'
  const [tpl, setTpl] = useState<TemplateId>(suggested)
  const [text, setText] = useState('')
  const [phone, setPhone] = useState(customer.phone)
  const [otherNumber, setOtherNumber] = useState(false)
  const [copied, setCopied] = useState(false)
  const box = useRef<HTMLTextAreaElement>(null)
  // grow the message box to fit the whole text (wrapped lines included)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  const generated = useMemo(
    () => buildMessage(tpl, { customer, order, products, business: businessName }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tpl, customer, order, products, businessName, lang],
  )
  useEffect(() => setText(generated), [generated])

  const send = () => {
    window.open(whatsappLink(phone, text), '_blank', 'noopener,noreferrer')
    logMessage({ customerId, orderId, template: tpl })
    showToast(t('WhatsApp opened with your message'))
    onDone()
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      showToast(t('Couldn’t copy — select the text and copy it'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
        <Avatar name={t(customer.name)} size={40} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{t(customer.name)}</span>
          <span className="block text-xs text-ink-2" dir="ltr">
            +{phone.replace(/\D/g, '').replace(/^0/, '962 ')}
          </span>
        </span>
        <span style={waGreen} className="grid size-9 place-items-center rounded-full text-white">
          <Icon name="whatsapp" size={18} />
        </span>
      </div>

      {otherNumber ? (
        <label className="anim-rise block">
          <span className="mb-1.5 block text-xs font-semibold">{t('WhatsApp number')}</span>
          <input
            value={phone}
            dir="ltr"
            inputMode="tel"
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm outline-none focus:border-plum focus:ring-4 focus:ring-brand-soft"
          />
          <span className="mt-1 block text-[11px] text-ink-2">{t('Only for this message. The customer’s saved phone stays the same.')}</span>
        </label>
      ) : (
        <button type="button" onClick={() => setOtherNumber(true)} className="text-xs font-semibold text-success underline underline-offset-2">
          {t('Is their WhatsApp number different?')}
        </button>
      )}

      <div>
        <div className="mb-2 text-xs font-semibold">{t('Message')}</div>
        <div className="flex flex-wrap gap-2">
          {options.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTpl(id)}
              className={cx(
                'h-9 shrink-0 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition active:scale-95',
                tpl === id ? 'bg-brand text-white' : 'bg-white text-ink ring-1 ring-line ring-inset',
              )}
            >
              {t(templateLabel[id])}
              {id === suggested && tpl !== id && <span className="ms-1.5 text-[10px] text-coral">●</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Chat preview — the bubble is the editable message */}
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
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-ink-2">
            12:52 <Icon name="check" size={12} />
          </div>
        </div>
      </div>
      <p className="text-[11px] text-ink-2">{t('Tap the message to edit it. TALI opens WhatsApp with it ready — you press Send there.')}</p>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={copy}
          className="h-12 shrink-0 rounded-full bg-white px-4 text-sm font-semibold text-ink ring-1 ring-line ring-inset transition active:scale-95"
        >
          {copied ? t('Copied') : t('Copy')}
        </button>
        <button
          type="button"
          onClick={send}
          disabled={!text.trim()}
          style={waGreen}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-white shadow-soft transition active:scale-[0.97] disabled:opacity-40"
        >
          <Icon name="whatsapp" size={18} />
          {t('Send on WhatsApp')}
        </button>
      </div>
    </div>
  )
}

/** Mobile: composer as a bottom sheet over the current screen. */
export function WhatsAppSheet({ customerId, orderId, onClose }: { customerId: string; orderId?: string; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40">
      <button type="button" aria-label={t('Close')} onClick={onClose} className="anim-fade absolute inset-0 bg-burgundy/45" />
      <div role="dialog" aria-modal="true" className="anim-up no-scrollbar absolute inset-x-0 bottom-0 max-h-[88%] overflow-y-auto rounded-t-[32px] bg-subtle px-5 pt-3 pb-8 shadow-raised">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{t('Message on WhatsApp')}</h2>
          <button type="button" aria-label={t('Close')} onClick={onClose} className="grid size-9 place-items-center rounded-full bg-white shadow-soft">
            <Icon name="x" size={18} />
          </button>
        </div>
        <WhatsAppComposer customerId={customerId} orderId={orderId} onDone={onClose} />
      </div>
    </div>
  )
}

/** Small history line: "Last WhatsApp: Order confirmation · 12:41" */
export function LastMessage({ messages, orderId, customerId }: { messages: SentMessage[]; orderId?: string; customerId?: string }) {
  const m = messages.find((x) => (orderId ? x.orderId === orderId : x.customerId === customerId))
  if (!m) return null
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-2.5 text-xs font-medium text-success">
      <Icon name="whatsapp" size={15} />
      {t('Last WhatsApp: {name} · {time}', { name: t(templateLabel[m.template]), time: m.at })}
    </div>
  )
}
