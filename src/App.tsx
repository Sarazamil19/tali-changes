import type { ReactNode } from 'react'
import { StoreProvider, useStore, type Route } from './app/store'
import { t } from './app/i18n'
import { Logo } from './components/Logo'
import { Home } from './screens/Home'
import { BackupSheet, CreateAccount, QuickSetup, Splash, Welcome } from './screens/Onboarding'
import { NewOrderCustomer, NewOrderPayment, NewOrderProducts, OrderDetails, OrderSaved, Orders } from './screens/Orders'
import { AddProduct, Products } from './screens/Products'
import { AddTask, MyTasks, PlannerCalendar } from './screens/Planner'
import { CustomerDetails, Customers, Finances, Insights, More, PriceCalculator, SalesChannels, Settings } from './screens/Business'

function renderRoute(r: Route): ReactNode {
  switch (r.name) {
    case 'splash': return <Splash />
    case 'welcome': return <Welcome />
    case 'setup': return <QuickSetup />
    case 'createAccount': return <CreateAccount />
    case 'home': return <Home />
    case 'orders': return <Orders />
    case 'orderDetails': return <OrderDetails id={r.id ?? 'TL-1048'} />
    case 'newOrderCustomer': return <NewOrderCustomer />
    case 'newOrderProducts': return <NewOrderProducts />
    case 'newOrderPayment': return <NewOrderPayment />
    case 'orderSaved': return <OrderSaved id={r.id ?? 'TL-1049'} />
    case 'products': return <Products />
    case 'addProduct': return <AddProduct />
    case 'more': return <More />
    case 'customers': return <Customers />
    case 'customerDetails': return <CustomerDetails id={r.id ?? 'c1'} />
    case 'planner': return <PlannerCalendar />
    case 'tasks': return <MyTasks />
    case 'addTask': return <AddTask />
    case 'finances': return <Finances />
    case 'calculator': return <PriceCalculator />
    case 'insights': return <Insights />
    case 'settings': return <Settings />
    case 'channels': return <SalesChannels />
  }
}

const lightTop: Route['name'][] = ['splash', 'welcome', 'home']

function StatusBar({ light }: { light: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex h-12 items-center justify-between px-8 pt-1 text-[15px] font-semibold ${light ? 'text-white' : 'text-ink'}`}
    >
      <span>12:52</span>
      <span className="absolute top-2.5 left-1/2 h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden="true">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3.5" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" />
          <rect x="24" y="4" width="1.5" height="4" rx="0.75" fill="currentColor" opacity="0.4" />
        </svg>
      </span>
    </div>
  )
}

function Phone() {
  const { route, transition, navKey, toast, lang } = useStore()
  return (
    <div className="h-full w-full sm:h-[844px] sm:w-[390px] sm:rounded-[48px] sm:shadow-phone">
    <div className="relative h-full w-full overflow-hidden bg-subtle sm:rounded-[48px] sm:[clip-path:inset(0_round_48px)]">
      <StatusBar light={lightTop.includes(route.name)} />
      <div key={`${navKey}-${lang}`} className={`absolute inset-0 anim-${transition}`}>
        {renderRoute(route)}
      </div>
      <BackupSheet />
      {toast && (
        <div
          key={toast.key}
          role="status"
          className="anim-toast absolute bottom-44 left-1/2 z-50 max-w-[90%] rounded-full bg-burgundy px-4 py-2.5 text-center text-xs font-semibold whitespace-nowrap text-white shadow-raised"
        >
          {toast.text}
        </div>
      )}
    </div>
    </div>
  )
}

function Aside() {
  const { lang, setLang } = useStore()
  return (
    <aside className="hidden max-w-xs text-burgundy lg:block">
      <Logo height={40} />
      <h1 className="mt-6 font-display text-3xl leading-tight font-semibold">{t('Every step takes you further.')}</h1>
      <p className="mt-3 text-sm text-ink-2">
        {t('Interactive prototype of the TALI mobile app for home and Instagram sellers in Jordan. Tap around — orders, tasks and channels all respond.')}
      </p>
      <ul className="mt-6 space-y-2 text-sm text-ink">
        <li>• {t('Start as a guest, then back up')}</li>
        <li>• {t('Add an order in 3 steps')}</li>
        <li>• {t('Tick tasks in the Planner')}</li>
        <li>• {t('Connect Talabat & Careem')}</li>
      </ul>
      <div className="mt-8 inline-flex rounded-full bg-white/70 p-1 text-sm shadow-soft" dir="ltr">
        {(['en', 'ar'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={`rounded-full px-4 py-1.5 font-medium transition ${lang === l ? 'bg-brand text-white' : 'text-ink-2'} ${l === 'ar' ? 'font-arabic' : ''}`}
          >
            {l === 'en' ? 'English' : 'عربي'}
          </button>
        ))}
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <main className="flex h-full items-center justify-center gap-16 sm:min-h-screen sm:bg-[radial-gradient(circle_at_20%_20%,#fbe9e4,transparent_45%),radial-gradient(circle_at_80%_80%,#f1e4ea,transparent_45%)] sm:bg-cream sm:p-8">
        <Aside />
        <Phone />
      </main>
    </StoreProvider>
  )
}
