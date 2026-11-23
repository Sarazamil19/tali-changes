import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { setCurrentLang, type Lang } from './i18n'
import type { TemplateId } from './whatsapp'
import {
  initialCustomers,
  initialOrders,
  initialProducts,
  initialTasks,
  type Channel,
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

const emptyDraft = (): Draft => ({
  customerId: 'c1',
  qty: { p1: 2, p2: 1 },
  payment: 'Paid',
  deliveryFee: 3,
  discount: 2,
})

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

  const [businessName, setBusinessName] = useState('Layla’s Candles')
  const [isGuest, setGuest] = useState(true)
  const [firstUse, setFirstUse] = useState(false)

  const [products, setProducts] = useState(initialProducts)
  const [customers, setCustomers] = useState(initialCustomers)
  const [orders, setOrders] = useState(initialOrders)
  const [tasks, setTasks] = useState(initialTasks)
  const [channels, setChannels] = useState<ChannelState>({ instagram: true, website: false, talabat: true, careem: false })
  const [draft, setDraftState] = useState<Draft>(emptyDraft)
  const [goal, setGoal] = useState(5000)
  const [briefSeen, setBriefSeen] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [messages, setMessages] = useState<SentMessage[]>([
    { id: 'm1', customerId: 'c1', orderId: 'TL-1048', template: 'confirm', at: '12:41' },
  ])

  const go = useCallback((fn: (stack: Route[]) => Route[], transition: Transition) => {
    setNav((n) => ({ stack: fn(n.stack), transition, key: n.key + 1 }))
  }, [])

  const push = useCallback((r: Route, t: Transition = 'push') => go((s) => [...s, r], t), [go])
  const replace = useCallback((r: Route, t: Transition = 'fade') => go((s) => [...s.slice(0, -1), r], t), [go])
  const back = useCallback(() => go((s) => (s.length > 1 ? s.slice(0, -1) : s), 'pop'), [go])
  const reset = useCallback((r: Route, t: Transition = 'fade') => go(() => [r], t), [go])
  const tab = useCallback((t: TabName) => go(() => [{ name: tabRoutes[t] }], 'fade'), [go])
  const resetTo = useCallback((stack: Route[], t: Transition = 'fade') => go(() => stack, t), [go])

  const showToast = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current)
    setToast({ text, key: Date.now() })
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }, [])

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
      setDraftState({ ...emptyDraft(), customerId: customerId ?? 'c1' })
      push({ name: 'newOrderCustomer' }, 'up')
    },
    [push],
  )

  const saveOrder = useCallback(() => {
    const nextNum = Math.max(...orders.map((o) => Number(o.id.split('-')[1]))) + 1
    const id = `TL-${nextNum}`
    const customer = customers.find((c) => c.id === draft.customerId) ?? customers[0]
    const lines: OrderLine[] = Object.entries(draft.qty).map(([productId, qty]) => ({ productId, qty }))
    const order: Order = {
      id,
      customerId: customer.id,
      lines,
      channel: customer.channel as Channel,
      day: 'Today',
      time: '12:52',
      status: 'New',
      payment: draft.payment,
      deliveryFee: draft.deliveryFee,
      discount: draft.discount,
      delivery: 'Today · 9:30 AM',
    }
    const subtotal = lines.reduce((s, l) => s + (products.find((p) => p.id === l.productId)?.price ?? 0) * l.qty, 0)
    setOrders((o) => [order, ...o])
    setProducts((ps) =>
      ps.map((p) => {
        const l = lines.find((x) => x.productId === p.id)
        return l ? { ...p, stock: Math.max(0, p.stock - l.qty), sold: (p.sold ?? 0) + l.qty } : p
      }),
    )
    setCustomers((cs) =>
      cs.map((c) =>
        c.id === customer.id ? { ...c, orders: c.orders + 1, lastOrderDays: 0, spent: c.spent + subtotal + draft.deliveryFee - draft.discount } : c,
      ),
    )
    setTasks((ts) => [
      {
        id: `t-${id}`,
        title: `Deliver #${id}`,
        meta: `${customer.name} · ${customer.area.split(', ').pop()}`,
        time: '9:30 AM',
        when: 'today',
        state: 'todo',
        kind: 'delivery',
      },
      ...ts,
    ])
    setFirstUse(false)
    return id
  }, [customers, draft, orders, products])

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
      businessName,
      setBusinessName,
      isGuest,
      setGuest,
      firstUse,
      setFirstUse,
      products,
      addProduct: (p) => {
        setProducts((ps) => [{ ...p, id: `p${Date.now()}` }, ...ps])
        setFirstUse(false)
      },
      updateProduct: (id, patch) => setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))),
      customers,
      addCustomer: (c) => {
        const id = `c${Date.now()}`
        setCustomers((cs) => [{ ...c, id, orders: 0, spent: 0 }, ...cs])
        return id
      },
      orders,
      setOrderStatus: (id, s) => setOrders((os) => os.map((o) => (o.id === id ? { ...o, status: s } : o))),
      tasks,
      toggleTask: (id) =>
        setTasks((ts) =>
          ts.map((t) =>
            t.id === id
              ? t.state === 'done'
                ? { ...t, state: 'todo', doneAt: undefined }
                : { ...t, state: 'done', doneAt: '12:52 PM' }
              : t,
          ),
        ),
      addTask: (t) => setTasks((ts) => [{ ...t, id: `t${Date.now()}` }, ...ts]),
      messages,
      logMessage: (m) => setMessages((ms) => [{ ...m, id: `m${Date.now()}`, at: '12:52' }, ...ms]),
      channels,
      setChannel: (k, on) => setChannels((c) => ({ ...c, [k]: on })),
      goal,
      setGoal,
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
    [nav, push, replace, back, reset, resetTo, tab, sheet, toast, showToast, view, setView, lang, setLang, businessName, isGuest, firstUse, products, customers, orders, tasks, messages, channels, goal, briefSeen, dismissed, draft, setDraft, setQty, startOrder, saveOrder],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const s = useContext(StoreContext)
  if (!s) throw new Error('useStore must be used inside <StoreProvider>')
  return s
}
