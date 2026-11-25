# TALI: from prototype to a real app

This guide takes TALI from this repository to a live app with a database, accounts, sync, a web address and a home-screen icon. Follow the steps in order. Each one says where to click.

**What's already built**

| Need | How TALI does it |
| --- | --- |
| Data saved permanently | A Supabase Postgres database (`supabase/migrations/0001_tali.sql`) holding products, customers, orders and order items, tasks, expenses, WhatsApp messages and the business profile. |
| Real accounts, private data | Sign-in with a phone number and a 6-digit code sent on **WhatsApp**. Row-level security means each seller can only read and change her own rows, enforced by the database itself. |
| Phone ⇄ laptop sync | Supabase Realtime. A change on one device appears on the others within about a second. |
| Real web address | Ready for Vercel (`vercel.json`). Add your own domain such as `app.tali.jo`. |
| Installable on the phone | A web app manifest, app icons and an offline-ready service worker. Phones can "Add to Home Screen" now. `capacitor.config.json` is ready for the App Store and Google Play later. |

**How the app behaves**

- **No database configured** (for example in Figma Make): the demo with Layla's sample data, exactly as before.
- **Database configured, not signed in:** "Start now, no account needed" keeps the seller's own data on her phone.
- **Signed in:** when she creates an account, everything on the phone is moved into it. From then on all data is saved and synced.

---

## 1. Create the database (Supabase): about 10 minutes

1. Go to **supabase.com** → *Start your project* → sign in with GitHub.
2. Create a project:
   - **Name:** `tali`
   - **Database password:** generate one and save it somewhere safe.
   - **Region:** *Central EU (Frankfurt)*, the closest to Jordan.
3. When the project is ready, open **SQL Editor** → *New query*. Paste the whole file `supabase/migrations/0001_tali.sql` and press **Run**. You should see "Success. No rows returned".
4. Open **Project Settings → API** (or **Data API**) and copy two values. You'll need them in step 3:
   - **Project URL**, e.g. `https://abcd1234.supabase.co`
   - **anon / publishable key**, the long public key. *Never* use the `service_role` key in the app.

## 2. Turn on WhatsApp codes: Twilio

Supabase sends the codes through Twilio. WhatsApp codes are only available with the Twilio and Twilio Verify providers.

**To test right away, before Twilio:** in Supabase go to **Authentication → Sign In / Providers → Phone**, turn **Phone** on, and add **test phone numbers** with fixed codes, for example `962795550100=123456`. That number can then sign in with code `123456`, and no message is sent. This is ideal for your course demo.

**For real sellers:**

1. Create an account at **twilio.com** and upgrade it from trial.
2. In Twilio, open **Verify → Services → Create**, name it `TALI` and enable the **WhatsApp** channel. Twilio guides you through connecting a WhatsApp sender. This needs a Meta Business account, and approval can take a few days.
3. Copy the **Account SID**, **Auth Token** and **Verify Service SID**.
4. In Supabase go to **Authentication → Sign In / Providers → Phone** and turn Phone on:
   - **SMS provider:** *Twilio Verify*
   - Paste the three values from step 3, then save.
5. Optional: under **Authentication → Rate Limits**, keep the code limits low to avoid surprise bills.

The app always asks for WhatsApp (`channel: 'whatsapp'`). If you later want SMS as well, it's a one-line change in `src/app/cloud.ts` → `sendCode`.

## 3. Put it online (Vercel): about 5 minutes

1. Go to **vercel.com** → sign in with GitHub → **Add New → Project** → import **`tali-app`**.
2. Vercel detects **Vite** automatically. Keep the defaults: build `npm run build`, output `dist`.
3. Open **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon/publishable key
4. Press **Deploy**. After about a minute TALI is live at `https://tali-app.vercel.app` (or similar).
5. Back in Supabase, go to **Authentication → URL Configuration** and set **Site URL** to that address.

Every push to GitHub now redeploys automatically.

> Note: Vercel's free *Hobby* plan is for non-commercial use. When TALI starts charging sellers, move to Vercel Pro, or deploy the same repo to Netlify or Cloudflare Pages, which work the same way. `vercel.json` is only needed on Vercel.

## 4. Your own address (e.g. `app.tali.jo`)

1. Buy the domain:
   - `.jo` domains are managed by Jordan's registry and have their own rules and paperwork, so ask a Jordanian registrar.
   - `.com` or `.app` (e.g. `gettali.com`) can be bought in minutes at Namecheap, Cloudflare and similar registrars.
2. In Vercel, open **Project → Settings → Domains → Add** and type `app.tali.jo` (or your domain).
3. Vercel shows a **CNAME** record. Add it at your registrar's DNS settings. It usually works within an hour.
4. Update Supabase **Site URL** to the new address.

## 5. On the phone

- **iPhone:** open the address in **Safari** → *Share* → **Add to Home Screen**.
- **Android:** open it in **Chrome** → menu → **Install app**.

TALI then opens full-screen with its own icon, like a normal app.

## 6. Later: App Store and Google Play

The same code can be wrapped as a native app with **Capacitor**. `capacitor.config.json` is already in the repo (app ID `jo.tali.app`).

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npm run build
npx cap add android      # needs Android Studio
npx cap add ios          # needs a Mac with Xcode
npx cap sync
npx cap open android     # or: npx cap open ios
```

- **Developer accounts:** Apple Developer Program (yearly fee) and Google Play Console (one-time fee).
- **Before submitting, both stores expect:**
  - a privacy policy page
  - a way to delete an account
  - screenshots

---

## Run it on your computer

```bash
npm install
cp .env.example .env.local      # then paste your Supabase URL and key
npm run dev                     # http://localhost:5173
```

Leave `.env.local` empty to run the sample-data demo.

## Where things are

| File | What it does |
| --- | --- |
| `supabase/migrations/0001_tali.sql` | Tables, row-level security, the new-account trigger, `create_order` (order + items + stock + delivery task in one step), `set_order_status` (cancelling restocks), realtime. |
| `src/app/cloud.ts` | Supabase connection: WhatsApp sign-in, loading, saving each change, moving guest data into an account, live updates. |
| `src/app/store.tsx` | App state. Works in three modes: `demo`, `local` (guest on this phone) and `cloud` (signed in). |
| `src/app/derive.ts` | Turns stored timestamps into what screens show: "Today · 9:30 AM", units sold this month, a customer's last order. |
| `src/app/metrics.ts` | Real sales, costs, expenses and profit by day, week and month, plus the six-month chart. |
| `src/components/Auth.tsx` | The phone + WhatsApp code form, used in the app and on the dashboard. |
| `public/manifest.webmanifest`, `public/sw.js`, `public/icons/` | Installable app. |

## Not real yet (next steps)

- **Insights page:** still shows example charts and says so. Home, Dashboard and Finances use real numbers.
- **Planner week calendar** (desktop): still shows the sample week. The task lists are real.
- **Sales channels** (Instagram, Talabat, Careem, website): they are on/off labels with no live connection yet. See `ROADMAP.md` in tali-changes.
- **Notifications:** Today's brief appears in the app. Push notifications are a later step.
- **Editing the business name after setup**, and **deleting an account** (needed for the app stores).
