import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { setCurrentLang, t as tr, type Lang } from './i18n'
import { cloud, cloudEnabled, loadSnapshot, signOut as cloudSignOut, subscribe, supabase, type Session } from './cloud'
import { derive, dueFrom, emptySnapshot, nextDeliverySlot, type Snapshot } from './derive'
import type { TemplateId } from './whatsapp'
import {
  initialCustomers,
  initialOrders,
  initialProducts,
  initialTasks,
  expenses as initialExpenses,
  type Channel,
  type Expense,
  type Customer,
  type Order,
  type OrderLine,
  type OrderStatus,
  type Payment,
  type Product,
  type Task,
} from './data'

// ------------------------------------------------------------------
// Navigation — a small stack router with the prototype's transitions
// ------------------------------------------------------------------

export type RouteName =
  | 'splash'
  | 'welcome'
  | 'setup'
  | 'createAccount'
  | 'home'
  | 'orders'
  | 'orderDetails'
  | 'newOrderCustomer'
  | 'newOrderProducts'
  | 'newOrderPayment'
  | 'orderSaved'
  | 'products'
  | 'addProduct'
  | 'productDetails'
  | 'more'
  | 'customers'
  | 'customerDetails'
  | 'planner'
  | 'tasks'
  | 'addTask'
  | 'finances'
  | 'calculator'
  | 'insights'
  | 'settings'
  | 'channels'

export type Route = { name: RouteName; id?: string }
export type Transition = 'push' | 'pop' | 'up' | 'fade'
export type TabName = 'home' | 'orders' | 'products' | 'more'

type NavState = { stack: Route[]; transition: Transition; key: number }

// ------------------------------------------------------------------
// App data
// ------------------------------------------------------------------

export type Draft = {
  customerId: string | null
  qty: Record<string, number>
  payment: Payment
  deliveryFee: number
  discount: number
}

export type SentMessage = { id: string; customerId: string; orderId?: string; template: TemplateId; at: string }

export type ChannelState = Record<'instagram' | 'website' | 'talabat' | 'careem', boolean>

// The demo pre-fills a sample order; real accounts start with an empty one.
const emptyDraft = (): Draft =>
  cloudEnabled
    ? { customerId: null, qty: {}, payment: 'Paid', deliveryFee: 0, discount: 0 }
    : { customerId: 'c1', qty: { p1: 2, p2: 1 }, payment: 'Paid', deliveryFee: 3, discount: 2 }

/**
 * demo  — no database configured (Figma Make preview): Layla's sample data, nothing is saved.
 * local — database configured but not signed in: the seller's own data is kept on this device.
 * cloud — signed in: everything is saved to her account and synced live between devices.
 */
export type Mode = 'demo' | 'local' | 'cloud'

const GUEST_KEY = 'tali-guest-v1'
const readGuest = (): Snapshot | null => {
  try {
    const raw = window.localStorage.getItem(GUEST_KEY)
    return raw ? (JSON.parse(raw) as Snapshot) : null
  } catch {
    return null
  }
}
const writeGuest = (s: Snapshot | null) => {
  try {
    if (s) window.localStorage.setItem(GUEST_KEY, JSON.stringify(s))
    else window.localStorage.removeItem(GUEST_KEY)
  } catch {
    /* storage unavailable */
  }
}
const hasData = (s: Snapshot) => s.products.length + s.customers.length + s.orders.length + s.tasks.length + s.expenses.length > 0

const demoSnapshot = (): Snapshot => ({
  businessName: 'Layla’s Candles',
  goal: 5000,
  channels: { instagram: true, website: false, talabat: true, careem: false },
  products: initialProducts,
  customers: initialCustomers,
  orders: initialOrders,
  tasks: initialTasks,
  expenses: initialExpenses,
  messages: [{ id: 'm1', customerId: 'c1', orderId: 'TL-1048', template: 'confirm', at: '12:41' }],
})

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })

const nowIso = () => new Date().toISOString()

type Store = {
  // navigation
  route: Route
  transition: Transition
  navKey: number
  canGoBack: boolean
  push: (r: Route, t?: Transition) => void
  replace: (r: Route, t?: Transition) => void
  back: () => void
  reset: (r: Route, t?: Transition) => void
  resetTo: (stack: Route[], t?: Transition) => void
  tab: (t: TabName) => void
  // overlays
  sheet: 'backup' | null
  openSheet: (s: 'backup') => void
  closeSheet: () => void
  toast: { text: string; key: number } | null
  showToast: (text: string) => void
  // which experience is shown: the web dashboard or the mobile-app prototype
  view: 'web' | 'mobile'
  setView: (v: 'web' | 'mobile') => void
  // language
  lang: Lang
  setLang: (l: Lang) => void
  // account & sync
  mode: Mode
  authReady: boolean
  session: Session | null
  /** signed in, data loaded, but the business has no name yet */
  needsSetup: boolean
  syncing: boolean
  signOut: () => Promise<void>
  // session
  businessName: string
  setBusinessName: (n: string) => void
  isGuest: boolean
  setGuest: (g: boolean) => void
  firstUse: boolean
  setFirstUse: (f: boolean) => void
  // data
  products: Product[]
  addProduct: (p: Omit<Product, 'id'>) => void
  updateProduct: (id: string, patch: Partial<Omit<Product, 'id'>>) => void
  customers: Customer[]
  addCustomer: (c: Omit<Customer, 'id' | 'orders' | 'spent'>) => string
  orders: Order[]
  setOrderStatus: (id: string, s: OrderStatus) => void
  tasks: Task[]
  toggleTask: (id: string) => void
  addTask: (t: Omit<Task, 'id'>) => void
  expenses: Expense[]
  addExpense: (e: Pick<Expense, 'title' | 'amount' | 'icon'>) => void
  messages: SentMessage[]
  logMessage: (m: Omit<SentMessage, 'id' | 'at'>) => void
  channels: ChannelState
  setChannel: (k: keyof ChannelState, on: boolean) => void
  // growth tools
  goal: number
  setGoal: (n: number) => void
  briefSeen: boolean
  setBriefSeen: (b: boolean) => void
  dismissed: string[]
  dismissBrief: (id: string) => void
  // new order draft
  draft: Draft
  setDraft: (d: Partial<Draft>) => void
  setQty: (productId: string, qty: number) => void
  startOrder: (customerId?: string) => void
  saveOrder: () => string
}

const StoreContext = createContext<Store | null>(null)

const tabRoutes: Record<TabName, RouteName> = {
  home: 'home',
  orders: 'orders',
  products: 'products',
  more: 'more',
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<NavState>({ stack: [{ name: 'splash' }], transition: 'fade', key: 0 })
  const [sheet, setSheet] = useState<'backup' | null>(null)
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const [lang, setLangState] = useState<Lang>(() => {
    let l: Lang = 'en'
    try {
      if (window.localStorage.getItem('tali-lang') === 'ar') l = 'ar'
    } catch {
      /* storage unavailable */
    }
    setCurrentLang(l)
    return l
  })
  const setLang = useCallback((l: Lang) => {
    setCurrentLang(l)
    setLangState(l)
    try {
      window.localStorage.setItem('tali-lang', l)
    } catch {
      /* storage unavailable */
    }
  }, [])
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  // Phones open the mobile app; tablets and computers open the web dashboard.
  // A manual switch (dashboard ⇄ app) is kept until the page is reloaded.
  const phoneQuery = '(max-width: 767px)'
  const isPhone = () => typeof window !== 'undefined' && window.matchMedia(phoneQuery).matches
  const [view, setViewState] = useState<'web' | 'mobile'>(() => (isPhone() ? 'mobile' : 'web'))
  const manualView = useRef(false)
  useEffect(() => {
    const m = window.matchMedia(phoneQuery)
    const onChange = () => {
      if (!manualView.current) setViewState(m.matches ? 'mobile' : 'web')
    }
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [])
  const setView = useCallback((v: 'web' | 'mobile') => {
    manualView.current = true
    setViewState(v)
  }, [])

  const showToast = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current)
    setToast({ text, key: Date.now() })
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }, [])

  // ---------------------------------------------------------------
  // Account, data and sync
  // ---------------------------------------------------------------
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!cloudEnabled)
  const [cloudLoaded, setCloudLoaded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const mode: Mode = !cloudEnabled ? 'demo' : session ? 'cloud' : 'local'
  const modeRef = useRef(mode)
  modeRef.current = mode

  const [data, setData] = useState<Snapshot>(() => (cloudEnabled ? (readGuest() ?? emptySnapshot()) : demoSnapshot()))
  const dataRef = useRef(data)
  dataRef.current = data
  const patch = useCallback((fn: (d: Snapshot) => Snapshot) => setData(fn), [])

  // demo-only switches (real accounts work these out from the data)
  const [demoGuest, setDemoGuest] = useState(true)
  const [demoFirstUse, setDemoFirstUse] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data: d }) => {
      setSession(d.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // keep a guest's data on this device
  useEffect(() => {
    if (mode === 'local') writeGuest(data)
  }, [mode, data])

  const reloadTimer = useRef<number | undefined>(undefined)
  const reload = useCallback(async () => {
    try {
      const s = await loadSnapshot()
      if (modeRef.current === 'cloud') setData(s)
      setCloudLoaded(true)
    } catch (e) {
      showToast(tr('Couldn’t load your data: {e}', { e: (e as Error).message }))
    }
  }, [showToast])
  const scheduleReload = useCallback(() => {
    window.clearTimeout(reloadTimer.current)
    reloadTimer.current = window.setTimeout(reload, 350)
  }, [reload])

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) {
      setCloudLoaded(false)
      return
    }
    let stop = () => {}
    ;(async () => {
      setSyncing(true)
      const guest = readGuest()
      if (guest && hasData(guest)) {
        try {
          await cloud.uploadSnapshot(guest)
          writeGuest(null)
          showToast(tr('Your data is now saved to your account'))
        } catch (e) {
          showToast(tr('Couldn’t move your data: {e}', { e: (e as Error).message }))
        }
      } else writeGuest(null)
      await reload()
      setSyncing(false)
      stop = subscribe(scheduleReload)
    })()
    return () => stop()
  }, [userId, reload, scheduleReload, showToast])

  /** Saves a change to the account (signed in only); the data reloads afterwards. */
  const write = useCallback(
    (fn: () => Promise<unknown>) => {
      if (modeRef.current !== 'cloud') return
      fn()
        .then(scheduleReload)
        .catch((e) => {
          showToast(tr('Couldn’t save: {e}', { e: (e as Error).message }))
          scheduleReload()
        })
    },
    [scheduleReload, showToast],
  )

  const bizTimer = useRef<number | undefined>(undefined)
  const writeBusiness = useCallback(
    (p: Parameters<typeof cloud.updateBusiness>[0]) => {
      window.clearTimeout(bizTimer.current)
      bizTimer.current = window.setTimeout(() => write(() => cloud.updateBusiness(p)), 600)
    },
    [write],
  )

  const signOut = useCallback(async () => {
    await cloudSignOut()
    setData(emptySnapshot())
    writeGuest(null)
  }, [])

  // What the screens see: real data gets its display fields worked out (dates, totals, units sold…)
  const [clock, setClock] = useState(0)
  useEffect(() => {
    if (mode === 'demo') return
    const id = window.setInterval(() => setClock((c) => c + 1), 60_000)
    return () => window.clearInterval(id)
  }, [mode])
  const shown = useMemo(() => (mode === 'demo' ? data : derive(data)), [data, mode, clock])
  const { products, customers, orders, tasks, messages, channels, goal, businessName, expenses } = shown

  const isGuest = mode === 'demo' ? demoGuest : mode === 'local'
  const firstUse = mode === 'demo' ? demoFirstUse : data.orders.length === 0
  const needsSetup = mode === 'cloud' && cloudLoaded && !data.businessName

  // ---------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------
  const [draft, setDraftState] = useState<Draft>(emptyDraft)
  const [briefSeen, setBriefSeen] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>([])

  const go = useCallback((fn: (stack: Route[]) => Route[], transition: Transition) => {
    setNav((n) => ({ stack: fn(n.stack), transition, key: n.key + 1 }))
  }, [])

  const push = useCallback((r: Route, t: Transition = 'push') => go((s) => [...s, r], t), [go])
  const replace = useCallback((r: Route, t: Transition = 'fade') => go((s) => [...s.slice(0, -1), r], t), [go])
  const back = useCallback(() => go((s) => (s.length > 1 ? s.slice(0, -1) : s), 'pop'), [go])
  const reset = useCallback((r: Route, t: Transition = 'fade') => go(() => [r], t), [go])
  const tab = useCallback((t: TabName) => go(() => [{ name: tabRoutes[t] }], 'fade'), [go])
  const resetTo = useCallback((stack: Route[], t: Transition = 'fade') => go(() => stack, t), [go])

  const setDraft = useCallback((d: Partial<Draft>) => setDraftState((s) => ({ ...s, ...d })), [])
  const setQty = useCallback(
    (productId: string, qty: number) =>
      setDraftState((s) => {
        const next = { ...s.qty }
        if (qty <= 0) delete next[productId]
        else next[productId] = qty
        return { ...s, qty: next }
      }),
    [],
  )

  const startOrder = useCallback(
    (customerId?: string) => {
      setDraftState({ ...emptyDraft(), customerId: customerId ?? (cloudEnabled ? null : 'c1') })
      push({ name: 'newOrderCustomer' }, 'up')
    },
    [push],
  )

  // ---------------------------------------------------------------
  // Changes
  // ---------------------------------------------------------------
  const saveOrder = useCallback(() => {
    const d = dataRef.current
    const nextNum = Math.max(1000, ...d.orders.map((o) => Number(o.id.split('-')[1]) || 0)) + 1
    const id = `TL-${nextNum}`
    const customer = d.customers.find((c) => c.id === draft.customerId) ?? d.customers[0]
    const priced = (productId: string) => d.products.find((p) => p.id === productId)
    const real = modeRef.current !== 'demo'
    const lines: OrderLine[] = Object.entries(draft.qty).map(([productId, qty]) =>
      real ? { productId, qty, price: priced(productId)?.price ?? 0, cost: priced(productId)?.cost ?? 0 } : { productId, qty },
    )
    const deliveryAt = real ? nextDeliverySlot() : undefined
    const order: Order = {
      id,
      uuid: real ? uid() : undefined,
      customerId: customer?.id ?? '',
      lines,
      channel: (customer?.channel ?? 'Instagram') as Channel,
      day: 'Today',
      time: '12:52',
      status: 'New',
      payment: draft.payment,
      deliveryFee: draft.deliveryFee,
      discount: draft.discount,
      delivery: 'Today · 9:30 AM',
      createdAt: real ? nowIso() : undefined,
      deliveryAt,
    }
    const subtotal = lines.reduce((s, l) => s + (priced(l.productId)?.price ?? 0) * l.qty, 0)
    const area = customer?.area.split(', ').pop() ?? ''
    patch((x) => ({
      ...x,
      orders: [order, ...x.orders],
      products: x.products.map((p) => {
        const l = lines.find((y) => y.productId === p.id)
        return l ? { ...p, stock: Math.max(0, p.stock - l.qty), sold: (p.sold ?? 0) + l.qty } : p
      }),
      customers: real
        ? x.customers
        : x.customers.map((c) =>
            c.id === customer?.id ? { ...c, orders: c.orders + 1, lastOrderDays: 0, spent: c.spent + subtotal + draft.deliveryFee - draft.discount } : c,
          ),
      tasks: [
        {
          id: real ? uid() : `t-${id}`,
          title: `Deliver #${id}`,
          meta: `${customer?.name ?? ''} · ${area}`,
          time: '9:30 AM',
          when: 'today',
          state: 'todo',
          kind: 'delivery',
          dueAt: deliveryAt,
        },
        ...x.tasks,
      ],
    }))
    write(() => cloud.createOrder(order))
    setDemoFirstUse(false)
    return id
  }, [draft, patch, write])

  const value: Store = useMemo(
    () => ({
      route: nav.stack[nav.stack.length - 1],
      transition: nav.transition,
      navKey: nav.key,
      canGoBack: nav.stack.length > 1,
      push,
      replace,
      back,
      reset,
      resetTo,
      tab,
      sheet,
      openSheet: (s) => setSheet(s),
      closeSheet: () => setSheet(null),
      toast,
      showToast,
      view,
      setView,
      lang,
      setLang,
      mode,
      authReady,
      session,
      needsSetup,
      syncing,
      signOut,
      businessName,
      setBusinessName: (name) => {
        patch((d) => ({ ...d, businessName: name }))
        writeBusiness({ name })
      },
      isGuest,
      setGuest: setDemoGuest,
      firstUse,
      setFirstUse: setDemoFirstUse,
      products,
      addProduct: (p) => {
        const product = { ...p, id: mode === 'demo' ? `p${Date.now()}` : uid() }
        patch((d) => ({ ...d, products: [product, ...d.products] }))
        write(() => cloud.addProduct(product))
        setDemoFirstUse(false)
      },
      updateProduct: (id, change) => {
        patch((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...p, ...change } : p)) }))
        write(() => cloud.updateProduct(id, change))
      },
      customers,
      addCustomer: (c) => {
        const id = mode === 'demo' ? `c${Date.now()}` : uid()
        patch((d) => ({ ...d, customers: [{ ...c, id, orders: 0, spent: 0 }, ...d.customers] }))
        write(() => cloud.addCustomer({ ...c, id }))
        return id
      },
      orders,
      setOrderStatus: (id, s) => {
        const o = data.orders.find((x) => x.id === id)
        if (!o) return
        const was = o.status
        patch((d) => ({
          ...d,
          orders: d.orders.map((x) => (x.id === id ? { ...x, status: s } : x)),
          // cancelling puts the items back in stock (real data only)
          products:
            mode === 'demo' || (s !== 'Cancelled' && was !== 'Cancelled')
              ? d.products
              : d.products.map((p) => {
                  const l = o.lines.find((y) => y.productId === p.id)
                  return l ? { ...p, stock: Math.max(0, p.stock + (s === 'Cancelled' ? l.qty : -l.qty)) } : p
                }),
          tasks:
            s === 'Delivered' || s === 'Cancelled'
              ? d.tasks.map((t) => (t.kind === 'delivery' && t.title === `Deliver #${id}` && t.state !== 'done' ? { ...t, state: 'done', doneAt: mode === 'demo' ? '12:52 PM' : nowIso() } : t))
              : d.tasks,
        }))
        if (o.uuid) write(() => cloud.setOrderStatus(o.uuid!, s))
      },
      tasks,
      toggleTask: (id) => {
        const t = data.tasks.find((x) => x.id === id)
        if (!t) return
        const done = t.state !== 'done'
        const doneAt = done ? (mode === 'demo' ? '12:52 PM' : nowIso()) : undefined
        patch((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === id ? { ...x, state: done ? 'done' : 'todo', doneAt } : x)) }))
        write(() => cloud.setTaskState(id, done ? 'done' : 'todo', doneAt ?? null))
      },
      addTask: (t) => {
        const task: Task = mode === 'demo' ? { ...t, id: `t${Date.now()}` } : { ...t, id: uid(), dueAt: dueFrom(t.when, t.time) }
        patch((d) => ({ ...d, tasks: [task, ...d.tasks] }))
        write(() => cloud.addTask(task))
      },
      expenses,
      addExpense: (e) => {
        const today = new Date()
        const spentOn = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        const expense: Expense = { ...e, id: mode === 'demo' ? `e${Date.now()}` : uid(), date: 'Today', spentOn }
        patch((d) => ({ ...d, expenses: [expense, ...d.expenses] }))
        write(() => cloud.addExpense(expense))
      },
      messages,
      logMessage: (m) => {
        const msg: SentMessage = { ...m, id: mode === 'demo' ? `m${Date.now()}` : uid(), at: mode === 'demo' ? '12:52' : nowIso() }
        patch((d) => ({ ...d, messages: [msg, ...d.messages] }))
        write(() => cloud.logMessage(msg, data.orders.find((o) => o.id === m.orderId)?.uuid))
      },
      channels,
      setChannel: (k, on) => {
        const next = { ...data.channels, [k]: on }
        patch((d) => ({ ...d, channels: next }))
        writeBusiness({ channels: next })
      },
      goal,
      setGoal: (n) => {
        patch((d) => ({ ...d, goal: n }))
        writeBusiness({ goal: n })
      },
      briefSeen,
      setBriefSeen,
      dismissed,
      dismissBrief: (id) => setDismissed((d) => (d.includes(id) ? d : [...d, id])),
      draft,
      setDraft,
      setQty,
      startOrder,
      saveOrder,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nav, sheet, toast, view, lang, mode, authReady, session, needsSetup, syncing, shown, data, isGuest, firstUse, briefSeen, dismissed, draft, saveOrder],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const s = useContext(StoreContext)
  if (!s) throw new Error('useStore must be used inside <StoreProvider>')
  return s
}
