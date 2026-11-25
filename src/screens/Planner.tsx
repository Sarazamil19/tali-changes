import { useState } from 'react'
import { useStore } from '../app/store'
import { t, tParts } from '../app/i18n'
import type { Task, TaskKind } from '../app/data'
import { Icon, type IconName } from '../components/Icon'
import { Button, Chip, CircleButton, Field, Footer, Screen, Scroll, StatusSpacer, TabBar, TopBar, UnderlineTabs, cx } from '../components/ui'

// ------------------------------------------------------------------
// M7 · Planner · Calendar
// ------------------------------------------------------------------

type CalEvent = { title: string; meta: string; start: number; end: number; tone: 'plum' | 'coral' | 'neutral'; icon: IconName; label: string }

const week = [
  { d: 'Sun', n: 22 },
  { d: 'Mon', n: 23 },
  { d: 'Tue', n: 24 },
  { d: 'Wed', n: 25 },
  { d: 'Thu', n: 26 },
  { d: 'Fri', n: 27 },
  { d: 'Sat', n: 28 },
]
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const events: Record<number, CalEvent[]> = {
  0: [
    { title: 'Deliver #TL-1046', label: '9:30 – 10:30 AM', meta: 'Dana Saleh · Khalda', start: 9.5, end: 10.5, tone: 'plum', icon: 'truck' },
    { title: 'Call supplier', label: '11:15 AM – 12:15 PM', meta: 'Packaging quote', start: 11.25, end: 12.25, tone: 'coral', icon: 'tasks' },
    { title: 'Restock lavender salts', label: '1:00 – 2:00 PM', meta: 'Only 3 left', start: 13, end: 14, tone: 'neutral', icon: 'alarm' },
  ],
  1: [{ title: 'Deliver #TL-1047', label: '2:00 – 3:00 PM', meta: 'Omar Khalil · Abdoun', start: 14, end: 15, tone: 'plum', icon: 'truck' }],
  2: [{ title: 'Order new wax supply', label: '10:00 – 11:00 AM', meta: 'Reminder', start: 10, end: 11, tone: 'neutral', icon: 'alarm' }],
  4: [{ title: 'Product photo shoot', label: '11:00 AM – 12:30 PM', meta: 'New candle collection', start: 11, end: 12.5, tone: 'coral', icon: 'camera' }],
}

const HOUR = 76
const FIRST = 9
const LAST = 18
const toneEvent = {
  plum: 'bg-brand-soft border-plum text-plum',
  coral: 'bg-accent-soft border-coral text-coral',
  neutral: 'bg-canvas border-blush text-burgundy',
}

export function PlannerCalendar() {
  const { push } = useStore()
  const [day, setDay] = useState(0)
  const list = events[day] ?? []
  const hours = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i)
  const label = (h: number) => (h === 12 ? ['12', t('PM')] : h > 12 ? [String(h - 12), t('PM')] : [String(h), t('AM')])

  return (
    <Screen className="bg-white">
      <div className="shrink-0 rounded-b-[28px] bg-subtle pb-4">
        <StatusSpacer />
        <div className="flex items-center gap-3 px-5">
          <CircleButton icon="arrowLeft" label={t('Back')} onClick={() => push({ name: 'home' }, 'pop')} />
          <div className="flex-1">
            <div className="text-xs text-ink-2">{t('This week')}</div>
            <div className="flex items-center gap-1 font-display text-lg font-semibold">
              {t('{d} Nov, {day}', { d: week[day].n, day: t(dayNames[day]) })}
              <Icon name="chevronDown" size={16} className="text-ink-2" />
            </div>
          </div>
          <CircleButton icon="tasks" label={t('My tasks')} onClick={() => push({ name: 'tasks' })} />
          <CircleButton icon="plus" label={t('Add task')} variant="brand" onClick={() => push({ name: 'addTask' }, 'up')} />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 px-4">
          {week.map((w, i) => (
            <button key={w.n} type="button" onClick={() => setDay(i)} className="flex flex-col items-center gap-1.5">
              <span className={cx('text-xs', i === day ? 'font-semibold text-ink' : 'text-ink-2')}>{t(w.d)}</span>
              <span
                className={cx(
                  'grid size-10 place-items-center rounded-2xl text-sm font-semibold transition-all duration-300',
                  i === day ? 'scale-105 bg-brand text-white shadow-soft' : i === 0 ? 'text-coral' : 'text-ink hover:bg-canvas',
                )}
              >
                {w.n}
              </span>
              <span className={cx('size-1 rounded-full', events[i] ? 'bg-coral' : 'bg-transparent')} />
            </button>
          ))}
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className="relative mx-5 mt-4 mb-6" style={{ height: (LAST - FIRST) * HOUR + 20 }}>
          {hours.map((h, i) => (
            <div key={h} className="absolute inset-x-0 flex items-start gap-3" style={{ top: i * HOUR }}>
              <div className="w-8 text-center leading-tight">
                <div className="text-sm font-semibold">{label(h)[0]}</div>
                <div className="text-[10px] text-ink-2">{label(h)[1]}</div>
              </div>
              <div className="mt-2 h-px flex-1 bg-line" />
            </div>
          ))}
          {day === 0 && (
            <div className="absolute end-0 start-10 z-10 flex items-center" style={{ top: (10.6 - FIRST) * HOUR + 8 }}>
              <span className="-ms-1 size-2.5 rounded-full bg-coral" />
              <span className="h-0 flex-1 border-t-[1.5px] border-dashed border-coral" />
            </div>
          )}
          {list.map((e, i) => (
            <div
              key={e.title}
              className={cx('anim-rise absolute end-0 start-12 overflow-hidden rounded-2xl border-s-[3px] px-3 py-2', toneEvent[e.tone])}
              style={{ top: (e.start - FIRST) * HOUR + 8, height: (e.end - e.start) * HOUR - 6, animationDelay: `${i * 0.06}s` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-ink">{t(e.title)}</span>
                <Icon name={e.icon} size={15} />
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-2">
                <Icon name="clock" size={12} /> {t(e.label)}
              </div>
              <div className="truncate text-xs text-ink-2">{t(e.meta)}</div>
            </div>
          ))}
          {list.length === 0 && (
            <div className="absolute inset-x-12 top-24 rounded-2xl border border-dashed border-line bg-subtle p-5 text-center text-sm text-ink-2">
              {t('Nothing planned for {day}.', { day: t(dayNames[day]) })}
              <button type="button" onClick={() => push({ name: 'addTask' }, 'up')} className="mt-1 block w-full font-semibold text-burgundy">
                {t('+ Add a task')}
              </button>
            </div>
          )}
        </div>
      </div>
      <TabBar />
    </Screen>
  )
}

// ------------------------------------------------------------------
// M8 · Planner · My tasks
// ------------------------------------------------------------------

function TaskIcon({ task }: { task: Task }) {
  if (task.state === 'done')
    return (
      <span className="anim-pop-in grid size-9 place-items-center rounded-full bg-brand text-white shadow-raised ring-4 ring-brand-soft">
        <Icon name="check" size={17} strokeWidth={2.4} />
      </span>
    )
  if (task.state === 'progress')
    return (
      <span className="grid size-9 place-items-center rounded-full border-2 border-coral text-coral shadow-glow">
        <Icon name="play" size={13} />
      </span>
    )
  return <span className="block size-9 rounded-full border-2 border-dashed border-blush transition hover:border-plum" />
}

export function MyTasks() {
  const { tasks, toggleTask, push, back } = useStore()
  const [tab, setTab] = useState<'today' | 'upcoming' | 'done'>('today')
  const today = tasks.filter((t) => t.when === 'today')
  const doneCount = today.filter((t) => t.state === 'done').length
  const list =
    tab === 'done' ? tasks.filter((t) => t.state === 'done') : tasks.filter((t) => t.when === tab)

  const meta = (task: Task) =>
    task.state === 'done' ? t('Done at {t}', { t: t(task.doneAt ?? '') }) : `${t(task.time)} · ${tParts(task.meta)}`

  return (
    <Screen>
      <StatusSpacer />
      <div className="flex shrink-0 items-center justify-between px-5">
        <CircleButton icon="arrowLeft" label={t('Back')} onClick={back} />
        <CircleButton icon="plus" label={t('Add task')} variant="brand" onClick={() => push({ name: 'addTask' }, 'up')} />
      </div>
      <div className="shrink-0 px-5 pt-5">
        <h1 className="font-display text-[28px] font-bold">{t('My tasks')}</h1>
        <p className="text-sm text-ink-2">
          {t('Sunday, 22 November · {d} of {n} done', { d: doneCount, n: today.length })}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-canvas">
          <div className="h-full rounded-full bg-coral transition-all duration-500" style={{ width: `${(doneCount / Math.max(1, today.length)) * 100}%` }} />
        </div>
        <div className="mt-4">
          <UnderlineTabs
            items={[
              { value: 'today', label: t('Today') },
              { value: 'upcoming', label: t('Upcoming') },
              { value: 'done', label: t('Done') },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
      </div>
      <Scroll className="space-y-1 pt-3">
        {tab !== 'done' && (
          <button type="button" onClick={() => push({ name: 'addTask' }, 'up')} className="flex w-full items-center gap-3 py-2.5 text-start text-sm text-ink-2">
            <span className="grid size-9 place-items-center rounded-full bg-canvas text-burgundy">
              <Icon name="plus" size={18} />
            </span>
            {t('Create task')}
          </button>
        )}
        {list.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => toggleTask(task.id)}
            className="anim-rise flex w-full items-center gap-3 rounded-2xl py-2.5 text-start transition active:scale-[0.99]"
          >
            <TaskIcon task={task} />
            <span className="min-w-0 flex-1">
              <span className={cx('block truncate text-sm font-semibold transition-colors', task.state === 'done' && 'text-ink-2 line-through decoration-plum')}>
                {t(task.title)}
              </span>
              <span className="block truncate text-xs text-ink-2">{meta(task)}</span>
            </span>
            {task.kind === 'delivery' && <Icon name="truck" size={16} className="text-plum" />}
            {task.kind === 'reminder' && <Icon name="alarm" size={16} className="text-coral" />}
          </button>
        ))}
        {list.length === 0 && <p className="pt-10 text-center text-sm text-ink-2">{t('Nothing here yet')}</p>}
      </Scroll>
      <TabBar />
    </Screen>
  )
}

// ------------------------------------------------------------------
// M24 · Add task
// ------------------------------------------------------------------

export function AddTask() {
  const { addTask, back, showToast } = useStore()
  const [title, setTitle] = useState(t('Call supplier about packaging'))
  const [kind, setKind] = useState<TaskKind>('task')
  const [date, setDate] = useState(t('Today, 22 Nov'))
  const [time, setTime] = useState(t('11:15 AM'))
  const [link, setLink] = useState<'Order' | 'Product' | 'Customer' | null>('Order')
  const [repeat, setRepeat] = useState('Never')
  const Label = ({ children }: { children: string }) => <div className="mb-2 text-xs font-semibold">{t(children)}</div>

  return (
    <Screen>
      <StatusSpacer />
      <TopBar
        title={t('New task')}
        right={
          <button type="button" onClick={back} className="text-sm font-medium text-ink-2">
            {t('Cancel')}
          </button>
        }
      />
      <Scroll className="space-y-4 pt-5">
        <Field label={t('Title')} value={title} onChange={setTitle} />
        <div>
          <Label>Type</Label>
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
          <Field label={t('Date')} value={date} onChange={setDate} />
          <Field label={t('Time')} value={time} onChange={setTime} />
        </div>
        <div>
          <Label>Link to (optional)</Label>
          <div className="flex gap-2">
            {(['Order', 'Product', 'Customer'] as const).map((l) => (
              <Chip key={l} selected={link === l} onClick={() => setLink(link === l ? null : l)}>
                {t(l)}
              </Chip>
            ))}
          </div>
          {link === 'Order' && (
            <div className="anim-rise mt-3 flex items-center gap-3 rounded-2xl bg-brand-soft px-4 py-3">
              <Icon name="bag" size={20} className="text-plum" />
              <span className="flex-1">
                <span className="block text-sm font-semibold">{t('Order #TL-1046')}</span>
                <span className="block text-xs text-ink-2">{t('Dana Saleh · JD 61.00')}</span>
              </span>
              <span className="text-xs font-semibold text-burgundy">{t('Change')}</span>
            </div>
          )}
        </div>
        <div>
          <Label>Repeat</Label>
          <div className="flex gap-2">
            {['Never', 'Daily', 'Weekly'].map((r) => (
              <Chip key={r} selected={repeat === r} onClick={() => setRepeat(r)}>
                {t(r)}
              </Chip>
            ))}
          </div>
        </div>
      </Scroll>
      <Footer>
        <Button
          icon="check"
          className="w-full"
          disabled={!title.trim()}
          onClick={() => {
            addTask({
              title: title.trim(),
              meta: link === 'Order' ? 'Linked to #TL-1046' : kind === 'reminder' ? 'Reminder' : 'Task',
              time,
              when: date.startsWith('Today') || date.startsWith('اليوم') ? 'today' : 'upcoming',
              state: 'todo',
              kind,
            })
            back()
            showToast(t('Task added to your Planner'))
          }}
        >
          {t('Save task')}
        </Button>
      </Footer>
    </Screen>
  )
}
