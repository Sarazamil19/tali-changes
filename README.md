# TALI

Your whole business, in one calm place. TALI handles orders, stock, customers and profit for home and Instagram sellers in Jordan. It works in Arabic and English, on the phone and on the web.

- **Phone app + web dashboard:** one React app. Phones get the mobile app, while tablets and computers get the dashboard.
- **Real accounts:** sign in with your phone number and a code sent on WhatsApp.
- **Private data:** Supabase Postgres with row-level security keeps each seller's data to herself.
- **Live sync:** an order added on the phone appears on the laptop within a second.
- **Installable:** add it to the home screen now, with App Store and Google Play support ready through Capacitor.

👉 **To go live, follow [SETUP.md](SETUP.md)**: database, WhatsApp codes, hosting, your domain and the phone.

```bash
npm install
cp .env.example .env.local   # add your Supabase URL + key, or leave empty for the demo
npm run dev
```

Stack: React 19, Vite, Tailwind CSS v4, TypeScript, Supabase (`@supabase/supabase-js`).
