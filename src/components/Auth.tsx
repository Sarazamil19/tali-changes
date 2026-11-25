// Sign in / create an account with a phone number and a 6-digit code sent on WhatsApp.
// The same form is used in the mobile app and on the web dashboard.
// In the demo (no database connected) any 6 digits work.
import { useEffect, useRef, useState } from 'react'
import { cloudEnabled, isValidPhone, sendCode, toE164, verifyCode } from '../app/cloud'
import { t } from '../app/i18n'
import { Icon } from './Icon'
import { Button, Field, cx } from './ui'
import { WA } from './WhatsApp'

export function PhoneCodeForm({ submitLabel, onSignedIn }: { submitLabel: string; onSignedIn: () => void }) {
  const [phone, setPhone] = useState(cloudEnabled ? '' : '+962 79 555 0100')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [wait, setWait] = useState(0)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (wait <= 0) return
    const id = window.setTimeout(() => setWait((w) => w - 1), 1000)
    return () => window.clearTimeout(id)
  }, [wait])

  const send = async () => {
    setError('')
    if (!isValidPhone(phone)) {
      setError(t('Please enter a valid phone number, e.g. 079 555 0100'))
      return
    }
    setBusy(true)
    try {
      await sendCode(phone)
      setStep('code')
      setWait(30)
      // the demo fills in a code so the prototype can be clicked through
      setCode(cloudEnabled ? ['', '', '', '', '', ''] : ['4', '8', '2', '1', '9', '6'])
      if (cloudEnabled) window.setTimeout(() => refs.current[0]?.focus(), 50)
    } catch (e) {
      setError(t('We couldn’t send the code: {e}', { e: (e as Error).message }))
    } finally {
      setBusy(false)
    }
  }

  const verify = async (digits: string[]) => {
    setError('')
    setBusy(true)
    try {
      await verifyCode(phone, digits.join(''))
      onSignedIn()
    } catch {
      setError(t('That code didn’t work. Check it and try again, or send a new one.'))
      setCode(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setBusy(false)
    }
  }

  const setDigit = (i: number, v: string) => {
    const digits = v.replace(/\D/g, '')
    if (digits.length > 1) {
      // pasted or auto-filled code
      const next = digits.slice(0, 6).padEnd(6, ' ').split('').map((d) => d.trim())
      setCode(next)
      if (next.every(Boolean)) verify(next)
      else refs.current[Math.min(digits.length, 5)]?.focus()
      return
    }
    const next = code.map((x, j) => (j === i ? digits : x))
    setCode(next)
    if (digits && i < 5) refs.current[i + 1]?.focus()
    if (next.every(Boolean)) verify(next)
  }

  return (
    <div className="space-y-4">
      <Field label={t('Phone number')} value={phone} onChange={setPhone} inputMode="tel" placeholder="079 555 0100" />
      {step === 'phone' && (
        <Button className="w-full" disabled={busy} onClick={send}>
          <span style={{ color: WA.green }} className="grid size-6 place-items-center rounded-full bg-white">
            <Icon name="whatsapp" size={15} />
          </span>
          {busy ? t('Sending…') : t('Send code on WhatsApp')}
        </Button>
      )}
      {step === 'code' && (
        <div className="anim-rise space-y-3">
          <div className="text-xs font-semibold">{t('Enter the 6-digit code we sent to {phone} on WhatsApp', { phone: `\u2066${toE164(phone)}\u2069` })}</div>
          <div className="flex gap-2" dir="ltr">
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el
                }}
                value={d}
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                aria-label={t('Digit {n}', { n: i + 1 })}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && refs.current[i - 1]?.focus()}
                className={cx(
                  'h-14 w-full min-w-0 rounded-2xl border border-line bg-white text-center font-display text-xl font-semibold outline-none transition focus:border-coral focus:ring-4 focus:ring-accent-soft',
                  busy && 'opacity-60',
                )}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-ink-2">
            <span className="flex items-center gap-1.5">
              <Icon name="clock" size={14} />
              {wait > 0 ? t('Resend code in 0:{s}', { s: String(wait).padStart(2, '0') }) : t('Didn’t get it?')}
            </span>
            <span className="flex gap-3">
              <button type="button" className="font-semibold text-burgundy" onClick={() => setStep('phone')}>
                {t('Change number')}
              </button>
              {wait <= 0 && (
                <button type="button" className="font-semibold text-coral" onClick={send}>
                  {t('Resend')}
                </button>
              )}
            </span>
          </div>
          <Button icon="check" className="w-full" disabled={busy || !code.every(Boolean)} onClick={() => verify(code)}>
            {busy ? t('Checking…') : submitLabel}
          </Button>
          {!cloudEnabled && <p className="text-center text-[11px] text-ink-2">{t('Demo: any 6 digits work.')}</p>}
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-2xl bg-error-soft px-3 py-2.5 text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  )
}
