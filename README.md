# Timepass Premium

Market se sasta OTT — Movies, Adult aur Combo plans. UPI + Razorpay payment, Telegram verification.

Single-file static site (`index.html`) + 3 Vercel serverless functions.

---

## 🆕 Is update mein kya naya hai

1. **Multi-theme system** — 6 themes, switcher, localStorage mein save
2. **Naye prices** — Adult & Combo update
3. **Harsh Dev drawer redesign** — naya profile card + theme picker
4. **Fully responsive** — 320px se 4K tak, zero overflow
5. **🆕 Admin Control Center** — login karke prices aur settings website par se edit karo

---

## 🛡️ ADMIN CONTROL CENTER

Header ke **🛡️ shield icon** se kholo → password daalo → **Welcome Admin** dashboard.

### Tabs

| Tab | Kya hai |
|---|---|
| **OVERVIEW** | Visits, active plans, lowest price + saare current prices ka snapshot |
| **PRICING** | Saare 12 prices + Razorpay button IDs edit karo |
| **SETTINGS** | UPI ID, Razorpay link, Telegram/channel/bot, email, tagline |
| **VISITORS** | Visitor logs — export JSON / clear |

### Save karne ke 3 tareeke

| Button | Kya karta hai | Kaun dekhega |
|---|---|---|
| **SAVE LIVE** | Server (KV) par save | 🌍 **Sab customers** |
| **PREVIEW** | Browser ke localStorage mein | 👤 Sirf tumhara device |
| **COPY CODE** | `PRICING` block generate karke deta hai | GitHub pe paste karo → permanent |
| **RESET** | Code ke original defaults wapas | — |

Welcome banner par ek **status chip** hamesha batata hai abhi kaunsa source active hai:
`LIVE · SABKE LIYE ACTIVE` / `LOCAL DRAFT · SIRF IS DEVICE PAR` / `CODE DEFAULTS`.

> ⚠️ **Dhyan do:** "PREVIEW" sirf tumhare browser mein dikhta hai — customers ko purana price
> hi dikhega. Sabke liye change karna hai to **SAVE LIVE** (KV chahiye) ya **COPY CODE** → GitHub.

---

## ⚙️ Vercel setup — Environment Variables

Vercel → Project → **Settings → Environment Variables**

| Variable | Value | Kiske liye |
|---|---|---|
| `ADMIN_PASSWORD` | `Harsh@2007` | Admin panel login + price save |
| `TELEGRAM_BOT_TOKEN` | *(tumhara token)* | Visitor / purchase notifications |
| `TELEGRAM_CHAT_ID` | *(tumhara chat id)* | Notifications kahan jayein |
| `KV_REST_API_URL` | *(auto)* | **SAVE LIVE** ke liye |
| `KV_REST_API_TOKEN` | *(auto)* | **SAVE LIVE** ke liye |

Env var add/change karne ke baad **Deployments → Redeploy** zaroor karna.

### 🔐 Password ke baare mein — zaroor padhna

`Harsh@2007` **kaafi weak hai** — naam + birth year. Koi bhi guess kar sakta hai, aur
admin panel se **prices aur UPI ID dono badle ja sakte hain** (yaani tumhara paisa kisi
aur ke account mein ja sakta hai).

Strong password rakho, jaise: `Tp$9kQ2mXw7#Lz4` — `ADMIN_PASSWORD` mein daalo,
yaad rakhne ke liye password manager use karo. Password **kabhi code mein mat likhna**,
sirf env var mein.

---

## 💾 SAVE LIVE chalane ke liye (KV storage) — optional

Iske bina bhi site poori chalti hai, bas "SAVE LIVE" ki jagah "COPY CODE" use karna padega.

1. Vercel → Project → **Storage** tab
2. **Create Database → Upstash Redis** (free tier) → Connect to project
3. Vercel khud `KV_REST_API_URL` + `KV_REST_API_TOKEN` env vars add kar dega
4. **Redeploy** karo

Bas. Ab admin panel se **SAVE LIVE** dabate hi prices duniya bhar ke liye badal jayenge.

---

## 💰 Price badalne ke 2 tareeke

**A · Admin panel se (fast)** — site kholo → 🛡️ → login → PRICING → edit → SAVE LIVE

**B · Code se (permanent)** — `index.html` mein `<script>` ke top par `PRICING` object hai:

```js
const PRICING = {
  adult: {
    plans: [
      { n: '1 Month',  p: 100, b: '' },
      { n: '3 Months', p: 400, b: '' },
      ...
    ]
  }
};
```

`p` = price (₹) · `b` = Razorpay Payment Button ID (optional)

Admin panel ka **COPY CODE** button exactly yahi block bana ke deta hai — copy karke
GitHub pe paste kar do.

---

## 📊 Current prices

| Pack | 1 Month | 3 Months | 6 Months | 1 Year |
|---|---|---|---|---|
| 🎬 Movies & Series | ₹50 | ₹250 | ₹420 | ₹465 |
| 🔞 Adult Pack | ₹100 | ₹400 | ₹580 | ₹835 |
| 🌟 Combo Pack | ₹250 | ₹520 | ₹780 | ₹1500 |

---

## ⚠️ Razorpay buttons

Razorpay Payment Button ka amount **uske dashboard mein fixed** hota hai. Code ya admin
panel se price badalne par button ka amount **nahi** badalta.

Jin Adult plans ka price change hua (₹70→100, ₹200→400, ₹410→580), unke purane button IDs
**hata diye gaye hain**. Wo plans ab UPI + Universal Razorpay par jaate hain — amount hamesha
sahi jaata hai ✅. **₹835** ka price same hai, uska button as-is kaam kar raha hai.

**Naya button banane ke baad:** Razorpay Dashboard → Payment Buttons → naya button →
ID (`pl_xxxx`) copy → admin panel ke PRICING tab mein us plan ke **RZP ID** field mein paste → SAVE LIVE.

---

## 🎨 Themes

| Theme | ID |
|---|---|
| Obsidian Gold (default) | `obsidian` |
| Royal Amethyst | `amethyst` |
| Neon Cyber | `cyber` |
| Crimson Blood | `crimson` |
| Emerald Luxe | `emerald` |
| Pearl Light | `pearl` |

Header 🎨 button ya drawer → APPEARANCE. Naya theme add karna = ek `[data-theme="..."]`
CSS block + `THEMES` array mein ek entry.

---

## 📁 Files

```
index.html              — poori site (HTML + CSS + JS)
api/admin-auth.js       — admin password verify
api/pricing.js          — live pricing/settings store (Upstash Redis REST, zero deps)
api/telegram-notify.js  — Telegram notifications
vercel.json
```

---

© 2026 TIMEPASS PREMIUM · Crafted by Harsh Dev
