// Desktop Planner — week calendar + tasks (Figma: "Planner · Calendar" / "Planner · Tasks")
import { useState } from 'react'
import { useStore } from '../app/store'
import type { Task } from '../app/data'
import { t, tParts } from '../app/i18n'
import { Icon, type IconName } from '../components/Icon'
import { Button, Segmented, UnderlineTabs, cx } from '../components/ui'
import { PageTitle, Panel } from './kit'
import type { WebNav } from './WebApp'

type Kind = 'delivery' | 'task' | 'reminder'
type Ev = { day: number; start: number; end: number; title: string; meta: string; kind: Kind }

const baseWeek: Ev[] = [
  { day: 0, start: 9.5, end: 10.5, title: 'Deliver #TL-1046', meta: 'Dana Saleh · Khalda', kind: 'delivery' },
  { day: 0, start: 11.25, end: 12.25, title: 'Call supplier', meta: 'Packaging quote', kind: 'task' },
  { day: 0, start: 13, end: 14, title: 'Restock lavender salts', meta: 'Only 3 left', kind: 'reminder' },
  { day: 1, start: 10, end: 11, title: 'Deliver #TL-1047', meta: 'Cash on delivery', kind: 'delivery' },
  { day: 1, start: 13.5, end: 14.5, title: 'Pack orders', meta: '3 Instagram orders', kind: 'task' },
  { day: 2, start: 12, end: 13.5, title: 'Product photo shoot', meta: 'New candle collection', kind: 'task' },
  { day: 3, start: 9, end: 10, title: 'Pay courier', meta: 'Delivery company', kind: 'reminder' },
  { day: 3, start: 15.5, end: 16.5, title: 'Deliver #TL-1044', meta: 'Lina Masri · Sweifieh', kind: 'delivery' },
  { day: 4, start: 14, end: 15, title: 'Deliver #TL-1043', meta: 'Omar Khalil · Abdoun', kind: 'delivery' },
  { day: 5, start: 11, end: 12, title: 'Market prep', meta: 'Friday market', kind: 'task' },
  { day: 6, start: 15, end: 16, title: 'Stock check', meta: 'Repeats weekly', kind: 'reminder' },
]

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const START = 9
const END = 18
const ROW = 60
const tone: Record<Kind, string> = {
  delivery: 'bg-brand-soft border-plum',
  task: 'bg-accent-soft border-coral',
  reminder: 'bg-canvas border-blush',
}
const fmt = (h: number) => {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  const h12 = hh > 12 ? hh - 12 : hh
  return `${h12}:${String(mm).padStart(2, '0')}`
}

function WeekCalendar({ events, onAdd }: { events: Ev[]; onAdd: () => void }) {
  const hours = Array.from({ length: END - START }, (_, i) => START + i)
  const hourLabel = (h: number) => `${h > 12 ? h - 12 : h} ${t(h >= 12 ? 'PM' : 'AM')}`
  return (
    <Panel className="p-4">
      <div className="grid grid-cols-[64px_repeat(7,1fr)]">
        <div />
        {days.map((d, i) => (
          <div key={d} className={cx('rounded-t-2xl pt-2 pb-3 text-center', i === 0 && 'bg-canvas')}>
            <div className="text-xs text-ink-2">{t(d)}</div>
            <div className={cx('mx-auto mt-1 grid size-9 place-items-center rounded-xl text-lg font-semibold', i === 0 && 'bg-brand text-white')}>{22 + i}</div>
          </div>
        ))}
      </div>
      <div className="relative grid grid-cols-[64px_repeat(7,1fr)]" style={{ height: (END - START) * ROW }}>
        <div className="relative">
          {hours.map((h, i) => (
            <div key={h} className="absolute end-3 text-[11px] text-ink-2" style={{ top: i * ROW - 7 }}>
              {hourLabel(h)}
            </div>
          ))}
        </div>
        {days.map((d, di) => {
          const list = events.filter((e) => e.day === di).sort((a, b) => a.start - b.start)
          // overlapping events cascade (each one shifted a little), like Google Calendar
          const placed = list.map((e, i) => ({
            e,
            lane: list.slice(0, i).filter((o) => o.end > e.start && o.start < e.end).length,
          }))
          return (
            <div key={d} className={cx('relative border-s border-line', di === 0 && 'bg-canvas/60')}>
              {hours.map((h, i) => (
                <div key={h} className="absolute inset-x-0 border-t border-line" style={{ top: i * ROW }} />
              ))}
              {placed.map(({ e, lane }, i) => (
                <div
                  key={e.title + i}
                  title={t(e.title)}
                  className={cx('anim-rise absolute overflow-hidden rounded-xl border-s-[3px] px-2 py-1.5', tone[e.kind])}
                  style={{
                    top: (e.start - START) * ROW + 3,
                    height: (e.end - e.start) * ROW - 6,
                    insetInlineStart: 4 + lane * 14,
                    insetInlineEnd: 4,
                    zIndex: 1 + lane,
                    boxShadow: lane ? '0 4px 12px rgb(57 9 31 / 0.12)' : undefined,
                  }}
                >
                  <div className="truncate text-xs font-semibold">{t(e.title)}</div>
                  <div className="flex items-center gap-1 truncate text-[10px] text-ink-2">
                    <Icon name="clock" size={10} />
                    {fmt(e.start)} – {fmt(e.end)}
                  </div>
                  <div className="truncate text-[10px] text-ink-2">{tParts(e.meta)}</div>
                </div>
              ))}
              {di === 0 && (
                <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: (10.67 - START) * ROW }}>
                  <span className="-ms-1 size-2.5 rounded-full bg-coral" />
                  <span className="h-0 flex-1 border-t-[1.5px] border-dashed border-coral" />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-5 px-2 text-xs text-ink-2">
        {(
          [
            ['bg-brand-soft', 'Delivery · added from orders automatically'],
            ['bg-accent-soft', 'Task'],
            ['bg-canvas', 'Reminder'],
          ] as const
        ).map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className={cx('h-3 w-5 rounded', c)} />
            {t(l)}
          </span>
        ))}
        <button type="button" onClick={onAdd} className="ms-auto font-semibold text-burgundy">
          {t('+ Add a task')}
        </button>
      </div>
    </Panel>
  )
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const icon =
    task.state === 'done' ? (
      <span className="anim-pop-in grid size-9 place-items-center rounded-full bg-brand text-white ring-4 ring-brand-soft">
        <Icon name="check" size={16} strokeWidth={2.4} />
      </span>
    ) : task.state === 'progress' ? (
      <span className="grid size-9 place-items-center rounded-full border-2 border-coral text-coral shadow-glow">
        <Icon name="play" size={12} />
      </span>
    ) : (
      <span className="block size-9 rounded-full border-2 border-dashed border-blush transition group-hover:border-plum" />
    )
  return (
    <button type="button" onClick={onToggle} className="group flex w-full items-center gap-3 border-b border-dashed border-line py-3 text-start last:border-0">
      {icon}
      <span className="min-w-0 flex-1">
        <span className={cx('block truncate text-sm font-semibold', task.state === 'done' && 'text-ink-2 line-through decoration-plum')}>{t(task.title)}</span>
        <span className="block truncate text-xs text-ink-2">
          {task.state === 'done' ? t('Done at {t}', { t: t(task.doneAt ?? '') }) : `${t(task.time)} · ${tParts(task.meta)}`}
        </span>
      </span>
      {task.kind === 'delivery' && <Icon name="truck" size={16} className="text-plum" />}
      {task.kind === 'reminder' && <Icon name="alarm" size={16} className="text-coral" />}
    </button>
  )
}

function TasksBoard({ onAdd }: { onAdd: () => void }) {
  const { tasks, toggleTask, addTask, showToast } = useStore()
  const [tab, setTab] = useState<'today' | 'upcoming' | 'done'>('today')
  const today = tasks.filter((x) => x.when === 'today')
  const done = today.filter((x) => x.state === 'done').length
  const list = tab === 'done' ? tasks.filter((x) => x.state === 'done') : tasks.filter((x) => x.when === tab)
  const groups: [string, Task[]][] =
    tab === 'done'
      ? [['Done', list]]
      : [
          ['To do', list.filter((x) => x.state === 'todo')],
          ['In progress', list.filter((x) => x.state === 'progress')],
          ['Done', list.filter((x) => x.state === 'done')],
        ]
  const pct = done / Math.max(1, today.length)
  const r = 52
  const c = 2 * Math.PI * r
  const suggestions: [IconName, string, string, string][] = [
    ['alert', 'Restock Gift box, large', '2 left · alert at 10', 'coral'],
    ['message', 'Follow up cash on delivery', 'Omar Khalil · JD 24.50', 'plum'],
    ['camera', 'Post this week’s best-seller', 'Oud & Amber candle · 64 sold', 'neutral'],
  ]

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <UnderlineTabs
          items={[
            { value: 'today', label: `${t('Today')} · ${today.length}` },
            { value: 'upcoming', label: `${t('Upcoming')} · ${tasks.filter((x) => x.when === 'upcoming').length}` },
            { value: 'done', label: `${t('Done')} · ${tasks.filter((x) => x.state === 'done').length}` },
          ]}
          value={tab}
          onChange={setTab}
        />
        <button type="button" onClick={onAdd} className="flex w-full items-center gap-3 rounded-3xl bg-white px-5 py-4 text-start text-sm text-ink-2 shadow-soft">
          <span className="grid size-9 place-items-center rounded-full bg-canvas text-burgundy">
            <Icon name="plus" size={18} />
          </span>
          {t('Create task')}
        </button>
        {groups
          .filter(([, g]) => g.length > 0)
          .map(([name, g]) => (
            <Panel key={name} className="py-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <Icon name="chevronDown" size={16} />
                {t(name)}
                <span className="rounded-full bg-brand-soft px-2 text-xs text-plum">{g.length}</span>
              </div>
              {g.map((x) => (
                <TaskRow key={x.id} task={x} onToggle={() => toggleTask(x.id)} />
              ))}
            </Panel>
          ))}
        {list.length === 0 && <p className="py-10 text-center text-sm text-ink-2">{t('Nothing here yet')}</p>}
      </div>
      <div className="space-y-6">
        <Panel>
          <h2 className="mb-4 font-display text-lg font-semibold">{t('Today’s progress')}</h2>
          <div className="flex items-center gap-5">
            <div className="relative size-[124px] shrink-0">
              <svg viewBox="0 0 124 124" className="-rotate-90">
                <circle cx="62" cy="62" r={r} fill="none" stroke="#f4e9dd" strokeWidth="12" />
                <circle
                  cx="62"
                  cy="62"
                  r={r}
                  fill="none"
                  stroke="#E46D50"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${pct * c} ${c}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="font-display text-xl font-bold">
                    {done}/{today.length}
                  </div>
                  <div className="text-xs text-ink-2">{t('done')}</div>
                </div>
              </div>
            </div>
            <div>
              <div className="font-semibold">{t('Keep going, Layla')}</div>
              <p className="mt-1 text-xs text-ink-2">{t('{n} tasks left today.', { n: today.length - done })}</p>
            </div>
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <Icon name="sparkle" size={18} className="text-coral" />
            {t('Suggested for you')}
          </h2>
          <div className="space-y-3">
            {suggestions.map(([icon, title, meta, c2]) => (
              <div key={title} className="flex items-center gap-3">
                <span className={cx('grid size-10 place-items-center rounded-xl', c2 === 'coral' ? 'bg-accent-soft text-coral' : c2 === 'plum' ? 'bg-brand-soft text-plum' : 'bg-canvas text-burgundy')}>
                  <Icon name={icon} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{t(title)}</span>
                  <span className="block truncate text-xs text-ink-2">{tParts(meta)}</span>
                </span>
                <button
                  type="button"
                  aria-label={t('Add task')}
                  onClick={() => {
                    addTask({ title, meta: 'Suggested', time: '4:00 PM', when: 'today', state: 'todo', kind: 'task' })
                    showToast(t('Task added to your Planner'))
                  }}
                  className="grid size-9 place-items-center rounded-full border border-line bg-white transition hover:border-plum active:scale-90"
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

export function PlannerPage({ nav }: { nav: WebNav }) {
  const { tasks } = useStore()
  const [view, setView] = useState<'calendar' | 'tasks'>('calendar')
  const newDeliveries: Ev[] = tasks
    .filter((x) => x.id.startsWith('t-TL'))
    .map((x) => ({ day: 0, start: 9.5, end: 10.5, title: x.title, meta: x.meta, kind: 'delivery' as const }))
  const extra: Ev[] = tasks
    .filter((x) => x.when === 'today' && !x.id.startsWith('t-TL') && !x.id.match(/^t\d$/))
    .map((x, i) => ({ day: 0, start: 15 + (i % 3), end: 16 + (i % 3), title: x.title, meta: x.meta, kind: x.kind === 'reminder' ? ('reminder' as const) : ('task' as const) }))
  const counts = { d: 5 + newDeliveries.length, k: 5 + extra.length, r: 3 }
  return (
    <>
      <PageTitle
        title={view === 'calendar' ? t('This week') : t('Tasks')}
        subtitle={
          view === 'calendar'
            ? t('22 – 28 November 2026 · {d} deliveries, {k} tasks, {r} reminders', counts)
            : t('Sunday, 22 November · {n} for today', { n: tasks.filter((x) => x.when === 'today').length })
        }
        actions={
          <>
            <Segmented
              className="w-56"
              items={[
                { value: 'calendar', label: t('Calendar') },
                { value: 'tasks', label: t('Tasks') },
              ]}
              value={view}
              onChange={setView}
            />
            <Button icon="plus" size="md" onClick={() => nav.open('task')}>
              {t('Add task')}
            </Button>
          </>
        }
      />
      <div key={view} className="anim-fade">
        {view === 'calendar' ? <WeekCalendar events={[...baseWeek, ...newDeliveries, ...extra]} onAdd={() => nav.open('task')} /> : <TasksBoard onAdd={() => nav.open('task')} />}
      </div>
    </>
  )
}
