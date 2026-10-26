# Timepass Premium

Market se sasta OTT — Movies, Adult aur Combo plans. UPI + Razorpay payment, Telegram verification.

**React (Vite + TypeScript) single-page site + Vercel serverless Live Website Studio.**
Ek baar deploy karo, uske baad prices, content, links, images, offers, FAQ aur appearance —
sab admin panel se live update karo, **bina GitHub edit ya redeploy**.

---

## ⚡ TL;DR workflow

```
Studio kholo (/studio) → password → edit → PREVIEW → PUBLISH LIVE
```

- Content/price/link/offer change = **koi redeploy nahi**
- Code/bug/security change = **normal deploy** (yahi hona chahiye)

---

## 🧱 Stack

| Layer | Kya |
|---|---|
| Frontend | React 19 + Vite 7 + TypeScript (strict), vanilla CSS design system |
| Backend | 3 Vercel serverless functions (`/api`) — zero runtime dependencies |
| Storage | Upstash Redis / Vercel KV (REST), 20-revision history |
| Auth | `ADMIN_PASSWORD` env var, constant-time compare, password sirf memory mein |

---

## ✅ One-time setup (sirf ek baar)

### 1. Vercel project

Vercel → **Add New → Project** → repo import karo.

- Framework preset: **Vite** (auto-detect)
- Build command: `npm run build`
- Output directory: `dist`

`vercel.json` already ye config + SPA rewrites + `/api` no-store headers rakhta hai.

### 2. KV storage (publish ke liye zaroori)

1. Vercel → Project → **Storage** tab
2. **Create Database → Upstash Redis** (free tier kaafi hai) — ya Marketplace se **Upstash**
   integration install karo
3. **Connect to Project** → Production + Preview + Development teeno tick karo
4. ⚠️ **Redeploy** — Deployments → latest → ⋯ → **Redeploy**

Vercel khud ye env vars add kar deta hai (dono jodi supported hain):

| Jodi | Kab milti hai |
|---|---|
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Vercel KV / Storage tab se connect |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Upstash Marketplace integration |

> **Ye project Next.js nahi hai.** Integration page par jo
> `import { Redis } from "@upstash/redis"` / `Redis.fromEnv()` / `NextResponse` wala snippet
> dikhta hai — **wo ignore karo**. Is project ko sirf **environment variables** chahiye;
> `api/pricing.js` khud REST call karta hai (koi npm package nahi).

> KV set nahi hai to site **phir bhi chalti hai** (code defaults se) — bas Publish 501 dega aur
> Studio "KV OFF" chip dikhayega.

#### KV kaise check karo (2 tareeke)

1. Browser: `https://<site>.vercel.app/api/pricing` → **`"configured": false`** = off,
   **`true`** = ho gaya. False hone par `storage.missing` mein exact var names likhe hote hain.
2. **Studio → Overview → `Storage check` button** — provider, mile hue var names, missing vars
   aur "redeploy kiya?" hint dikhata hai.

#### Common galtiyan

| Symptom | Wajah |
|---|---|
| Storage connect kiya par `configured:false` | **Redeploy nahi kiya** — env vars purane deployment par nahi lagte |
| Vars sirf Preview par hain | Settings → Environment Variables → **Production** bhi tick karo |
| `KV_URL` (redis://) mila hai | Ye **TCP** url hai, is app ko **REST** url chahiye |
| Aadha jodi (sirf URL ya sirf TOKEN) | Dono chahiye — ek hi integration ki jodi use karo |
| DB paused/delete | Upstash dashboard → DB active hai ya nahi |
| Publish 200 par site purani | KV theek hai, par publish ke baad **hard refresh** karo (config cache 0 hai) |

### 3. Environment variables

Project → **Settings → Environment Variables**

| Variable | Kis liye |
|---|---|
| `ADMIN_PASSWORD` | Studio login + har publish/restore/reset |
| `KV_REST_API_URL` | auto (Storage connect karne par) |
| `KV_REST_API_TOKEN` | auto |
| `TELEGRAM_BOT_TOKEN` | visitor / purchase notifications |
| `TELEGRAM_CHAT_ID` | notifications kahan jayein |

Env var change karne ke baad **Redeploy** karna padega.

### 🔐 Password — ye zaroor padho

- **Strong & unique** password rakho (password manager se generate karo, 20+ characters).
- Password **code, README ya git mein kabhi mat likho** — sirf env var mein.
- Admin panel se prices aur UPI ID badle ja sakte hain. Weak password = koi bhi tumhara payment
  address badal sakta hai.
- Password browser ke `localStorage` mein **save nahi hota** — sirf memory mein rehta hai aur
  30 minute idle par session lock ho jata hai.

---

## 🛠️ LIVE WEBSITE STUDIO

`/studio` kholo (ya header ka 🛡️ shield icon) → password → dashboard.

| Tab | Kya edit hota hai |
|---|---|
| **Overview** | Storage status, live revision, plan count, lowest price, warnings |
| **Content** | Brand, hero heading/tagline/badge, trust strip, payment texts, footer, developer drawer |
| **Plans** | Pack title/subtitle/CTA/suffix/crown, har plan ka name, price, Razorpay ID + amount, hide / sold-out / featured |
| **Links & Images** | UPI ID, Razorpay link, Telegram support/channel/tracker bot, email, portfolio, logo, hero image |
| **Announcement** | Offer bar text, badge, CTA, tone, animation, expiry, dismissible |
| **Info & FAQ** | Info page (English / Hinglish / हिन्दी), "why it's affordable" points, policies, poora FAQ |
| **Appearance** | Naye visitors ke liye global default theme + dark theme |
| **Backups** | Export / Import JSON, 20 revisions, Restore, Reset |
| **Visitors** | Is browser ke visitor logs (export/clear) |

### Draft → Preview → Publish

1. Jo bhi edit karo, wo **draft** hai (auto-save, refresh par bhi safe)
2. **PREVIEW** — sirf tumhare device par site par apply hota hai (floating "Preview" bar dikhti hai)
3. **PUBLISH LIVE** — confirm karne ke baad KV mein naya revision jata hai aur **sabko** dikhta hai
   - Button loading state dikhata hai
   - Success: `✅ LIVE FOR EVERYONE · rev N`
   - Fail: exact error, aur tumhara draft **safe** rehta hai
4. **Discard** — draft delete, live config wapas

> Draft kabhi public nahi hota. Publish hi ekmatra "sabke liye" action hai.

### Backup / Import / Rollback

- **Export JSON** — poora validated config file
- **Import JSON** — server-side validation ke baad draft mein load hota hai (galat field = clear error)
- **Revisions** — har publish ka snapshot (max 20). `Load` = us revision ko draft mein dekho,
  `Restore` = us revision ko naya publish bana do (history bhi preserve)
- **Reset** — published config delete, site code defaults par (double confirm)
- Destructive actions par confirmation dialog hamesha aata hai

---

## 🎭 Pack stickers (emoji)

Har plan ka apna emoji sticker hota hai — home cards, info tiles aur buy page ke plan cards par dikhta hai.

- Default: Movies `🌙 ⭐ 🔥 👑` · Adult `🔓 🌶️ 🚀 💎` · Combo `🎟️ 🍿 💎 🏆`
- **Studio → Plans →** har plan ke saamne chhota sticker box — koi bhi emoji (max 8 characters) daal do
- Pack card par bada **watermark emoji** + crown pack par twinkle ✨ animation
- Purani saved configs mein sticker na ho to index se default aa jata hai (koi crash/blank nahi)

---

## 🎨 Themes

| Theme | Kya |
|---|---|
| **Obsidian Gold** (`obsidian`) | **Default** — bilkul purani site jaisa: deep black surfaces + gold accents |
| **Pearl Light** (`pearl`) | Light option — warm off-white surfaces, gold accent (☀️ toggle ka destination) |
| Violet Dark (`violet-dark`) | Premium purple dark |
| Amethyst / Cyber / Crimson / Emerald | Dark accent themes |

- Header mein **☀️ / 🌙 toggle** hai (accessible `aria-pressed` + keyboard).
  🌙 dabao → Obsidian Gold. ☀️ dabao → Pearl Light.
- **More themes** 🎨 button se saare 7 themes.
- Visitor ka choice `tp_theme` mein save hota hai. Refresh/reopen par wahi theme.
- **First-time visitor** ko admin ka published default milta hai (factory default = **Obsidian Gold**).
- Pehle paint se hi theme apply hota hai — **koi flash nahi**. Corrupt saved value → Obsidian Gold.
- `apple-light` theme hata diya gaya hai — purane visitors/configs ka value automatically Obsidian Gold par migrate ho jata hai.
- `meta theme-color` + `color-scheme` theme ke saath update hote hain.
- Theme transition ~250ms, `prefers-reduced-motion` respect karta hai.
- Saari theme screens (drawer, studio, modals, toasts) dono light/dark par legible hain.

### Responsive + touch

- Mobile-first: 320px se 4K tak koi horizontal scroll nahi.
- Har interactive element **≥44×44px** tap target (coarse pointer par auto-expand).
- Press par `scale(.97)` feedback — touch par turant response, koi 300ms delay nahi.
- Hover effects sirf `@media (hover:hover)` par — tap ke baad "sticky hover" nahi.
- `-webkit-tap-highlight-color: transparent`, `100dvh` modals, `env(safe-area-inset-*)` support.
- `prefers-reduced-motion` par animations band.

---

## 📢 Announcement / discount bar

Studio → **Announcement** — poori site ka offer banner wahin se control hota hai.

- **Quick presets** — ek click mein: `Starting ₹50`, `Limited time`, `New content`, `Festive sale`
  (text + badge + button + link sab bhar jate hain). Phir chahe to edit karo.
- **Live preview** pane ke sabse upar — publish se pehle wahi dikhega jo visitor ko dikhega.
- Tones: Gold / Violet / Urgent · Animation: **Shimmer**, **Marquee** (seamless loop), None
- Optional badge (pulsing dot ke saath), CTA button, **countdown chip** (`expiresAt` se)
- Dismissible — dismissal per revision save hota hai, naya publish karne par dobara dikhega
- Buy page par dikhana hai ya nahi — toggle
- Mobile par bar do saaf rows mein rehta hai (text cut nahi hota); reduced-motion users ko static bar

---

## 💳 Payment — Universal UPI (default) + desktop QR

**Aaj ka rule simple hai: price badlo, pay ka amount khud sahi ho jata hai.**

- Har plan ka `payMode = universal` hai → buyer ko **UPI deep link** (`upi://pay?pa=…&am=…`)
  aur **dynamic QR** milta hai, naya price pehle se bhara hua. Razorpay button ka purana
  amount kabhi galat charge nahi karega.
- **Studio → Plans → price field** badalte hi us plan ka mode automatic **Universal UPI**
  ho jata hai (mismatch warning bhi khatam).
- **Bulk buttons**: `Sab → Universal UPI` / `Sab → Razorpay Auto` — ek click mein poori site.
- **Desktop par** (mouse, koi touch nahi): bada **QR + amount chip + UPI ID + COPY** aur
  3-step scan guide dikhta hai — phone se scan karke pay karo.
- **Mobile / tablet par** (touch): primary button **`PAY ₹X VIA UPI →`** — GPay / PhonePe / Paytm
  seedha khulta hai. QR fallback ke roop mein chhota sa rehta hai.
- Device detection `pointer: coarse` + `maxTouchPoints` se hoti hai (sirf user-agent guess nahi),
  isliye touch-laptop ya tablet par bhi sahi flow chalta hai.
- Razorpay tabhi dikhta hai jab button ka amount **exactly** price ke barabar ho (`auto` mode).
  Naya button: Dashboard → Payment Buttons → `pl_xxxx` → Studio → Plans → RZP field + amount.
- UPI ID badloge to deep link, QR aur copy button sab update — `links.upi` single source hai.

---

### ⚠️ "UPI Risk Policy" alert (Paytm / GPay)

Personal VPA par P2P transfer karne par Paytm/GPay kabhi **"This payment may fail as per UPI
Risk Policy"** dikhate hain. Paisa nahi katta, payment register nahi hota — bas app doosra
tareeka maangta hai.

**Isliye site ka primary route Razorpay Universal hai:**

| Route | Kab | Kahan |
|---|---|---|
| **Razorpay Universal** (primary) | Hamesha — card / UPI / netbanking ek link mein | Payment page par sabse upar, gold **RECOMMENDED** button |
| **UPI ID** (`pmharshu@naviaxis`) | Jab UPI se hi pay karna ho | QR + UPI ID + COPY + deep-link button (secondary section) |
| **Mobile number** | Paytm ka "Pay via Mobile Number" | Studio → Links → *Payee mobile number* set karne par |

- UPI deep-link button ke **theek neeche warning** hai: *"UPI ID se payment fail ho sakti hai —
  Paytm/GPay personal UPI par risk-policy alert dikha ke rok dete hain. Aisa ho to **Razorpay
  Universal** se pay karo."*
- Payment page par **"IMPORTANT NOTES · PAYMENT"** panel (English / Hinglish / हिन्दी) —
  code se aata hai, publish kiye bina bhi live.
- UPI app na khule to 2.8s baad toast guide karta hai; QR image fail ho to UPI ID + COPY dikh jate hain.
- Razorpay raaste par koi risk alert nahi aata (merchant gateway), isliye wahi recommended hai.

#### UPI ID migration
Purana id `pmharsh@fam` retire ho gaya (wallet VPA par blocks zyada the). Ab default
**`pmharshu@naviaxis`** hai, aur already-published configs ka `pmharsh@fam` automatically
migrate ho jata hai — **dobara publish karne ki zaroorat nahi**.
Purana heading (`⚡ SECURE UPI PAYMENT`) aur caption (`FAMPAY / UPI ID`) bhi naye values par
move ho jate hain; admin ka apna custom text kabhi overwrite nahi hota.

> Long-term: personal VPA par repeated P2P transfers PSP ko flag kar dete hain. Agar alert roz
> aaye to **business/merchant UPI** lo ya Razorpay ko hi default rakho.

### 💰 OTT vs Timepass Premium (price comparison)

Home page par pricing ke neeche ek live comparison card hai:

- Netflix / JioHotstar / Prime / Zee5 / SonyLIV / Apple TV+ ke **typical ₹/month** vs
  aapka **best ₹/month** plan (config se calculate hota hai — price badlo, card khud update).
- Bar chart + `₹39/month` vs `₹499/month` wala seedha comparison + bachat line + footnote
  ki OTT prices approximate hain.
- **Teeno languages** (English / Hinglish / हिन्दी) — language switcher ke saath badalta hai.

---

## ❓ FAQ + Info (English / Hinglish / हिन्दी)

- **15 FAQs** — pricing, payment, access, support, policy. Core message: *OTT se kam price,
  affordable mein kya milega*, plus:
  - `Netflix / Prime vs Timepass Premium` — exact ₹ comparison
  - `Hidden charge ya auto-renew?` — one-time payment, koi renewal nahi
  - `Itna sasta kaise?` — bina middleman wala honest jawab
- **FAQ page** — help-center style hero (badge, live stats, floating emoji stickers),
  search jo match ko **highlight** karta hai, category chips **emoji + counts** ke saath,
  "Popular right now" pills (click karo → question khud khul jata hai), `Sare kholo / Sab band karo`
  toggle, har row par category emoji, aur "answer nahi mila?" Telegram help card.
- **Info page** — premium hero (starting price / packs / instant access stats), numbered value
  cards, **pack tiles** (bada emoji, per-plan stickers, FROM price, direct BUY button),
  emoji steps (🛒 💳 📸 🔑), policy cards, FAQ teaser aur support card — teeno languages mein.
- Saara text **Studio → Info & FAQ** se editable (har field ke 3 language inputs).
- Default language **Hinglish** hai; visitor ka choice `tp_lang` mein save hota hai.

---

## 🧪 Local development

```bash
npm install
npm run dev      # http://localhost:5173 — real /api bhi chalta hai
```

- Dev API ko Upstash ki zaroorat nahi — `dev-data/kv.json` use hota hai (gitignored)
- Dev admin password: shell ka `ADMIN_PASSWORD`, warna ek random password generate hoke
  `dev-data/dev-admin.txt` mein likha jata hai (dono gitignored — repo mein koi password nahi)
- `/studio` par login karke poora publish flow locally test kar sakte ho

```bash
npm run test       # 81 tests: schema, API auth/validation, themes, components, payments, app
npm run typecheck  # TypeScript strict
npm run build      # tsc + vite build → dist/
```

---

## 📁 Structure

```
index.html              Vite shell + FOUC-free theme boot
src/
  App.tsx               routes + site chrome
  components/           Header, Hero, PricingCards, PriceCompare, BuyPage, FAQ, Drawer, Modals, Announcement
  pages/                Home, Buy, Info, Faq
  studio/               Live Website Studio (gate, shell, panes, fields)
  state/                Theme, Config, Auth, Toast/Confirm, Lang providers
  config/               defaults + theme metadata
  lib/                  api, payments (UPI/RZP), router, storage, visits, notify
  styles/               legacy.css (original design) + themes.css + ui.css + studio.css + polish.css
api/
  _lib/defaults.js        default content (aaj ka exact site data)
  _lib/config-schema.js   server-side validation / migration (v1 → v2)
  _lib/kv.js              Upstash REST client (+ local file backend for dev)
  pricing.js              GET public config · POST publish/history/revision/restore/reset
  admin-auth.js           password verify (constant-time + throttle)
  telegram-notify.js      Telegram messages (token server-side)
tests/                   vitest suite
tools/dev-api-plugin.mjs Vite middleware that mounts /api locally
```

---

## 🔒 Security notes

- Public `GET /api/pricing` sirf public config deta hai — koi secret, token ya password nahi.
- Har write (`publish`, `import` ke baad publish, `restore`, `reset`) `ADMIN_PASSWORD` mangta hai.
- Server-side validation: type checks, length caps, price clamp, URL allowlist (`http/https` only),
  UPI/email/Telegram/Razorpay format checks. HTML/JS accept nahi hota (`<` `>` strip).
- Client har string ko text ke roop mein render karta hai (no `innerHTML` from config).
- Responsive: 320px → 4K, dono themes mein admin + purchase flow test kiya gaya.
- `Cache-Control: no-store` public config par, taaki publish turant dikhe.

---

## ⚠️ Ye redeploy **maangta** hai

- naya code / bug fix / security patch
- naya env var
- KV connect/reconnect

Baaki **sab kuch** (price, plan, content, links, images, announcement, FAQ, default theme,
rollback) Studio se hota hai.

---

© 2026 TIMEPASS PREMIUM · Crafted by Harsh Dev
