// Building blocks for the desktop dashboard (Figma page "web dashboard").
import { useEffect, type ReactNode } from 'react'
import { t, type Lang } from '../app/i18n'
import { Icon, type IconName } from '../components/Icon'
import { cx } from '../components/ui'

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={cx('rounded-3xl bg-white p-4 shadow-soft sm:p-6', className)}>{children}</section>
}

export function PanelHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-xs text-ink-2">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export function PageTitle({ title, subtitle, actions, kicker }: { title: ReactNode; subtitle?: string; actions?: ReactNode; kicker?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 lg:mb-6">
      <div>
        {kicker}
        <h1 className="font-display text-2xl leading-tight font-semibold text-ink sm:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}

export function Sparkline({ up = true, light = false }: { up?: boolean; light?: boolean }) {
  const d = up ? 'M2 26 C 14 24, 20 10, 32 14 S 50 22, 62 12 S 74 4, 78 2' : 'M2 6 C 14 8, 20 20, 32 16 S 50 8, 62 18 S 74 26, 78 26'
  return (
    <svg width="80" height="30" viewBox="0 0 80 30" fill="none" aria-hidden="true">
      <path d={d} stroke={light ? '#fff' : '#E46D50'} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function KpiCard({
  label,
  value,
  delta,
  foot,
  icon,
  hero = false,
  up = true,
}: {
  label: string
  value: string
  delta?: string | null
  foot: string
  icon: IconName
  hero?: boolean
  up?: boolean
}) {
  return (
    <div className={cx('min-w-0 rounded-3xl p-4 sm:p-5', hero ? 'bg-brand-gradient text-white shadow-raised' : 'bg-white shadow-soft')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2.5 text-sm">
          <span className={cx('grid size-8 place-items-center rounded-xl', hero ? 'bg-white/15' : 'bg-brand-soft text-plum')}>
            <Icon name={icon} size={16} />
          </span>
          <span className={cx('truncate', hero ? 'text-white/85' : 'text-ink-2')}>{label}</span>
        </span>
        {delta && (
          <span
            className={cx(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              hero ? 'bg-white/15' : up ? 'bg-success-soft text-success' : 'bg-accent-soft text-coral',
            )}
          >
            <Icon name={up ? 'trendUp' : 'trendDown'} size={12} />
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4 font-display text-2xl leading-none font-bold sm:text-[30px]">{value}</div>
      <div className="mt-3 flex items-end justify-between">
        <span className={cx('text-xs', hero ? 'text-white/70' : 'text-ink-2')}>{foot}</span>
        <span className="hidden sm:block">
          <Sparkline up={up} light={hero} />
        </span>
      </div>
    </div>
  )
}

/** Donut made of SVG arcs (values are percentages that add up to 100). */
export function Donut({ parts, center, sub }: { parts: { value: number; color: string }[]; center: string; sub: string }) {
  const r = 70
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="relative mx-auto size-[180px]">
      <svg viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#f4e9dd" strokeWidth="18" />
        {parts.map((p, i) => {
          const len = (p.value / 100) * c
          const el = (
            <circle
              key={i}
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth="18"
              strokeDasharray={`${Math.max(0, len - 4)} ${c}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="anim-fade"
            />
          )
          offset += len
          return el
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-xl font-bold">{center}</div>
          <div className="text-xs text-ink-2">{sub}</div>
        </div>
      </div>
    </div>
  )
}

export function Bar({ value, max, color = 'bg-plum' }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
      <div className={cx('h-full rounded-full transition-all duration-500', color)} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  )
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <th className={cx('bg-subtle px-2 py-3 sm:px-4 text-start text-[11px] font-semibold tracking-wide text-ink-2 uppercase first:rounded-s-xl last:rounded-e-xl', className)}>{children}</th>
}

export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={cx('border-b border-line px-2 py-3.5 text-sm sm:px-4', className)}>{children}</td>
}

export function LangToggle({ lang, setLang, compact = false }: { lang: Lang; setLang: (l: Lang) => void; compact?: boolean }) {
  return (
    <div className={cx('flex rounded-full bg-canvas p-1', compact ? 'text-xs' : 'text-sm')} dir="ltr">
      {(
        [
          ['en', 'English'],
          ['ar', 'عربي'],
        ] as [Lang, string][]
      ).map(([l, label]) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cx('rounded-full font-medium transition', compact ? 'px-2.5 py-1.5' : 'px-4 py-1.5', lang === l ? 'bg-white text-burgundy shadow-soft' : 'text-ink-2', l === 'ar' && 'font-arabic')}
        >
          {compact ? (l === 'en' ? 'EN' : 'ع') : label}
        </button>
      ))}
    </div>
  )
}

export function Modal({ title, onClose, children, footer, wide = false }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label={t('Close')} onClick={onClose} className="anim-fade absolute inset-0 bg-burgundy/40" />
      <div role="dialog" aria-modal="true" className={cx('anim-rise relative flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-subtle shadow-raised sm:rounded-3xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button type="button" aria-label={t('Close')} onClick={onClose} className="grid size-9 place-items-center rounded-full bg-white text-ink shadow-soft">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2.5 border-t border-line px-5 py-4 pb-6 sm:px-6 sm:pb-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40">
      <button type="button" aria-label={t('Close')} onClick={onClose} className="anim-fade absolute inset-0 bg-burgundy/30" />
      <aside className="anim-drawer absolute inset-y-0 end-0 flex w-full flex-col bg-subtle shadow-raised sm:w-[420px]">{children}</aside>
    </div>
  )
}
