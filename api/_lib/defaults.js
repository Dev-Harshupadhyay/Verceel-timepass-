/**
 * api/_lib/defaults.js
 *
 * SINGLE SOURCE OF TRUTH for the code-level default content of the website.
 *
 * Every value here is the *current live content* of index.html (prices,
 * Razorpay button ids, links, hero text, footer, drawer, FAQ/Info text).
 *
 * The React app imports this exact module through the "@shared" alias, so the
 * website keeps working from code defaults whenever KV is unreachable —
 * there is no second copy to drift out of sync.
 */

export const DEFAULT_CONFIG = {
  v: 2,
  revision: 0,
  updatedAt: null,

  brand: {
    name: "Timepass Premium",
    shortName: "TIMEPASS PREMIUM",
    logoUrl: "",
    devName: "Harsh Dev",
    devCrown: "👑 FOUNDER · CREATOR",
    devHandle: "pmharsh",
    devUrl: "https://new-profotilo-flame.vercel.app/",
    devRole: "WEB DEVELOPER · UI DESIGNER",
    devBio:
      "Main Harsh — web developer aur UI designer. Is website ka design, code, payment flow aur Telegram automation, sab mera hi kaam hai. 30+ projects ship kiye hain — landing pages, dashboards, Python scripts aur bots. Kaam pasand aaye to seedha message karo.",
    devQuote: "Design + Code + Automation — sab ek hi banda.",
    devPortfolioLabel: "PORTFOLIO DEKHO",
    devTags: ["HTML / CSS", "JavaScript", "React", "Python", "Telegram Bots", "UI / UX"],
    devStats: [
      { value: "30+", label: "PROJECTS" },
      { value: "24×7", label: "SUPPORT" },
      { value: "100%", label: "CUSTOM" }
    ]
  },

  hero: {
    title: "Timepass Premium",
    tagline: "Market Se Sasta OTT 🔥",
    badge: "LIVE · INSTANT VERIFICATION",
    ctaLabel: "WELCOME HARSH 🚩",
    image: "https://i.ibb.co/7xC7jC8y/your-image.jpg",
    sectionLabel: "Plans & Pricing",
    sectionSub: "PREMIUM RATES",
    faqLabel: "FAQ",
    faqSub: "QUESTIONS & ANSWERS",
    trust: [
      { icon: "bolt", title: "Instant", sub: "FAST ACCESS" },
      { icon: "lock", title: "Secure", sub: "UPI & RAZORPAY" },
      { icon: "headset", title: "24×7", sub: "TELEGRAM SUPPORT" }
    ]
  },

  announcement: {
    enabled: false,
    text: "",
    badge: "",
    ctaLabel: "",
    ctaUrl: "",
    tone: "gold",
    animation: "shimmer",
    dismissible: true,
    expiresAt: null,
    showOnBuyPage: true
  },

  packs: {
    movies: {
      title: "Movies & Series",
      sub: "ALL OTT CONTENT",
      emoji: "🎬",
      cta: "BUY MOVIE PACK",
      suffix: "Plan",
      crown: false,
      active: true,
      plans: [
        { id: "movies-1m", sticker: "🌙", name: "1 Month", price: 50, razorpayButtonId: "pl_TcjHF0nZXCtlQO", razorpayAmount: 50, payMode: "universal", active: true, soldOut: false, featured: false },
        { id: "movies-3m", sticker: "⭐", name: "3 Months", price: 250, razorpayButtonId: "pl_TcjLIqo5ZVvgaY", razorpayAmount: 250, payMode: "universal", active: true, soldOut: false, featured: false },
        { id: "movies-6m", sticker: "🔥", name: "6 Months", price: 420, razorpayButtonId: "pl_TcjMhB31QXHseK", razorpayAmount: 420, payMode: "universal", active: true, soldOut: false, featured: false },
        { id: "movies-12m", sticker: "👑", name: "1 Year", price: 465, razorpayButtonId: "pl_TcjSAK86Q3OvuC", razorpayAmount: 465, payMode: "universal", active: true, soldOut: false, featured: true }
      ]
    },
    adult: {
      title: "Adult Pack",
      sub: "SINGLE CHANNEL",
      emoji: "🔞",
      cta: "BUY ADULT PACK",
      suffix: "Access",
      crown: false,
      active: true,
      plans: [
        { id: "adult-1m", sticker: "🔓", name: "1 Month", price: 100, razorpayButtonId: "", razorpayAmount: null, payMode: "universal", active: true, soldOut: false, featured: false },
        { id: "adult-3m", sticker: "🌶️", name: "3 Months", price: 400, razorpayButtonId: "", razorpayAmount: null, payMode: "universal", active: true, soldOut: false, featured: false },
        { id: "adult-6m", sticker: "🚀", name: "6 Months", price: 580, razorpayButtonId: "", razorpayAmount: null, payMode: "universal", active: true, soldOut: false, featured: false },
        { id: "adult-12m", sticker: "💎", name: "1 Year", price: 835, razorpayButtonId: "pl_TcjW9QKyHKuxPG", razorpayAmount: 835, payMode: "universal", active: true, soldOut: false, featured: true }
      ]
    },
    combo: {
      title: "Combo Pack",
      sub: "MOVIES + ADULT",
      emoji: "🌟",
      cta: "BUY COMBO PACK",
      suffix: "Combo",
      crown: true,
      active: true,
      plans: [
        { id: "combo-1m", sticker: "🎟️", name: "1 Month", price: 250, razorpayButtonId: "", razorpayAmount: null, payMode: "universal", active: true, soldOut: false, featured: false },
        { id: "combo-3m", sticker: "🍿", name: "3 Months", price: 520, razorpayButtonId: "", razorpayAmount: null, payMode: "universal", active: true, soldOut: false, featured: false },
        { id: "combo-6m", sticker: "💎", name: "6 Months", price: 780, razorpayButtonId: "", razorpayAmount: null, payMode: "universal", active: true, soldOut: false, featured: false },
        { id: "combo-12m", sticker: "🏆", name: "1 Year", price: 1500, razorpayButtonId: "", razorpayAmount: null, payMode: "universal", active: true, soldOut: false, featured: true }
      ]
    }
  },

  links: {
    upi: "pmharsh@fam",
    razorpay: "https://razorpay.me/@pmharsh",
    telegram: "pmharsh",
    channel: "TIMEPASS_BACKUP_1",
    bot: "Trackerhhbot",
    email: "pmharshu2035@gmail.com",
    portfolio: "https://new-profotilo-flame.vercel.app/"
  },

  content: {
    payLabel: "PAYMENT AMOUNT",
    paymentHeading: "⚡ SECURE UPI PAYMENT",
    upiCaption: "FAMPAY / UPI ID",
    upiHint:
      "Button dabate hi selected amount ke saath UPI payment request open hogi. Agar app chooser na aaye, QR scan ya UPI ID se payment kar sakte ho.",
    upiNoteTemplate: "Premium {plan} @{bot}",
    paymentNoteTitle: "PAYMENT KE BAAD:",
    paymentNote:
      "Payment complete karne ke baad neeche SEND SCREENSHOT button dabao aur payment ka screenshot bhej do. Verification ke baad channel/access details support se mil jayengi.",
    screenshotTitle: "PAYMENT DONE? SEND PROOF",
    screenshotDesc:
      "Payment ka screenshot bhejo — verify karke turant access details de di jayengi.",
    screenshotCta: "SEND SCREENSHOT ON TELEGRAM",
    universalLabel: "PAY UNIVERSAL · RAZORPAY.ME/@{telegramUpper}",
    universalCta: "MORE PAYMENT OPTIONS",
    buyTitle: "CHOOSE YOUR PLAN",
    buySub: "SELECT DURATION · PROCEED TO PAYMENT",
    proceedLabel: "PROCEED TO PAY →",
    supportPrefix: "Issue aaye toh",
    supportSuffix: "karo.",
    footerLine: "© 2026 TIMEPASS PREMIUM",
    footerBy: "MADE BY",
    footerCredit: "SECURE PAYMENTS · UPI & RAZORPAY · CC 2026",
    telegramEyebrow: "● TIMEPASS PREMIUM NOTICE",
    telegramTitle: "Join Our Official Telegram Channel",
    telegramDesc: "Scan ya save karke seedha official channel join karo.",
    devDrawerTitle: "MADE BY {devUpper}",
    devGuideTitle: "PURCHASE GUIDE",
    infoButton: "INFO",
    infoBack: "← BACK",
    faqViewAll: "VIEW ALL FAQ",
    faqTeaserTitle: "Frequently Asked Questions"
  },

  info: {
    title: {
      en: "Everything you get — for less than one OTT subscription",
      hinglish: "Ek OTT subscription se kam price mein — poora entertainment",
      hi: "एक OTT सब्सक्रिप्शन से कम कीमत में — पूरा एंटरटेनमेंट"
    },
    intro: {
      en: "Timepass Premium bundles OTT movies, web series and private channel access into one small one-time payment. No monthly auto-debit, no multiple subscriptions, no hidden charges. Pick a pack, pay by UPI or Razorpay, send the screenshot and get verified access.",
      hinglish:
        "Timepass Premium mein OTT movies, web series aur private channel access ek chhoti si one-time payment mein milta hai. Na monthly auto-debit, na ek se zyada subscription, na hidden charges. Pack choose karo, UPI ya Razorpay se pay karo, screenshot bhejo aur verified access le lo.",
      hi:
        "Timepass Premium में OTT फ़िल्में, वेब सीरीज़ और प्राइवेट चैनल एक्सेस एक छोटी वन-टाइम पेमेंट में मिलते हैं। न मासिक ऑटो-डेबिट, न कई सब्सक्रिप्शन, न छिपे हुए चार्जेज़। पैक चुनें, UPI या Razorpay से भुगतान करें, स्क्रीनशॉट भेजें और वेरिफाइड एक्सेस पाएं।"
    },
    valueTitle: {
      en: "Why it is affordable",
      hinglish: "Ye affordable kaise hai",
      hi: "यह किफ़ायती क्यों है"
    },
    whatYouGet: {
      en: "What you get in every pack",
      hinglish: "Har pack mein kya milta hai",
      hi: "हर पैक में क्या मिलता है"
    },
    points: [
      {
        icon: "tag",
        title: {
          en: "Cheaper than one OTT month",
          hinglish: "Ek OTT month se bhi sasta",
          hi: "एक OTT महीने से भी सस्ता"
        },
        desc: {
          en: "Most OTT apps charge ₹149–₹649 every month. Here a full 1-month Movies pack starts at ₹50, and the 1-year pack costs less than two months of a premium OTT plan.",
          hinglish:
            "Zyadatar OTT apps har mahine ₹149–₹649 lete hain. Yahan 1-month Movies pack sirf ₹50 se shuru hota hai, aur 1-year pack kisi premium OTT ke 2 mahine se bhi kam ka hai.",
          hi:
            "ज़्यादातर OTT ऐप्स हर महीने ₹149–₹649 लेते हैं। यहाँ 1-महीने का Movies पैक सिर्फ़ ₹50 से शुरू होता है, और 1-साल का पैक किसी प्रीमियम OTT के 2 महीने से भी कम का है।"
        }
      },
      {
        icon: "layer-group",
        title: {
          en: "Every OTT in one place",
          hinglish: "Saare OTT ek jagah",
          hi: "सारे OTT एक जगह"
        },
        desc: {
          en: "Movies, web series, premium channels aur exclusive content — ek hi pack mein. Alag-alag app ke subscriptions lene ki zaroorat nahi.",
          hinglish:
            "Movies, web series, premium channels aur exclusive content — sab ek hi pack mein. Alag-alag app ke subscriptions lene ki zaroorat nahi.",
          hi:
            "फ़िल्में, वेब सीरीज़, प्रीमियम चैनल और एक्सक्लूसिव कंटेंट — सब एक ही पैक में। अलग-अलग ऐप के सब्सक्रिप्शन लेने की ज़रूरत नहीं।"
        }
      },
      {
        icon: "clapperboard",
        title: {
          en: "4K / high-bitrate quality",
          hinglish: "4K / high-bitrate quality",
          hi: "4K / हाई-बिटरेट क्वालिटी"
        },
        desc: {
          en: "Clean high-bitrate encodes that look sharp on a phone and on a TV. No buffering drama during the good part.",
          hinglish:
            "Clean high-bitrate encodes jo phone aur TV dono par sharp dikhte hain. Story ke best part mein buffering ka drama nahi.",
          hi:
            "साफ़ हाई-बिटरेट एनकोड जो फ़ोन और TV दोनों पर शार्प दिखते हैं। अच्छे सीन के बीच बफ़रिंग का ड्रामा नहीं।"
        }
      },
      {
        icon: "bolt",
        title: {
          en: "Instant delivery",
          hinglish: "Turant delivery",
          hi: "तुरंत डिलीवरी"
        },
        desc: {
          en: "Pay → send screenshot → verified → access details. Usually within minutes, because support runs 24×7.",
          hinglish:
            "Pay → screenshot bhejo → verify → access details. Usually kuch minutes mein, kyunki support 24×7 chalta hai.",
          hi:
            "भुगतान → स्क्रीनशॉट भेजें → वेरिफ़िकेशन → एक्सेस डिटेल्स। आमतौर पर कुछ मिनटों में, क्योंकि सपोर्ट 24×7 चलता है।"
        }
      },
      {
        icon: "shield-halved",
        title: {
          en: "No hidden charges",
          hinglish: "Koi hidden charge nahi",
          hi: "कोई छिपा चार्ज नहीं"
        },
        desc: {
          en: "One-time payment, koi auto-renew nahi, card save nahi hota. Jo price dikh raha hai wahi pay karna hai.",
          hinglish:
            "One-time payment, koi auto-renew nahi, card save nahi hota. Jo price site par dikh raha hai, bas wahi pay karna hai.",
          hi:
            "वन-टाइम पेमेंट, कोई ऑटो-रिन्यू नहीं, कार्ड सेव नहीं होता। साइट पर जो कीमत दिख रही है, बस वही भुगतान करना है।"
        }
      },
      {
        icon: "headset",
        title: {
          en: "24×7 Telegram support",
          hinglish: "24×7 Telegram support",
          hi: "24×7 Telegram सपोर्ट"
        },
        desc: {
          en: "Link down, quality issue ya access problem — message support and a working link is restored or replaced fast.",
          hinglish:
            "Link down, quality issue ya access problem — support ko message karo, working link jaldi restore ya replace ho jata hai.",
          hi:
            "लिंक डाउन, क्वालिटी इश्यू या एक्सेस प्रॉब्लम — सपोर्ट को मैसेज करें, वर्किंग लिंक जल्दी रिस्टोर या रिप्लेस हो जाता है।"
        }
      }
    ],
    howTitle: {
      en: "How it works",
      hinglish: "Kaise kaam karta hai",
      hi: "यह कैसे काम करता है"
    },
    howItWorks: [
      {
        title: { en: "Choose a plan", hinglish: "Plan select karo", hi: "प्लान चुनें" },
        desc: {
          en: "Movies, Adult or Combo — pick the pack and duration that fits you.",
          hinglish: "Movies, Adult ya Combo — apna pack aur duration choose karo.",
          hi: "Movies, Adult या Combo — अपना पैक और अवधि चुनें।"
        }
      },
      {
        title: { en: "Pay the exact amount", hinglish: "Payment karo", hi: "भुगतान करें" },
        desc: {
          en: "UPI button, QR scan, Razorpay button or the universal Razorpay link — amount auto-fills.",
          hinglish: "UPI button, QR scan, Razorpay button ya universal Razorpay link — amount khud bharta hai.",
          hi: "UPI बटन, QR स्कैन, Razorpay बटन या यूनिवर्सल Razorpay लिंक — अमाउंट अपने आप भरता है।"
        }
      },
      {
        title: { en: "Send the screenshot", hinglish: "Screenshot bhejo", hi: "स्क्रीनशॉट भेजें" },
        desc: {
          en: "After a successful payment, send the transaction screenshot on Telegram.",
          hinglish: "Payment successful hone ke baad transaction ka screenshot Telegram par bhejo.",
          hi: "भुगतान सफल होने के बाद ट्रांज़ैक्शन का स्क्रीनशॉट Telegram पर भेजें।"
        }
      },
      {
        title: { en: "Get verified access", hinglish: "Access lo", hi: "एक्सेस पाएं" },
        desc: {
          en: "Support verifies it and sends your channel/access details plus the tracker bot link.",
          hinglish: "Support verify karke channel/access details aur tracker bot link bhej deta hai.",
          hi: "सपोर्ट वेरिफ़ाई करके चैनल/एक्सेस डिटेल्स और ट्रैकर बॉट लिंक भेज देता है।"
        }
      }
    ],
    policyTitle: {
      en: "Policies",
      hinglish: "Policies",
      hi: "नीतियाँ"
    },
    policies: [
      {
        title: { en: "Delivery & access", hinglish: "Delivery & access", hi: "डिलीवरी और एक्सेस" },
        desc: {
          en: "Digital access is delivered on Telegram after verification. Keep your screenshot safe until access is confirmed.",
          hinglish:
            "Verification ke baad digital access Telegram par milta hai. Access confirm hone tak apna screenshot sambhal ke rakho.",
          hi:
            "वेरिफ़िकेशन के बाद डिजिटल एक्सेस Telegram पर मिलता है। एक्सेस कन्फ़र्म होने तक अपना स्क्रीनशॉट सँभाल कर रखें।"
        }
      },
      {
        title: { en: "Refund policy", hinglish: "Refund policy", hi: "रिफ़ंड नीति" },
        desc: {
          en: "Access is delivered instantly, so payments are non-refundable once access is shared. If access stops working, support replaces it free of cost.",
          hinglish:
            "Access turant deliver hota hai, isliye access share hone ke baad payment refundable nahi hai. Access kaam na kare to support free replacement deta hai.",
          hi:
            "एक्सेस तुरंत मिलता है, इसलिए एक्सेस शेयर होने के बाद भुगतान रिफ़ंडेबल नहीं है। एक्सेस काम न करे तो सपोर्ट मुफ़्त रिप्लेसमेंट देता है।"
        }
      },
      {
        title: { en: "Personal use only", hinglish: "Sirf personal use", hi: "सिर्फ़ व्यक्तिगत उपयोग" },
        desc: {
          en: "Access is for personal viewing. Sharing, reselling or public streaming is not allowed and may end the access.",
          hinglish:
            "Access personal viewing ke liye hai. Sharing, reselling ya public streaming allowed nahi hai — aisa karne par access band ho sakta hai.",
          hi:
            "एक्सेस व्यक्तिगत देखने के लिए है। शेयर करना, रीसेल करना या सार्वजनिक स्ट्रीमिंग मना है — ऐसा करने पर एक्सेस बंद हो सकता है।"
        }
      }
    ],
    supportNote: {
      en: "Payment ya access mein dikkat? Telegram support 24×7 available hai — screenshot ke saath message karo.",
      hinglish: "Payment ya access mein dikkat? Telegram support 24×7 available hai — screenshot ke saath message karo.",
      hi: "भुगतान या एक्सेस में दिक्कत? Telegram सपोर्ट 24×7 उपलब्ध है — स्क्रीनशॉट के साथ मैसेज करें।"
    }
  },

  faq: [
    {
      id: "faq-price",
      cat: "pricing",
      active: true,
      q: {
        en: "How is this cheaper than OTT subscriptions?",
        hinglish: "OTT subscriptions se sasta kaise?",
        hi: "OTT सब्सक्रिप्शन से सस्ता कैसे?"
      },
      a: {
        en: "You pay once for one pack instead of a monthly subscription. A single month of most OTT apps costs more than our 1-month pack, and our 1-year pack is cheaper than two months of a premium OTT plan.",
        hinglish: "Ek baar payment, poora pack — monthly subscription ka jhanjhat nahi. Zyadatar OTT ka 1 month hi hamare 1-month pack se mehnga hai, aur hamara 1-year pack kisi premium OTT ke 2 mahine se bhi sasta hai.",
        hi: "एक बार भुगतान, पूरा पैक — हर महीने सब्सक्रिप्शन की ज़रूरत नहीं। ज़्यादातर OTT का एक महीना हमारे 1-महीने पैक से महंगा है, और हमारा 1-साल पैक किसी प्रीमियम OTT के 2 महीने से भी सस्ता है।"
      }
    },
    {
      id: "faq-what-included",
      cat: "pricing",
      active: true,
      q: {
        en: "What do I get in the affordable packs?",
        hinglish: "Affordable pack mein kya milta hai?",
        hi: "किफ़ायती पैक में क्या मिलता है?"
      },
      a: {
        en: "Movies & Series pack: OTT movies, web series and premium content. Adult pack: single private channel access. Combo: both together — best value for regular viewers. Every plan shows the exact price before you pay.",
        hinglish: "Movies & Series pack mein OTT movies, web series aur premium content milta hai. Adult pack mein single private channel ka access. Combo mein dono — regular viewers ke liye sabse best value. Har plan ka exact price pay karne se pehle dikhta hai.",
        hi: "Movies & Series पैक में OTT फ़िल्में, वेब सीरीज़ और प्रीमियम कंटेंट मिलता है। Adult पैक में एक प्राइवेट चैनल का एक्सेस। Combo में दोनों — नियमित दर्शकों के लिए सबसे बेहतर वैल्यू। हर प्लान की सही कीमत भुगतान से पहले दिखती है।"
      }
    },
    {
      id: "faq-how-pay",
      cat: "payment",
      active: true,
      q: {
        en: "How do I pay?",
        hinglish: "Payment kaise karun?",
        hi: "भुगतान कैसे करूँ?"
      },
      a: {
        en: "Choose a plan, then pay with the UPI button (GPay / PhonePe / Paytm), scan the QR, or use the Razorpay button / universal Razorpay link shown on the payment page.",
        hinglish: "Plan choose karo, phir UPI button (GPay / PhonePe / Paytm) se pay karo, QR scan karo, ya payment page par dikhne wala Razorpay button / universal Razorpay link use karo.",
        hi: "प्लान चुनें, फिर UPI बटन (GPay / PhonePe / Paytm) से भुगतान करें, QR स्कैन करें, या पेमेंट पेज पर दिखने वाला Razorpay बटन / यूनिवर्सल Razorpay लिंक इस्तेमाल करें।"
      }
    },
    {
      id: "faq-upi-safe",
      cat: "payment",
      active: true,
      q: {
        en: "Is UPI payment safe here?",
        hinglish: "UPI se payment safe hai?",
        hi: "यहाँ UPI भुगतान सुरक्षित है?"
      },
      a: {
        en: "Yes. Payment goes directly to our verified UPI ID — no card details are asked and no auto-debit is set up. Always match the UPI ID shown on this site before paying.",
        hinglish: "Haan. Payment seedha hamare verified UPI ID par jaata hai — card details nahi maangi jaati aur koi auto-debit nahi hota. Pay karne se pehle is site par dikh rahi UPI ID zaroor match karo.",
        hi: "हाँ। भुगतान सीधे हमारी सत्यापित UPI ID पर जाता है — कार्ड डिटेल्स नहीं मांगी जाती और कोई ऑटो-डेबिट नहीं होता। भुगतान से पहले इस साइट पर दिख रही UPI ID ज़रूर मिलाएँ।"
      }
    },
    {
      id: "faq-rzp-amount",
      cat: "payment",
      active: true,
      q: {
        en: "The Razorpay button shows a different amount — why?",
        hinglish: "Razorpay button ka amount alag dikh raha hai?",
        hi: "Razorpay बटन का अमाउंट अलग दिख रहा है?"
      },
      a: {
        en: "Razorpay buttons have a fixed amount. If the button amount does not match your selected plan, use the UPI button or the universal Razorpay link — the amount is always correct there.",
        hinglish: "Razorpay button ka amount fixed hota hai. Agar button ka amount selected plan se match na kare to UPI button ya universal Razorpay link use karo — wahan amount hamesha sahi hota hai.",
        hi: "Razorpay बटन का अमाउंट फिक्स होता है। अगर बटन का अमाउंट चुने गए प्लान से मेल न खाए तो UPI बटन या यूनिवर्सल Razorpay लिंक इस्तेमाल करें — वहाँ अमाउंट हमेशा सही होता है।"
      }
    },
    {
      id: "faq-delivery-time",
      cat: "access",
      active: true,
      q: {
        en: "How fast do I get access after payment?",
        hinglish: "Payment ke baad access kab milega?",
        hi: "भुगतान के बाद एक्सेस कब मिलेगा?"
      },
      a: {
        en: "Send the payment screenshot on Telegram. After a quick verification (usually within minutes, support runs 24×7) you get your channel/access details.",
        hinglish: "Payment ka screenshot Telegram par bhejo. Quick verification ke baad (usually kuch minutes, support 24×7) channel/access details mil jaati hain.",
        hi: "भुगतान का स्क्रीनशॉट Telegram पर भेजें। तुरंत सत्यापन के बाद (आमतौर पर कुछ मिनट, सपोर्ट 24×7) चैनल/एक्सेस डिटेल्स मिल जाती हैं।"
      }
    },
    {
      id: "faq-where-screenshot",
      cat: "access",
      active: true,
      q: {
        en: "Where do I send the screenshot?",
        hinglish: "Screenshot kahan bhejun?",
        hi: "स्क्रीनशॉट कहाँ भेजूँ?"
      },
      a: {
        en: "Tap “SEND SCREENSHOT ON TELEGRAM” on the payment page — it opens the support chat with your plan and amount already written. You can also message the tracker bot.",
        hinglish: "Payment page par “SEND SCREENSHOT ON TELEGRAM” dabao — support chat khul jayegi jisme plan aur amount pehle se likha hota hai. Tracker bot par bhi message kar sakte ho.",
        hi: "पेमेंट पेज पर “SEND SCREENSHOT ON TELEGRAM” दबाएँ — सपोर्ट चैट खुल जाएगी जिसमें प्लान और अमाउंट पहले से लिखा होता है। ट्रैकर बॉट पर भी मैसेज कर सकते हैं।"
      }
    },
    {
      id: "faq-devices",
      cat: "access",
      active: true,
      q: {
        en: "Which devices does it work on?",
        hinglish: "Kaun se devices par chalega?",
        hi: "किन डिवाइस पर चलेगा?"
      },
      a: {
        en: "Mobile, tablet, laptop and smart TV — wherever the app or website supports playback. Access is for personal use; sharing or reselling is not allowed.",
        hinglish: "Mobile, tablet, laptop aur smart TV — jahan app ya website playback support karti hai. Access personal use ke liye hai; sharing ya reselling allowed nahi hai.",
        hi: "मोबाइल, टैबलेट, लैपटॉप और स्मार्ट TV — जहाँ ऐप या वेबसाइट प्लेबैक सपोर्ट करती है। एक्सेस व्यक्तिगत उपयोग के लिए है; शेयर या रीसेल करना मना है।"
      }
    },
    {
      id: "faq-not-working",
      cat: "support",
      active: true,
      q: {
        en: "Access stopped working — what now?",
        hinglish: "Access kaam nahi kar raha to?",
        hi: "एक्सेस काम नहीं कर रहा तो?"
      },
      a: {
        en: "Message support on Telegram with your screenshot and the issue. Working links are restored or replaced quickly — that is why 24×7 support is included.",
        hinglish: "Telegram par support ko screenshot aur problem bhejo. Working links turant restore ya replace kar diye jaate hain — isliye 24×7 support milta hai.",
        hi: "Telegram पर सपोर्ट को स्क्रीनशॉट और समस्या भेजें। वर्किंग लिंक जल्दी रिस्टोर या रिप्लेस कर दिए जाते हैं — इसीलिए 24×7 सपोर्ट मिलता है।"
      }
    },
    {
      id: "faq-contact",
      cat: "support",
      active: true,
      q: {
        en: "How do I contact support?",
        hinglish: "Support se kaise baat karun?",
        hi: "सपोर्ट से कैसे संपर्क करूँ?"
      },
      a: {
        en: "Telegram is the fastest way. Email works too. Both links are in the menu (☰) and on this Info page.",
        hinglish: "Telegram sabse fast hai. Email bhi kar sakte ho. Dono links menu (☰) aur is Info page par hain.",
        hi: "Telegram सबसे तेज़ है। ईमेल भी कर सकते हैं। दोनों लिंक मेनू (☰) और इस Info पेज पर हैं।"
      }
    },
    {
      id: "faq-refund",
      cat: "policy",
      active: true,
      q: {
        en: "What is the refund policy?",
        hinglish: "Refund policy kya hai?",
        hi: "रिफ़ंड नीति क्या है?"
      },
      a: {
        en: "Digital access is delivered instantly, so payments are non-refundable once access is shared. If the access does not work, support replaces it free of cost.",
        hinglish: "Digital access turant milta hai, isliye access share hone ke baad payment refundable nahi hai. Agar access kaam na kare to support free replacement deta hai.",
        hi: "डिजिटल एक्सेस तुरंत मिलता है, इसलिए एक्सेस शेयर होने के बाद भुगतान रिफ़ंडेबल नहीं है। अगर एक्सेस काम न करे तो सपोर्ट मुफ़्त रिप्लेसमेंट देता है।"
      }
    },
    {
      id: "faq-data",
      cat: "policy",
      active: true,
      q: {
        en: "Is my data safe?",
        hinglish: "Mera data safe hai?",
        hi: "मेरा डेटा सुरक्षित है?"
      },
      a: {
        en: "We do not store card details or passwords. Only the UPI reference number / screenshot you send for verification is used, and it stays with support.",
        hinglish: "Hum card details ya passwords store nahi karte. Sirf verification ke liye bheja gaya UPI reference number / screenshot use hota hai, wo bhi support ke paas hi rehta hai.",
        hi: "हम कार्ड डिटेल्स या पासवर्ड स्टोर नहीं करते। सिर्फ़ सत्यापन के लिए भेजा गया UPI रेफ़रेंस नंबर / स्क्रीनशॉट उपयोग होता है, वह भी सपोर्ट के पास ही रहता है।"
      }
    },
    {
      id: "faq-vs-ott",
      cat: "pricing",
      active: true,
      q: {
        en: "Netflix or Prime vs Timepass Premium — how much cheaper exactly?",
        hinglish: "Netflix ya Prime se compare karo to kitna sasta?",
        hi: "Netflix या Prime से तुलना करें तो कितना सस्ता?"
      },
      a: {
        en: "Timepass Premium starts at ₹50 for a full month, and the 1-year pack is ₹465 — roughly ₹39 per month. For reference, popular OTT list prices in India are around ₹99–₹499 per month (Netflix Standard ~₹499, JioHotstar Premium ~₹499, Amazon Prime ~₹299, Zee5 / SonyLIV ~₹299). So a whole year here often costs less than one month of a big OTT plan. OTT prices change with their own plans and offers.",
        hinglish: "Timepass Premium poore mahine ka ₹50 se shuru hota hai, aur 1-year pack ₹465 — matlab approx ₹39/month. Reference ke liye, India mein popular OTT ka list price ₹99–₹499/month ke beech hota hai (Netflix Standard ~₹499, JioHotstar Premium ~₹499, Amazon Prime ~₹299, Zee5 / SonyLIV ~₹299). Yani yahan ka poora saal aksar ek bade OTT ke ek mahine se bhi sasta padta hai. OTT prices unke apne plans/offers ke hisaab se badalte rehte hain.",
        hi: "Timepass Premium पूरे महीने का ₹50 से शुरू होता है, और 1-साल का पैक ₹465 — यानी लगभग ₹39/महीना। तुलना के लिए, भारत में लोकप्रिय OTT का लिस्ट प्राइस ₹99–₹499/महीना होता है (Netflix Standard ~₹499, JioHotstar Premium ~₹499, Amazon Prime ~₹299, Zee5 / SonyLIV ~₹299)। यानी यहाँ का पूरा साल अक्सर एक बड़े OTT के एक महीने से भी सस्ता पड़ता है। OTT कीमतें उनके अपने प्लान/ऑफ़र के हिसाब से बदलती रहती हैं।"
      }
    },
    {
      id: "faq-hidden-charge",
      cat: "payment",
      active: true,
      q: {
        en: "Any hidden charges or auto-renew?",
        hinglish: "Koi hidden charge ya auto-renew hai?",
        hi: "कोई छिपा चार्ज या ऑटो-रिन्यू है?"
      },
      a: {
        en: "No. The price you see is the price you pay — no renewal, no saved card, no surprise deduction. Every plan is a one-time payment for that duration. If you choose not to renew, nothing is charged automatically.",
        hinglish: "Nahi. Jo price dikhta hai wahi pay karte ho — koi renewal nahi, card save nahi, koi surprise deduction nahi. Har plan us duration ke liye one-time payment hai. Agar aap renew nahi karte to apne aap kuch charge nahi hota.",
        hi: "नहीं। जो कीमत दिखती है वही चुकाते हैं — कोई रिन्यूअल नहीं, कार्ड सेव नहीं, कोई अचानक कटौती नहीं। हर प्लान उस अवधि के लिए एक बार का भुगतान है। अगर आप रिन्यू नहीं करते तो अपने आप कुछ चार्ज नहीं होता।"
      }
    },
    {
      id: "faq-why-cheap",
      cat: "pricing",
      active: true,
      q: {
        en: "How can the price be this low?",
        hinglish: "Itna sasta kaise mil jata hai?",
        hi: "इतना सस्ता कैसे मिल जाता है?"
      },
      a: {
        en: "Because there is no middleman: no app-store commission, no ad budget, no big support team — just a direct Telegram setup run by Harsh Dev. You pay for the plan, send the screenshot, and get access. That is why a full year can cost less than one month elsewhere.",
        hinglish: "Kyunki beech mein koi middleman nahi — na app-store commission, na bada ad budget, na badi support team. Seedha Harsh Dev ka Telegram setup. Aap plan ka payment karte ho, screenshot bhejte ho, access mil jata hai. Isi wajah se poora saal kahin ke ek mahine se sasta pad jata hai.",
        hi: "क्योंकि बीच में कोई बिचौलिया नहीं — न ऐप-स्टोर कमीशन, न बड़ा विज्ञापन बजट, न बड़ी सपोर्ट टीम। सीधे Harsh Dev का Telegram सेटअप। आप प्लान का भुगतान करते हैं, स्क्रीनशॉट भेजते हैं, एक्सेस मिल जाता है। इसी वजह से पूरा साल कहीं के एक महीने से भी सस्ता पड़ जाता है।"
      }
    },
  ],

  appearance: {
    defaultTheme: "obsidian",
    darkTheme: "obsidian"
  }
};

export default DEFAULT_CONFIG;
