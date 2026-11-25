// WhatsApp messaging — ready-made templates and click-to-chat links (wa.me).
// No WhatsApp API needed: TALI opens WhatsApp with the message typed in, the seller taps Send.
import { jd, jd0, orderTotals, type Customer, type Order, type Product } from './data'
import { getLang, t, tParts } from './i18n'

export type TemplateId = 'confirm' | 'payment' | 'delivery' | 'thanks' | 'hello' | 'winback' | 'vip' | 'promo'

export const orderTemplates: TemplateId[] = ['confirm', 'payment', 'delivery', 'thanks']
export const customerTemplates: TemplateId[] = ['hello', 'thanks', 'winback', 'vip']

export const templateLabel: Record<TemplateId, string> = {
  confirm: 'Order confirmation',
  payment: 'Payment details',
  delivery: 'Out for delivery',
  thanks: 'Thank you',
  hello: 'New collection',
  winback: 'Win-back offer',
  vip: 'VIP thank-you',
  promo: 'Product spotlight',
}

/** Jordanian mobile "079 555 0148" → international "962795550148" for wa.me */
export function toWhatsAppNumber(phone: string) {
  let d = phone.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('0')) d = '962' + d.slice(1)
  return d
}

export const whatsappLink = (phone: string, text: string) => `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(text)}`

export function buildMessage(id: TemplateId, opts: { customer: Customer; order?: Order; products: Product[]; business: string; product?: Product }) {
  const { customer, order, products, business, product } = opts
  const ar = getLang() === 'ar'
  const first = t(customer.name.split(' ')[0])
  const shop = t(business)
  const lines = order
    ? order.lines
        .map((l) => {
          const p = products.find((x) => x.id === l.productId)
          return p ? `• ${l.qty} × ${t(p.name)}` : ''
        })
        .filter(Boolean)
        .join('\n')
    : ''
  const total = order ? jd(orderTotals(order, products).total) : ''
  const delivery = order ? tParts(order.delivery) : ''
  const num = order ? `#${order.id}` : ''
  const item = product ? t(product.name) : ''
  const price = product ? jd0(product.price) : ''

  if (ar) {
    switch (id) {
      case 'confirm':
        return `مرحباً ${first} 🌸\nشكراً لطلبك من ${shop}!\n\nالطلب ${num}:\n${lines}\n\nالمجموع: ${total}\nالتوصيل: ${delivery}\n\nيرجى تأكيد العنوان بالرد على هذه الرسالة.`
      case 'payment':
        return `مرحباً ${first}،\nالمبلغ المطلوب للطلب ${num} هو ${total}.\n\nيمكنك الدفع عبر كليك (CliQ) على الاسم المستعار: LAYLACANDLES\nأو نقداً عند الاستلام.\n\nشكراً لك 💛`
      case 'delivery':
        return `مرحباً ${first} 🚚\nطلبك ${num} في الطريق إليك!\nموعد التوصيل المتوقع: ${delivery}.\n\nالمبلغ عند الاستلام: ${total}`
      case 'thanks':
        return `شكراً لك يا ${first}! 💛\nنتمنى أن يعجبك طلبك من ${shop}.\nشاركينا صورة وأشيري لنا على إنستغرام @laylas.candles`
      case 'hello':
        return `مرحباً ${first} ✨\nوصلت مجموعة شموع جديدة إلى ${shop}!\nهل تحبين أن أرسل لك الصور والأسعار؟`
      case 'winback':
        return `مرحباً ${first} 💛\nاشتقنا لك في ${shop}!\nهذا خصم 10% على طلبك القادم، فقط ردّي بالكود BACK10.\nهل تحبين أن أرسل لك الجديد؟`
      case 'vip':
        return `مرحباً ${first} ⭐\nأنتِ من أغلى زبائننا في ${shop}، شكراً لك!\nلك الأولوية في اختيار مجموعتنا الجديدة قبل الجميع. هل أرسل لك الصور؟`
      case 'promo':
        return `مرحباً ${first} ✨\nهل جرّبتِ ${item}؟ من أجمل منتجاتنا في ${shop}، والسعر ${price}.\nهل أحجز لك واحدة؟`
    }
  }
  switch (id) {
    case 'confirm':
      return `Hi ${first} 🌸\nThank you for your order from ${shop}!\n\nOrder ${num}:\n${lines}\n\nTotal: ${total}\nDelivery: ${delivery}\n\nPlease reply to confirm your address.`
    case 'payment':
      return `Hi ${first},\nThe total for order ${num} is ${total}.\n\nYou can pay by CliQ to the alias: LAYLACANDLES\nor in cash on delivery.\n\nThank you 💛`
    case 'delivery':
      return `Hi ${first} 🚚\nYour order ${num} is on its way!\nExpected delivery: ${delivery}.\n\nAmount to pay on delivery: ${total}`
    case 'thanks':
      return `Thank you ${first}! 💛\nWe hope you love your order from ${shop}.\nShare a photo and tag us on Instagram @laylas.candles`
    case 'hello':
      return `Hi ${first} ✨\nA new candle collection just arrived at ${shop}!\nWould you like me to send you photos and prices?`
    case 'winback':
      return `Hi ${first} 💛\nWe miss you at ${shop}!\nHere’s 10% off your next order, just reply with the code BACK10.\nWould you like to see what’s new?`
    case 'vip':
      return `Hi ${first} ⭐\nYou’re one of our favourite customers at ${shop}, thank you!\nYou get first pick of our new collection before anyone else. Shall I send you the photos?`
    case 'promo':
      return `Hi ${first} ✨\nHave you tried our ${item}? It’s one of our favourites at ${shop}, ${price}.\nWould you like me to save one for you?`
  }
}
