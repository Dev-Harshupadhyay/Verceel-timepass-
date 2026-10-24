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
2. **Create Database → Upstash Redis** (free tier kaafi hai)
3. **Connect to Project** → Vercel khud `KV_REST_API_URL` + `KV_REST_API_TOKEN` add kar dega
4. **Redeploy**

Manual Upstash use kar rahe ho to ye env vars bhi supported hain:
`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.

> KV set nahi hai to site **phir bhi chalti hai** (code defaults se) — bas Publish 501 dega aur
> Studio "KV OFF" chip dikhayega.

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

## 🎨 Themes

| Theme | Kya |
|---|---|
| **Apple Light** (`apple-light`) | **Default** — white surfaces, soft neutral grays, restrained gold accent |
| **Obsidian Gold** (`obsidian`) | **Dark mode toggle ka destination — bilkul purani site jaisa** |
| Violet Dark (`violet-dark`) | Premium purple dark |
| Amethyst / Cyber / Crimson / Emerald / Pearl | Purane 6 themes — sab preserved |

- Header mein **☀️ / 🌙 toggle** hai (accessible `aria-pressed` + keyboard).
  🌙 dabao → aaj wali exact dark site. ☀️ dabao → Apple Light.
- **More themes** 🎨 button se saare 8 themes.
- Visitor ka choice `tp_theme` mein save hota hai. Refresh/reopen par wahi theme.
- **First-time visitor** ko admin ka published default milta hai (factory default = Apple Light).
- Pehle paint se hi theme apply hota hai — **koi flash nahi**. Corrupt saved value → Apple Light.
- `meta theme-color` + `color-scheme` theme ke saath update hote hain.
- Theme transition ~250ms, `prefers-reduced-motion` respect karta hai.

---

## 📢 Announcement / discount bar

Studio → **Announcement** → enable + text likho.

- Tones: Gold / Violet / Urgent
- Animation: **Shimmer** (text par gradient sweep), **Marquee** (lamba text), None
- Optional badge, CTA button, countdown (`expiresAt` se), dismissible
- Dismissal per revision save hota hai — naya publish karne par dobara dikhega
- Buy page par dikhana hai ya nahi — toggle
- Reduced-motion users ko static readable bar milta hai

---

## 💳 Razorpay + UPI

- **Razorpay Payment Button ka amount unke dashboard mein fixed hota hai.** Isliye har plan ke saath
  `razorpayAmount` bhi store hota hai.
- `payMode = auto` (default): button amount **price se match** kare to Razorpay button, warna
  **automatically UPI + Universal** par jata hai — galat amount charge nahi hoga.
- Studio mein mismatch hone par red warning dikhti hai.
- UPI deep link (`upi://pay?...`) aur QR dono **`links.upi` se generate** hote hain — UPI ID
  badloge to QR + button + DM sab update.
- Naya Razorpay button: Dashboard → Payment Buttons → ID (`pl_xxxx`) copy → Studio → Plans →
  us plan ke RZP field mein paste → amount bhi likho → Publish.

---

## ❓ FAQ + Info (English / Hinglish / हिन्दी)

- **Info** page: OTT se kam price, affordable kaise, kya milta hai, pack comparison, how it works,
  policies aur support — teeno languages mein, language switcher ke saath.
- **FAQ**: search + category filters + smooth accordion (keyboard + screen-reader friendly).
  Home page par top 4 questions ka teaser.
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
  components/           Header, Hero, PricingCards, BuyPage, FAQ, Drawer, Modals, Announcement
  pages/                Home, Buy, Info, Faq
  studio/               Live Website Studio (gate, shell, panes, fields)
  state/                Theme, Config, Auth, Toast/Confirm, Lang providers
  config/               defaults + theme metadata
  lib/                  api, payments (UPI/RZP), router, storage, visits, notify
  styles/               legacy.css (original design, untouched) + apple.css + ui.css + studio.css
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
