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
