import { useEffect, useRef, useState } from 'react'
import { useStore } from '../app/store'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { Button, Chip, Field, Footer, Screen, Scroll, StatusSpacer, TopBar, cx } from '../components/ui'

// M0 · Splash — logo scales in, then fades to Welcome
export function Splash() {
  const { replace } = useStore()
  useEffect(() => {
    const t = window.setTimeout(() => replace({ name: 'welcome' }, 'fade'), 1700)
    return () => window.clearTimeout(t)
  }, [replace])
  return (
    <Screen className="bg-brand-gradient">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-white">
        <div className="anim-logo">
          <Logo height={80} />
        </div>
        <p className="anim-rise text-sm text-white/80" style={{ animationDelay: '0.35s' }}>
          Every step takes you further
        </p>
      </div>
    </Screen>
  )
}

// M1 · Welcome
export function Welcome() {
  const { push, reset, setGuest, setFirstUse } = useStore()
  return (
    <Screen className="bg-brand-gradient text-white">
      <div
        className="pointer-events-none absolute -top-24 -right-24 size-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgb(228 109 80 / 0.38), transparent 65%)' }}
      />
      <StatusSpacer />
      <div className="relative px-6">
        <Logo height={44} />
      </div>

      <div className="relative h-[250px]">
        <div
          className="anim-float absolute top-10 left-[66px] w-[244px] rounded-3xl border border-white/25 bg-white/12 p-5 backdrop-blur-md"
          style={{ ['--r' as string]: '-6deg' }}
        >
          <div className="text-xs text-white/70">Sales this month</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-display text-[30px] font-bold">JD 4,280</span>
            <span className="rounded-full bg-coral px-2 py-0.5 text-[11px] font-semibold">▲ 12%</span>
          </div>
        </div>
        <div
          className="anim-float absolute top-[150px] left-7 flex w-[240px] items-center gap-3 rounded-2xl bg-white p-3 text-ink shadow-raised"
          style={{ ['--r' as string]: '-3deg', animationDelay: '1.2s' }}
        >
          <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-plum">
            <Icon name="truck" size={18} />
          </span>
          <div>
            <div className="text-sm font-semibold">3 deliveries today</div>
            <div className="text-xs text-ink-2">Next: Dana Saleh · 9:30 AM</div>
          </div>
        </div>
      </div>

      <div className="relative mt-auto space-y-3 px-6 pb-10">
        <h1 className="anim-rise font-display text-[34px] leading-[1.15] font-semibold">Your whole business, in one calm place.</h1>
        <p className="anim-rise text-sm text-white/75" style={{ animationDelay: '0.1s' }}>
          Orders, stock, customers and profit. No spreadsheets, no lost WhatsApp messages.
        </p>
        <div className="space-y-2.5 pt-3">
          <Button variant="accent" className="w-full" onClick={() => push({ name: 'setup' })}>
            Start now, no account needed
          </Button>
          <button
            type="button"
            onClick={() => {
              setGuest(false)
              setFirstUse(false)
              reset({ name: 'home' })
            }}
            className="h-12 w-full rounded-full border border-white/40 text-[15px] font-semibold transition hover:bg-white/10 active:scale-[0.97]"
          >
            I already have an account
          </button>
        </div>
        <p className="pt-1 text-center text-xs text-white/70">
          English · <span className="font-arabic">عربي</span>
        </p>
      </div>
    </Screen>
  )
}

// M9 · Quick setup
export function QuickSetup() {
  const { businessName, setBusinessName, reset, setFirstUse, setGuest } = useStore()
  const [sell, setSell] = useState('Candles & home')
  const [lang, setLang] = useState<'en' | 'ar'>('en')
  const go = () => {
    setGuest(true)
    setFirstUse(true)
    reset({ name: 'home' }, 'fade')
  }
  return (
    <Screen>
      <StatusSpacer />
      <TopBar right={<button type="button" onClick={go} className="text-sm font-medium text-ink-2">Skip</button>} />
      <Scroll className="space-y-5 pt-5">
        <div>
          <h1 className="font-display text-[28px] font-bold">Set up your business</h1>
          <p className="mt-1 text-sm text-ink-2">Takes about 30 seconds. No account needed.</p>
        </div>
        <Field label="Business name" value={businessName} onChange={setBusinessName} />
        <div>
          <div className="mb-2 text-xs font-semibold">What do you sell?</div>
          <div className="flex flex-wrap gap-2">
            {['Candles & home', 'Food & sweets', 'Fashion', 'Beauty', 'Handmade gifts', 'Other'].map((s) => (
              <Chip key={s} selected={sell === s} onClick={() => setSell(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold">App language</div>
          <div className="flex gap-2">
            <Chip selected={lang === 'en'} onClick={() => setLang('en')}>
              English
            </Chip>
            <Chip selected={lang === 'ar'} onClick={() => setLang('ar')}>
              <span className="font-arabic">العربية</span>
            </Chip>
          </div>
        </div>
        <Field label="Currency" value="Jordanian dinar (JD)" />
      </Scroll>
      <Footer>
        <Button icon="arrowRight" className="w-full" onClick={go}>
          Go to my dashboard
        </Button>
      </Footer>
    </Screen>
  )
}

// M12 · Create account
export function CreateAccount() {
  const { reset, setGuest, showToast, orders } = useStore()
  const [phone, setPhone] = useState('+962 79 555 0100')
  const [code, setCode] = useState(['4', '8', '2', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const done = code.every(Boolean)

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1)
    setCode((c) => c.map((x, j) => (j === i ? d : x)))
    if (d && i < 5) refs.current[i + 1]?.focus()
  }

  return (
    <Screen>
      <StatusSpacer />
      <TopBar />
      <Scroll className="space-y-5 pt-5">
        <div>
          <h1 className="font-display text-[28px] font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-ink-2">Your orders, products and customers will be saved to your account.</p>
        </div>
        <Field label="Phone number" value={phone} onChange={setPhone} inputMode="tel" />
        <div>
          <div className="mb-2 text-xs font-semibold">Enter the 6-digit code we sent</div>
          <div className="flex gap-2">
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el
                }}
                value={d}
                inputMode="numeric"
                aria-label={`Digit ${i + 1}`}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && refs.current[i - 1]?.focus()}
                className={cx(
                  'h-14 w-full rounded-2xl border bg-white text-center font-display text-xl font-semibold outline-none transition focus:border-coral focus:ring-4 focus:ring-accent-soft',
                  d ? 'border-line' : 'border-line',
                )}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-2">
            <Icon name="clock" size={14} /> Resend code in 0:30
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-3 text-xs font-medium text-success">
          <Icon name="check" size={16} /> Your {orders.length + 7} guest orders will move into this account.
        </div>
      </Scroll>
      <Footer>
        <p className="text-center text-xs text-ink-2">By continuing you agree to the Terms and Privacy Policy.</p>
        <Button
          icon="check"
          className="w-full"
          disabled={!done}
          onClick={() => {
            setGuest(false)
            reset({ name: 'home' })
            showToast('Account created · your data is backed up')
          }}
        >
          Create account &amp; keep my data
        </Button>
      </Footer>
    </Screen>
  )
}

// M11 · Back-up bottom sheet (slides up over the current screen)
export function BackupSheet() {
  const { sheet, closeSheet, push, orders } = useStore()
  const [closing, setClosing] = useState(false)
  if (!sheet) return null
  const close = (after?: () => void) => {
    setClosing(true)
    window.setTimeout(() => {
      setClosing(false)
      closeSheet()
      after?.()
    }, 220)
  }
  return (
    <div className="absolute inset-0 z-40">
      <button
        type="button"
        aria-label="Close"
        onClick={() => close()}
        className={cx('absolute inset-0 bg-burgundy/45 transition-opacity duration-200', closing ? 'opacity-0' : 'anim-fade')}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'absolute inset-x-0 bottom-0 rounded-t-[32px] bg-white px-6 pt-3 pb-9 text-center shadow-raised transition-transform duration-200',
          closing ? 'translate-y-full' : 'anim-up',
        )}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line" />
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-coral">
          <Icon name="sparkle" size={26} />
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold">Back up your {orders.length + 7} orders</h2>
        <p className="mt-2 text-sm text-ink-2">
          Right now everything lives on this phone. A free account keeps it safe and lets you use TALI on your computer too.
        </p>
        <ul className="mt-5 space-y-3 text-left">
          {['Orders, products and customers are kept', 'Open the web dashboard on your computer', 'Connect Instagram or your website'].map((t) => (
            <li key={t} className="flex items-center gap-3 text-sm">
              <span className="grid size-6 place-items-center rounded-full bg-success-soft text-success">
                <Icon name="check" size={14} />
              </span>
              {t}
            </li>
          ))}
        </ul>
        <Button className="mt-6 w-full" onClick={() => close(() => push({ name: 'createAccount' }))}>
          Create free account
        </Button>
        <Button variant="ghost" className="mt-1 w-full" onClick={() => close()}>
          Not now
        </Button>
      </div>
    </div>
  )
}
