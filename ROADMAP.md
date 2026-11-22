# TALI — features to add later

Ideas agreed for future versions. Not built yet.

---

## 1. WhatsApp ordering bot (AI)

Customers order by chatting with the shop's WhatsApp number; an AI bot replies, and confirmed orders land in TALI automatically.

**Flow**
1. Customer messages the shop's WhatsApp number (e.g. "بدي شمعتين عود وصابونة").
2. WhatsApp sends the message to TALI's server through the official **WhatsApp Business Platform (Cloud API)**.
3. The AI reads it against TALI's own data — products, prices, stock, delivery areas — understands Jordanian Arabic, and asks for anything missing (address, delivery time, payment).
4. The bot sends an order summary with **[Confirm]** and **[Edit]** buttons.
5. On Confirm the order appears in TALI: status **New**, channel **WhatsApp**, tag **"via WhatsApp bot"**; stock goes down, the delivery goes into the Planner, the seller gets a notification.
6. Anything unusual (complaint, custom order, off-topic) → "Layla will reply shortly" and the chat is flagged for the seller.

**Settings (Sales channels → WhatsApp bot)**
- Bot on / off, opening hours, greeting message, delivery areas
- **"Approve bot orders before confirming"** — orders wait for one tap from the seller before the customer gets the final confirmation

**Rules & costs to design around**
- Since 15 January 2026 WhatsApp bans *general-purpose* AI chatbots on the Business Platform; business bots for orders, support and sales are allowed. → The bot must only talk about the shop and decline anything else.
- Since 1 October 2026 Meta charges per message for replies inside the 24-hour customer-service window (each number gets 1,000 free service messages a month; messages from customers are free). Plus the AI provider's cost per message.
- Each seller needs a verified Meta Business account and a number registered on the WhatsApp Business Platform → TALI needs a guided, step-by-step setup.

**For the course prototype:** a simulated WhatsApp chat screen (scripted bot replies) where pressing Confirm creates a real order in the prototype — shows the idea without a real WhatsApp number.

---

## 2. Profit by channel

Show what the seller really keeps on each channel after platform commissions — e.g. "you keep JD 9 per candle on Instagram, JD 6.20 on Talabat".

- "Profit by channel" card in Finances and Insights (commission % set per channel in Sales channels)
- Channel filter on Orders

---

## 3. Real Talabat & Careem order sync

Today the Talabat / Careem connection in the prototype is simulated. Making it real means applying as an integration partner:

- Talabat (Delivery Hero) — partner / POS API, access after partner sign-up
- Careem Food — POS API, access restricted to registered partners

Note: orders from these platforms won't include the customer's personal WhatsApp number, so WhatsApp messaging applies to direct customers only.
