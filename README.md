# Timepass Premium

Market se sasta OTT — Movies, Adult aur Combo plans. UPI + Razorpay payment, Telegram verification.

Single-file static site (`index.html`) + 2 Vercel serverless functions.

---

## 🆕 Is update mein kya naya hai

### 1. Multi-theme system (6 themes)
Header ke **🎨 palette button** se ya drawer ke **APPEARANCE** section se theme badlo.
Choice `localStorage` mein save hoti hai, next visit pe wahi theme khulta hai.

| Theme | ID | Look |
|---|---|---|
| Obsidian Gold | `obsidian` | Black lacquer + gold (default, purana look) |
| Royal Amethyst | `amethyst` | Deep violet + purple glow |
| Neon Cyber | `cyber` | Midnight blue + electric cyan |
| Crimson Blood | `crimson` | Near-black + blood red |
| Emerald Luxe | `emerald` | Dark forest + emerald green |
| Pearl Light | `pearl` | Light / day mode |

Poori site CSS variables par chalti hai (`--acc-rgb`, `--ink`, `--surf-0` …), isliye
naya theme add karna = bas ek naya `[data-theme="..."]` block + `THEMES` array mein ek entry.
Theme first paint se pehle apply hota hai, so koi flash nahi hota.

### 2. Naye prices

| Pack | 1 Month | 3 Months | 6 Months | 1 Year |
|---|---|---|---|---|
| 🎬 Movies & Series | ₹50 | ₹250 | ₹420 | ₹465 |
| 🔞 Adult Pack | **₹100** | **₹400** | **₹580** | ₹835 |
| 🌟 Combo Pack | **₹250** | **₹520** | **₹780** | **₹1500** |

### 3. Harsh Dev section redesign (drawer)
Naya profile hero card (gradient avatar + online dot), stats strip, skill chips,
"HIRE / CONTACT HARSH" CTA, inline theme picker, timeline-style purchase guide.
Sticky header, independent scroll area, swipe-right to close, Esc to close, `aria` labels.

### 4. Fully responsive
320px se 4K tak test kiya — zero horizontal overflow.
- Phone: 1 column · Tablet (560–759px): 2 columns + Combo full-width · Desktop: 3 columns
- Plan grid 2-up → 4-up, prices `clamp()` se scale karte hain (₹1500 bhi fit hota hai)
- 340px se neeche header "PREMIUM" word hide ho jaata hai taaki buttons na toote
- Drawer 370px se neeche full-screen ho jaata hai
- Landscape phone, `100dvh`, iOS safe-area, 38px+ touch targets, keyboard navigation

### 5. Bonus
- Plan cards pe **per-month price** aur auto **"BEST VALUE"** badge
- Pricing cards pe **"FROM ₹X"** badge
- Ek hi jagah se price control (neeche dekho)

---

## 💰 Price kaise badlein

`index.html` mein `<script>` ke bilkul top par **`PRICING`** object hai. Sirf wahan edit karo —
pricing cards, plan grid, UPI amount, QR, Telegram message **sab apne aap update** ho jayenge.

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

- `p` = price (₹)
- `b` = Razorpay Payment Button ID (optional)

---

## ⚠️ Razorpay buttons — zaroori baat

Razorpay Payment Button ka amount **uske dashboard mein fixed** hota hai. Code mein price
badalne se button ka amount **nahi** badalta.

Isliye jin Adult plans ka price change hua (₹70→100, ₹200→400, ₹410→580), unke purane
button IDs **hata diye gaye hain** (`b: ''`). Wo plans ab UPI + Universal Razorpay link par
jaate hain — amount hamesha sahi jaata hai. ✅

**₹835 (1 Year Adult)** ka price same hai, to uska button ID as-is kaam kar raha hai.

**Naya button banane ke baad:**
1. Razorpay Dashboard → Payment Buttons → naya button (sahi amount ke saath)
2. Button ID copy karo (`pl_XXXXXXXXXX`)
3. `PRICING` object mein us plan ki `b: ''` ki jagah paste kar do

Combo pack ke kabhi button IDs the hi nahi — wo pehle se UPI/Universal par hai.

---

## 🚀 Deploy

```bash
# 1. files repo mein copy karo
cp index.html vercel.json README.md /path/to/Verceel-timepass-/
cp -r api /path/to/Verceel-timepass-/

# 2. push
git add -A
git commit -m "6 themes, new Adult/Combo pricing, Harsh Dev drawer redesign, full responsive"
git push origin main
```

Vercel GitHub se connected hai, to push karte hi auto-deploy ho jayega →
[verceel-timepass.vercel.app](https://verceel-timepass.vercel.app/)

Ya GitHub web UI se: repo kholo → `index.html` → ✏️ edit → poora content replace → Commit.

### Environment variables (Vercel → Settings → Environment Variables)

| Variable | Kiske liye |
|---|---|
| `ADMIN_PASSWORD` | `api/admin-auth.js` — admin panel ka password |
| `TELEGRAM_BOT_TOKEN` | `api/telegram-notify.js` — visitor/purchase notifications |
| `TELEGRAM_CHAT_ID` | `api/telegram-notify.js` — notifications kahan jayein |

Ye tumhare apne secrets hain — inhe kabhi code mein commit mat karna.

---

© 2026 TIMEPASS PREMIUM · Crafted by Harsh Dev
