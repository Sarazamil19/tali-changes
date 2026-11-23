import { useState } from 'react'
import { useStore } from '../app/store'
import { t } from '../app/i18n'
import { jd } from '../app/data'
import { Icon } from '../components/Icon'
import { Button, Card, CircleButton, Field, Footer, Screen, Scroll, Segmented, StatusSpacer, TabBar, TitleBar, TopBar, cx } from '../components/ui'

// M14 · Products
export function Products() {
  const { products, push, showToast } = useStore()
  const [view, setView] = useState<'all' | 'inventory'>('all')
  const low = products.filter((p) => p.stock <= p.alertAt)
  const sorted = view === 'inventory' ? [...products].sort((a, b) => a.stock / a.alertAt - b.stock / b.alertAt) : products

  return (
    <Screen>
      <StatusSpacer />
      <TitleBar title={t('Products')} right={<CircleButton icon="plus" label={t('Add product')} variant="brand" onClick={() => push({ name: 'addProduct' }, 'up')} />} />
      <div className="px-5 pb-3">
        <Segmented
          items={[
            { value: 'all', label: t('All products') },
            { value: 'inventory', label: t('Inventory') },
          ]}
          value={view}
          onChange={setView}
        />
      </div>
      <Scroll className="space-y-2.5">
        {low.length > 0 && (
          <div className="flex items-center gap-3 rounded-[20px] bg-accent-soft px-4 py-3">
            <Icon name="alert" size={20} className="text-coral" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{t('{n} products are running low', { n: low.length })}</span>
              <span className="block truncate text-xs text-ink-2">{low.map((p) => t(p.name).split(/[,،]/)[0]).join('، ')}</span>
            </span>
            <button type="button" onClick={() => showToast(t('Restock reminder added to Planner'))} className="text-sm font-semibold text-coral">
              {t('Restock')}
            </button>
          </div>
        )}
        {sorted.map((p) => {
          const isLow = p.stock <= p.alertAt
          return (
            <Card key={p.id} onClick={() => push({ name: 'productDetails', id: p.id })} className="anim-rise flex items-center gap-3 p-3">
              <span className={cx('grid size-12 place-items-center rounded-2xl', isLow ? 'bg-accent-soft text-coral' : 'bg-brand-soft text-plum')}>
                <Icon name="products" size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{t(p.name)}</span>
                {view === 'inventory' ? (
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-canvas">
                    <span
                      className={cx('block h-full rounded-full', isLow ? 'bg-coral' : 'bg-plum')}
                      style={{ width: `${Math.min(100, (p.stock / 40) * 100)}%` }}
                    />
                  </span>
                ) : null}
                <span className={cx('mt-0.5 block text-xs', isLow ? 'font-medium text-coral' : 'text-ink-2')}>
                  {isLow ? t('{n} left · alert at {a}', { n: p.stock, a: p.alertAt }) : t('{n} in stock · cost JD {c}', { n: p.stock, c: p.cost })}
                </span>
              </span>
              <span className="font-display text-base font-bold">{jd(p.price).replace('.00', '')}</span>
              <Icon name="chevronRight" size={16} className="text-ink-2" />
            </Card>
          )
        })}
      </Scroll>
      <TabBar active="products" />
    </Screen>
  )
}

// M15 · Add product — and Edit product when an id is given (tap a product in the list)
export function AddProduct({ id }: { id?: string }) {
  const { products, addProduct, updateProduct, back, push, showToast } = useStore()
  const existing = id ? products.find((p) => p.id === id) : undefined
  const editing = Boolean(existing)
  const [name, setName] = useState(existing ? t(existing.name) : '')
  const [price, setPrice] = useState(existing ? existing.price.toFixed(2) : '')
  const [cost, setCost] = useState(existing ? existing.cost.toFixed(2) : '')
  const [stock, setStock] = useState(existing ? String(existing.stock) : '')
  const [alertAt, setAlertAt] = useState(existing ? String(existing.alertAt) : '5')
  const bump = (n: number) => setStock((s) => String(Math.max(0, (parseInt(s) || 0) + n)))
  const pr = parseFloat(price) || 0
  const co = parseFloat(cost) || 0
  const profit = pr - co
  const margin = pr > 0 ? Math.round((profit / pr) * 100) : 0

  return (
    <Screen>
      <StatusSpacer />
      <TopBar
        title={editing ? t('Edit product') : t('New product')}
        right={
          <button type="button" onClick={back} className="text-sm font-medium text-ink-2">
            {t('Cancel')}
          </button>
        }
      />
      <Scroll className="space-y-4 pt-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="grid size-24 shrink-0 place-items-center rounded-3xl border-[1.5px] border-dashed border-coral/60 bg-white text-coral transition active:scale-95"
          >
            <span className="flex flex-col items-center gap-1 text-xs font-medium">
              <Icon name="camera" size={22} />
              {t('Add photo')}
            </span>
          </button>
          <div className="text-xs text-ink-2">
            <div className="mb-0.5 font-semibold text-ink">{t('Tip')}</div>
            {t('A clear photo on a plain background helps you find products fast.')}
          </div>
        </div>
        <Field label={t('Product name')} value={name} onChange={setName} placeholder={t('e.g. Oud & Amber candle')} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('Selling price')} prefix={t('JD')} value={price} onChange={setPrice} inputMode="decimal" placeholder="0.00" />
          <Field label={t('Cost price')} prefix={t('JD')} value={cost} onChange={setCost} inputMode="decimal" placeholder="0.00" />
          <Field label={t('In stock')} value={stock} onChange={setStock} inputMode="numeric" placeholder="0" />
          <Field label={t('Low-stock alert at')} value={alertAt} onChange={setAlertAt} inputMode="numeric" />
        </div>
        {editing && (
          <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-soft">
            <span className="text-sm font-medium">{t('Quick stock change')}</span>
            <span className="flex items-center gap-2" dir="ltr">
              {[-5, -1].map((n) => (
                <button key={n} type="button" onClick={() => bump(n)} className="h-8 min-w-10 rounded-full bg-canvas px-2 text-sm font-semibold text-burgundy active:scale-90">
                  {n}
                </button>
              ))}
              <span key={stock} className="anim-pop-in w-8 text-center font-display text-lg font-bold">
                {parseInt(stock) || 0}
              </span>
              {[1, 5].map((n) => (
                <button key={n} type="button" onClick={() => bump(n)} className="h-8 min-w-10 rounded-full bg-brand px-2 text-sm font-semibold text-white active:scale-90">
                  +{n}
                </button>
              ))}
            </span>
          </div>
        )}
        <div className="bg-brand-gradient rounded-3xl p-5 text-white shadow-raised">
          <div className="flex items-center justify-between text-sm text-white/75">
            {t('You make per item')}
            <span className="rounded-full bg-coral px-2.5 py-0.5 text-xs font-semibold text-white">{t('{n}% margin', { n: margin })}</span>
          </div>
          <div className="mt-1 font-display text-[34px] font-bold">{jd(Math.max(0, profit))}</div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-coral transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, margin))}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-white/75">
            <span>{t('Cost {v}', { v: jd(co) })}</span>
            <span className="font-semibold text-white">{t('Profit {v}', { v: jd(Math.max(0, profit)) })}</span>
          </div>
        </div>
      </Scroll>
      <Footer>
        {editing && existing && (
          <Button variant="secondary" icon="calculator" className="w-full" onClick={() => push({ name: 'calculator', id: existing.id })}>
            {t('Work out the price')}
          </Button>
        )}
        <Button
          icon="check"
          className="w-full"
          disabled={!name.trim() || pr <= 0}
          onClick={() => {
            const fields = { price: pr, cost: co, stock: parseInt(stock) || 0, alertAt: parseInt(alertAt) || 0 }
            if (existing) {
              // keep the original (English) name key if the seller didn't rename it
              updateProduct(existing.id, { ...fields, name: name.trim() === t(existing.name) ? existing.name : name.trim() })
              back()
              showToast(t('Changes saved'))
            } else {
              addProduct({ ...fields, name: name.trim() })
              back()
              showToast(t('{name} added', { name: name.trim() }))
            }
          }}
        >
          {editing ? t('Save changes') : t('Save product')}
        </Button>
      </Footer>
    </Screen>
  )
}
