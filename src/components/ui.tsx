import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { useStore, type TabName } from '../app/store'
import type { OrderStatus } from '../app/data'
import { initials as toInitials } from '../app/data'
import { t } from '../app/i18n'

// ------------------------------------------------------------------
// Tones — the soft-background / strong-foreground pairs used for
// icon boxes, pills and badges throughout the Figma screens.
// ------------------------------------------------------------------
export type Tone = 'plum' | 'coral' | 'neutral' | 'success' | 'error'

const toneBox: Record<Tone, string> = {
  plum: 'bg-brand-soft text-plum',
  coral: 'bg-accent-soft text-coral',
  neutral: 'bg-canvas text-burgundy',
  success: 'bg-success-soft text-success',
  error: 'bg-error-soft text-error',
}

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

// ------------------------------------------------------------------
// Layout
// ------------------------------------------------------------------

export function Screen({ children, className = 'bg-subtle' }: { children: ReactNode; className?: string }) {
  return <div className={cx('absolute inset-0 flex flex-col overflow-hidden', className)}>{children}</div>
}

export function Scroll({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={cx('no-scrollbar flex-1 overflow-y-auto px-5 pb-6', className)}>{children}</div>
}

export function CircleButton({
  icon,
  label,
  onClick,
  variant = 'light',
  size = 44,
}: {
  icon: IconName
  label: string
  onClick?: () => void
  variant?: 'light' | 'brand' | 'glass'
  size?: number
}) {
  const styles = {
    light: 'bg-white text-ink shadow-soft',
    brand: 'bg-brand text-white shadow-soft',
    glass: 'bg-white/15 text-white',
  }[variant]
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={cx('grid place-items-center rounded-full transition active:scale-90', styles)}
    >
      <Icon name={icon} size={20} />
    </button>
  )
}

export function TopBar({ title, subtitle, right, onBack }: { title?: string; subtitle?: string; right?: ReactNode; onBack?: () => void }) {
  const { back } = useStore()
  return (
    <div className="flex h-11 shrink-0 items-center justify-between px-5 pt-0">
      <CircleButton icon="arrowLeft" label={t('Back')} onClick={onBack ?? back} />
      {title ? (
        <div className="text-center">
          <div className="font-display text-[17px] font-semibold text-ink">{title}</div>
          {subtitle && <div className="text-xs text-ink-2">{subtitle}</div>}
        </div>
      ) : (
        <span />
      )}
      <div className="flex min-w-11 justify-end">{right}</div>
    </div>
  )
}

export function StatusSpacer() {
  return <div className="h-14 shrink-0" />
}

export function TitleBar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center justify-between px-5 pb-3">
      <h1 className="font-display text-[28px] leading-tight font-bold text-ink">{title}</h1>
      {right}
    </div>
  )
}

export function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 shrink-0 space-y-2.5 rounded-t-[28px] bg-white px-5 pt-4 pb-8 shadow-raised">{children}</div>
  )
}

// ------------------------------------------------------------------
// Controls
// ------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'accent' | 'ghost'

export function Button({
  children,
  icon,
  variant = 'primary',
  onClick,
  disabled,
  className = '',
  size = 'lg',
}: {
  children: ReactNode
  icon?: IconName
  variant?: ButtonVariant
  onClick?: () => void
  disabled?: boolean
  className?: string
  size?: 'lg' | 'md' | 'sm'
}) {
  const v = {
    primary: 'bg-brand-gradient text-white hover:brightness-125',
    secondary: 'bg-canvas text-burgundy hover:bg-[#efdfd0]',
    outline: 'bg-white text-ink border border-line hover:border-blush',
    accent: 'bg-coral text-white shadow-glow hover:brightness-105',
    ghost: 'bg-transparent text-ink-2 hover:text-ink',
  }[variant]
  const s = { lg: 'h-12 px-5 text-[15px]', md: 'h-10 px-4 text-sm', sm: 'h-8 px-3.5 text-xs' }[size]
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
        v,
        s,
        className,
      )}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 18} />}
      {children}
    </button>
  )
}

export function Chip({ children, selected, onClick }: { children: ReactNode; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium transition duration-200 active:scale-95',
        selected ? 'bg-brand text-white ring-1 ring-brand' : 'bg-white text-ink ring-1 ring-line ring-inset hover:ring-blush',
      )}
    >
      {children}
    </button>
  )
}

export function Segmented<T extends string>({
  items,
  value,
  onChange,
  className = '',
}: {
  items: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cx('flex rounded-full bg-canvas p-1', className)}>
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={cx(
            'h-9 flex-1 rounded-full text-sm font-medium transition-all duration-200',
            it.value === value ? 'bg-white text-burgundy shadow-soft' : 'text-ink-2 hover:text-ink',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

export function UnderlineTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-6 border-b border-line">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={cx(
            'relative pb-2.5 text-sm font-medium transition-colors',
            it.value === value ? 'text-burgundy' : 'text-ink-2 hover:text-ink',
          )}
        >
          {it.label}
          <span
            className={cx(
              'absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-burgundy transition-transform duration-300',
              it.value === value ? 'scale-x-100' : 'scale-x-0',
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  inputMode,
  helper,
}: {
  label?: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  prefix?: string
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel'
  helper?: string
}) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-ink">{label}</span>}
      <span className="flex h-12 items-center gap-1.5 rounded-2xl border border-line bg-white px-4 transition focus-within:border-plum focus-within:ring-4 focus-within:ring-brand-soft">
        {prefix && <span className="text-sm text-ink-2">{prefix}</span>}
        <input
          value={value}
          inputMode={inputMode}
          placeholder={placeholder}
          readOnly={!onChange}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full min-w-0 bg-transparent text-sm text-ink outline-none"
        />
      </span>
      {helper && <span className="mt-1 block text-xs text-ink-2">{helper}</span>}
    </label>
  )
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-11 items-center gap-2.5 rounded-2xl bg-white px-4 shadow-soft transition focus-within:ring-2 focus-within:ring-plum">
      <Icon name="search" size={18} className="text-ink-2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none"
      />
      {value && (
        <button type="button" aria-label={t('Clear')} onClick={() => onChange('')} className="text-ink-2">
          <Icon name="x" size={16} />
        </button>
      )}
    </label>
  )
}

// ------------------------------------------------------------------
// Display
// ------------------------------------------------------------------

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cx(
        'block w-full rounded-[20px] bg-white text-start shadow-soft',
        onClick && 'transition active:scale-[0.98]',
        className,
      )}
    >
      {children}
    </Comp>
  )
}

export function IconBox({ icon, tone = 'neutral', size = 40, radius = 12 }: { icon: IconName; tone?: Tone; size?: number; radius?: number }) {
  return (
    <span className={cx('grid shrink-0 place-items-center', toneBox[tone])} style={{ width: size, height: size, borderRadius: radius }}>
      <Icon name={icon} size={Math.round(size / 2)} />
    </span>
  )
}

export function Avatar({ name, size = 40, light = false }: { name: string; size?: number; light?: boolean }) {
  return (
    <span
      className={cx('grid shrink-0 place-items-center rounded-full font-semibold text-plum', light ? 'bg-white' : 'bg-brand-soft')}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {toInitials(name)}
    </span>
  )
}

export function Pill({ tone, children, dot = true }: { tone: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cx('inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold', toneBox[tone])}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

const statusTone: Record<OrderStatus, Tone> = {
  New: 'plum',
  Confirmed: 'success',
  Processing: 'coral',
  Shipped: 'neutral',
  Delivered: 'success',
  Cancelled: 'error',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Pill tone={statusTone[status]}>{t(status)}</Pill>
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-1 flex items-center justify-between">
      <span className="text-xs font-semibold tracking-wide text-ink-2 uppercase">{children}</span>
      {right}
    </div>
  )
}

export function ListRow({
  icon,
  tone = 'neutral',
  title,
  subtitle,
  right,
  onClick,
  last,
  chevron = true,
}: {
  icon?: IconName
  tone?: Tone
  title: string
  subtitle?: string
  right?: ReactNode
  onClick?: () => void
  last?: boolean
  chevron?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx('flex w-full items-center gap-3 py-3 text-start transition active:opacity-60', !last && 'border-b border-line')}
    >
      {icon && <IconBox icon={icon} tone={tone} size={38} />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{title}</span>
        {subtitle && <span className="block truncate text-xs text-ink-2">{subtitle}</span>}
      </span>
      {right}
      {chevron && <Icon name="chevronRight" size={18} className="text-ink-2" />}
    </button>
  )
}

// ------------------------------------------------------------------
// Tab bar — Home · Orders · (+) · Products · More
// ------------------------------------------------------------------

export function TabBar({ active }: { active?: TabName }) {
  const { tab, startOrder } = useStore()
  const items: { key: TabName; label: string; icon: IconName }[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'orders', label: 'Orders', icon: 'orders' },
    { key: 'products', label: 'Products', icon: 'products' },
    { key: 'more', label: 'More', icon: 'more' },
  ]
  const Item = ({ it }: { it: (typeof items)[number] }) => {
    const on = it.key === active
    return (
      <button
        type="button"
        onClick={() => !on && tab(it.key)}
        className={cx('flex w-16 flex-col items-center gap-1 pt-1 transition', on ? 'text-burgundy' : 'text-ink-2 hover:text-ink')}
      >
        <Icon name={it.icon} size={22} />
        <span className={cx('text-[11px]', on ? 'font-semibold' : 'font-medium')}>{t(it.label)}</span>
        <span className={cx('size-1 rounded-full bg-coral transition', on ? 'opacity-100' : 'opacity-0')} />
      </button>
    )
  }
  return (
    <nav className="relative z-10 flex shrink-0 items-start justify-around rounded-t-[28px] bg-white px-3 pt-2.5 pb-7 shadow-raised">
      <Item it={items[0]} />
      <Item it={items[1]} />
      <button
        type="button"
        aria-label={t('New order')}
        onClick={() => startOrder()}
        className="-mt-1 grid size-14 place-items-center rounded-full bg-coral text-white shadow-glow transition hover:scale-105 active:scale-90"
      >
        <Icon name="plus" size={26} />
      </button>
      <Item it={items[2]} />
      <Item it={items[3]} />
    </nav>
  )
}

export { cx }
