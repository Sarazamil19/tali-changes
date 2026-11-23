# TALI — changes for the Figma Make project

These files go into the **Tali** repository (`Sarazamil19/Tali`) at exactly the same paths.
Copy them over the existing project (or drag them into Figma Make's code view) — nothing else in the project needs to change.
No new packages are needed: everything uses React 19 + Tailwind CSS v4, which the project already has.

Source design: Figma → page **Hi-fi · Mobile** (`node-id=82-68`), screens M0–M24.

## Modified files

| Path | What changed |
| --- | --- |
| `src/App.tsx` | Was an empty page. Now the app shell: phone frame on desktop (full screen on a real phone), status bar, screen router with transitions, back-up sheet and toast messages. |
| `src/index.css` | TALI design tokens from the Figma variables (colours, fonts, shadows), Google Fonts (Manrope, Inter, IBM Plex Sans Arabic) and the prototype animations. |
| `.figma/make/site.json` | Site title and description set to TALI. |

## New files

| Path | What it is |
| --- | --- |
| `src/web/WebApp.tsx` | **Desktop web dashboard** — sidebar + header shell, Sign in, and the New order / New product / New task windows. |
| `src/web/Dashboard.tsx` | Dashboard: KPI cards, Sales & profit chart, “Where your sales went” donut, Recent orders, Today, Best-selling, Low stock. |
| `src/web/Records.tsx` | Orders (table, status tabs, search, details drawer), Products (table + inventory), Customers (table + profile panel). |
| `src/web/Planner.tsx` | Planner: week calendar (deliveries come from orders automatically) and Tasks board with progress + suggestions. |
| `src/web/Business.tsx` | Finances, Price calculator, Insights, Settings (Sales channels incl. Talabat & Careem, profile, language, notifications). |
| `src/web/kit.tsx` | Desktop building blocks: panels, KPI card, donut, bars, table cells, modal, drawer, language toggle. |
| `src/app/growth.ts` | **Growth tools logic**: Today’s brief items, product coach labels, customer groups (VIP / New / Quiet) and monthly goal maths. |
| `src/components/Growth.tsx` | **Growth tools UI** shared by mobile and desktop: brief rows, goal ring + goal form, coach label + coach card, group chips, and “Send an offer” to a customer group on WhatsApp. |
| `src/components/Sheets.tsx` | **New customer form** and **order status picker** (bottom sheet on mobile, window on desktop). |
| `src/app/whatsapp.ts` | **WhatsApp messages**: ready-made templates (order confirmation, payment details with CliQ, out for delivery, thank you, new collection) in English & Arabic, and the click-to-chat link (`wa.me`). |
| `src/components/WhatsApp.tsx` | WhatsApp composer (bottom sheet on mobile, window on desktop), the green “WhatsApp customer” button and the “Last WhatsApp” line. |
| `src/app/i18n.ts` | **Arabic translations** (every screen) + the `t()` helper. English is the key, Arabic the value — add or edit wording here. |
| `src/app/data.ts` | Sample data for “Layla’s Candles”: products, customers, orders, tasks, expenses. |
| `src/app/store.tsx` | App state + navigation (stack router with push / pop / slide-up / fade transitions). |
| `src/components/Icon.tsx` | The TALI icon set (24px, 1.75 stroke). |
| `src/components/Logo.tsx` | Your logo, exported from Figma (node 78:367). |
| `src/components/ui.tsx` | Design-system components: Button, Chip, Segmented, Underline tabs, Field, Search, Card, Pill / Status badge, Avatar, List row, Top bar, Footer, Tab bar. |
| `src/screens/Onboarding.tsx` | M0 Splash · M1 Welcome · M9 Quick setup · M12 Create account · M11 Back-up sheet |
| `src/screens/Home.tsx` | M2 Home · M10 Home first use |
| `src/screens/Orders.tsx` | M3–M5 Add order (3 steps) · Order saved animation · M13 Orders · M6 Order details |
| `src/screens/Products.tsx` | M14 Products · M15 Add product |
| `src/screens/Planner.tsx` | M7 Calendar · M8 My tasks · M24 Add task |
| `src/screens/Business.tsx` | M17 More · M18 Customers · M19 Customer details · M16 Finances · M20 Price calculator · M21 Insights · M22 Settings · M23 Sales channels (Instagram, Website, Talabat, Careem) |

## Review fixes

- **Add new customer** works: a real form (name, phone, area, channel) from New order and from Customers, on mobile and desktop. The new customer is selected in the order straight away.
- **Order status**: instead of tapping “Mark as …” again and again, tap **Change status** (or the Status row) and pick any step directly — New, Confirmed, Processing, Shipped, Delivered — or **Cancel order**.
- **Price calculator ↔ products**: pick a product at the top; its cost and price load in; **Save to [product]** updates that product. Opened from a product with **Work out the price**.
- **Products are tappable**: tap a product to edit name, prices, stock (with quick −5 / −1 / +1 / +5) and alert level. On desktop, click a row.
- **Add product** starts with an empty form (it used to be pre-filled, which created duplicates).

## WhatsApp the customer

- Green **WhatsApp customer** button on Order details (mobile + desktop order panel) and on the customer profile (mobile + desktop).
- Pick a ready-made message — it is filled in with the customer’s name, products, total, delivery time — edit it in the chat-bubble preview, then **Send on WhatsApp** opens WhatsApp with the text ready (the seller presses Send there). **Copy** is a backup.
- “Is their WhatsApp number different?” lets you send to another number for that message only.
- Each message is remembered on the order: “Last WhatsApp: Payment details · 12:52”.
- Works without any WhatsApp API or account setup — it uses WhatsApp’s official click-to-chat link.

## Desktop dashboard

- **Phones** open the **mobile app** (full screen). **Tablets and computers** open the **web dashboard** (Sign in → Dashboard).
- Header button **Mobile app** shows the phone prototype; **Open the web dashboard** (beside the phone) goes back. Both use the same data — an order added on the phone appears on the dashboard and the other way round.
- **Responsive:** the dashboard also works on phones and tablets. Below 1024px the sidebar becomes a ☰ menu that slides in, cards stack, tables keep only the key columns, the week calendar shows one day at a time with a day picker, and windows open as bottom sheets. On phones the mobile app opens by default; **More → Web dashboard** in the app opens the dashboard, and the 📱 button on the dashboard goes back to the app.
- Pages: Dashboard, Insights, Orders, Products, Customers, Planner (Calendar / Tasks), Finances, Price Calculator, Settings. All in English and Arabic (RTL).

## Arabic (RTL)

- Switch language from **Welcome** (English · عربي), **Quick setup** (App language), **More → Language**, **Settings → Language**, or the switch beside the phone on desktop. The choice is remembered.
- In Arabic the whole interface flips right-to-left: layout, back arrows and chevrons, slide transitions (screens enter from the left), the calendar and progress bars.
- Font switches to **IBM Plex Sans Arabic**; prices show as `38.00 د.أ`, times as `9:30 ص / م`. Charts keep a left-to-right time axis.
- Sample data (names, products, areas, tasks) is translated too: Layla’s Candles → شموع ليلى, Rania Haddad → رانيا حداد …

## What works in the prototype

- Splash → Welcome → **Start now** (guest) → Quick setup → first-use Home, or **I already have an account** → Home.
- Guest **Back up** sheet slides up → Create account (OTP boxes) → data kept.
- **Add order** in 3 steps (choose customer, +/− quantities, payment) → “Order saved” check animation → Order details slides up. The new order appears in Orders, the customer’s history, the Home agenda and My tasks; stock goes down.
- Order details: **Mark as Confirmed → Processing → Shipped → Delivered**.
- Orders search + status filters, Customers search, Products / Inventory view, Add product with live margin.
- Planner: pick a day in the week strip; My tasks — tap a task to tick it done (and again to undo); Add task.
- Price calculator and Add product recalculate profit as you type; target-margin chips set the price.
- Sales channels: connect / disconnect Instagram, Website, Talabat and Careem; Settings shows “x of 4 connected”.
- Tab bar on every main screen; the centre **+** starts a new order.


## Growth tools — Today’s brief, Product coach, Customer groups & offers, Monthly goal

**Copy into Figma Make**

- New: `src/app/growth.ts`, `src/components/Growth.tsx`
- Changed: `src/app/data.ts`, `src/app/i18n.ts`, `src/app/store.tsx`, `src/app/whatsapp.ts`, `src/screens/Home.tsx`, `src/screens/Products.tsx`, `src/screens/Business.tsx`, `src/web/Dashboard.tsx`, `src/web/Records.tsx`, `src/web/WebApp.tsx`

**What’s new**

- **Today’s brief.** On mobile it slides up once when the app opens. Brand-new sellers don’t see it until they have data. The bell shows how many items are waiting and opens the full list, and Home shows the top two. On desktop it is a dashboard panel, and the bell opens it in a window. Items: new orders to confirm, today’s deliveries, cash to collect, low stock, quiet customers, an underpriced product, a hidden gem, and the monthly goal pace. Each item has a one-tap action and can be dismissed.
- **Product coach.** Each product gets a label: ⭐ Star, 💎 Hidden gem, ⚠️ Underpriced, 🐢 Slow mover, 👍 Steady seller or 🌱 Too new to tell. The label comes from sales this month and the profit margin. Product details show advice. An underpriced product gets a “Use JD 11 as the new price” button, a hidden gem gets “Promote to VIP customers”, and a star that is low on stock gets “Remind me to restock”. The desktop Products page adds summary cards and a Coach column.
- **Customer groups + offers.** Customers can be filtered by All / ⭐ VIP (spent JD 150+) / 🆕 New / 😴 Quiet (no order in 60+ days), and each row shows small group labels. **Send an offer** lets you pick a group and a message (Win-back offer with code BACK10, VIP thank-you, Product spotlight, New collection). You can edit the message; `[name]` becomes each customer’s first name. Then you send it to each customer on WhatsApp with one tap, with a “2 of 3 sent” count.
- **Monthly goal.** A progress ring on Home and the dashboard shows sales against the goal, how much is left, the days left, and the amount needed per day. Tap it (or Edit) to set the goal, with quick picks. It celebrates when the goal is reached 🎉.
- Sample data now includes units sold per product, days since each customer’s last order, and three quiet customers (Hala, Noor, Sami). The soap’s cost is JD 6, so the coach has an underpriced example.
- Everything works in English and Arabic (RTL).
