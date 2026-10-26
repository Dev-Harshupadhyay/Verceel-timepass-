import { useEffect, useMemo, useRef, useState } from "react";
import { useConfig } from "@/state/ConfigProvider";
import { useToast } from "@/state/ToastProvider";
import { useLang } from "@/state/LangProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { Announcement } from "@/components/Announcement";
import { navigate } from "@/lib/router";
import { useDevice } from "@/lib/device";
import {
  activePlans,
  buildUpiUri,
  isBestValue,
  qrSrc,
  resolvePayment,
  screenshotMessageUrl,
  telegramUrl
} from "@/lib/payments";
import { block, line, notify } from "@/lib/notify";
import type { Lang, PackKey, Plan } from "@/types";

const PACK_KEYS: PackKey[] = ["movies", "adult", "combo"];

/**
 * "UPI Risk Policy" notes.
 *
 * Paytm / GPay sometimes block or warn on a P2P collect request made through a
 * upi:// deep link (the alert says: "This payment may fail as per UPI Risk
 * Policy"). Nothing is broken and no money moves — the app just asks the payer
 * to confirm through a different route. These notes tell the buyer exactly
 * which route to use, in their own language.
 */
const PAY_NOTES: Record<
  Lang,
  { title: string; lead: string; items: { icon: string; title: string; body: string }[]; foot: string }
> = {
  hinglish: {
    title: "IMPORTANT NOTES · PAYMENT",
    lead: "Paytm / GPay kabhi “UPI Risk Policy” ka alert dikha sakta hai. Ghabrana nahi — aapka paisa safe hai, kuch kata nahi. Bas neeche diye tareeke se pay karo:",
    items: [
      {
        icon: "fa-shield-halved",
        title: "Sabse pehle: Razorpay Universal",
        body: "Card / UPI / Netbanking — ek hi link. Merchant gateway hai, isliye personal UPI ka risk alert wahan nahi aata. Yahi sabse safe rasta hai."
      },
      {
        icon: "fa-triangle-exclamation",
        title: "UPI ID se payment fail ho sakti hai",
        body: "Paytm / GPay personal UPI par “UPI Risk Policy” dikha ke transfer rok dete hain. Paisa nahi katta — bas dobara Razorpay se kar do."
      },
      {
        icon: "fa-mobile-screen",
        title: "Paytm alert aaya? “Pay via Mobile Number” chuno",
        body: "Number paste karo aur amount apne aap aa jayega. (Number upar “MOBILE NUMBER SE PAY” button se copy ho jata hai.)"
      },
      {
        icon: "fa-qrcode",
        title: "Ya “Pay via Scanning QR” chuno",
        body: "Is page ka QR scan karo — same UPI ID, same amount, aur ye route Paytm khud suggest karta hai."
      },
      {
        icon: "fa-indian-rupee-sign",
        title: "Amount bilkul same rakho",
        body: "Kam ya zyada bhejne par verification nahi ho payegi. Page par jo amount likha hai, wahi pay karo."
      },
      {
        icon: "fa-camera",
        title: "Pay hone ke baad screenshot bhejo",
        body: "Telegram par screenshot bhejte hi verify karke access de diya jayega — zyada wait nahi."
      }
    ],
    foot: "Paisa na kate to 2 minute ruk ke dobara try karo, ya doosra UPI app (PhonePe / GPay / Fam) use karo."
  },
  en: {
    title: "IMPORTANT NOTES · PAYMENT",
    lead: "Paytm / GPay may show a “UPI Risk Policy” alert. Nothing is broken and no money is deducted — the app just wants you to confirm another way. Use one of these routes:",
    items: [
      {
        icon: "fa-shield-halved",
        title: "Start with Razorpay Universal",
        body: "Card / UPI / netbanking in one link. It is a merchant gateway, so the personal-UPI risk alert never appears there — this is the safest route."
      },
      {
        icon: "fa-triangle-exclamation",
        title: "UPI ID payments can fail",
        body: "Paytm / GPay may block a personal-UPI transfer with a “UPI Risk Policy” alert. No money is deducted — just pay through Razorpay instead."
      },
      {
        icon: "fa-mobile-screen",
        title: "Seeing the Paytm alert? Choose “Pay via Mobile Number”",
        body: "Paste the number and the amount fills in automatically. (Copy it with the “MOBILE NUMBER SE PAY” button above.)"
      },
      {
        icon: "fa-qrcode",
        title: "Or choose “Pay via Scanning QR”",
        body: "Scan the QR on this page — same UPI ID, same amount. Paytm itself suggests this route."
      },
      {
        icon: "fa-indian-rupee-sign",
        title: "Pay the exact amount",
        body: "Paying less or more will delay verification. Use exactly the amount shown on this page."
      },
      {
        icon: "fa-camera",
        title: "Send the screenshot after paying",
        body: "Send it on Telegram — access is given right after verification."
      }
    ],
    foot: "If the money was not deducted, wait two minutes and retry, or use another UPI app (PhonePe / GPay / Fam)."
  },
  hi: {
    title: "ज़रूरी बातें · पेमेंट",
    lead: "Paytm / GPay कभी “UPI Risk Policy” का अलर्ट दिखा सकता है। घबराएँ नहीं — पैसा सुरक्षित है, कुछ कटा नहीं। बस इनमें से कोई एक तरीका चुनें:",
    items: [
      {
        icon: "fa-shield-halved",
        title: "सबसे पहले: Razorpay Universal",
        body: "कार्ड / UPI / नेटबैंकिंग — एक ही लिंक। यह मर्चेंट गेटवे है, इसलिए पर्सनल UPI का रिस्क अलर्ट वहाँ नहीं आता। सबसे सुरक्षित तरीका यही है।"
      },
      {
        icon: "fa-triangle-exclamation",
        title: "UPI ID से भुगतान फेल हो सकता है",
        body: "Paytm / GPay पर्सनल UPI पर “UPI Risk Policy” दिखाकर ट्रांसफ़र रोक देते हैं। पैसा नहीं कटता — बस Razorpay से भुगतान कर दें।"
      },
      {
        icon: "fa-mobile-screen",
        title: "Paytm अलर्ट आया? “Pay via Mobile Number” चुनें",
        body: "नंबर पेस्ट करें, रकम अपने आप भर जाएगी। (ऊपर “MOBILE NUMBER SE PAY” बटन से नंबर कॉपी हो जाता है।)"
      },
      {
        icon: "fa-qrcode",
        title: "या “Pay via Scanning QR” चुनें",
        body: "इस पेज का QR स्कैन करें — वही UPI ID, वही रकम। यह तरीका Paytm खुद सुझाता है।"
      },
      {
        icon: "fa-indian-rupee-sign",
        title: "रकम बिल्कुल वही रखें",
        body: "कम या ज़्यादा भेजने पर वेरिफ़िकेशन नहीं हो पाएगा। पेज पर जो रकम लिखी है वही भेजें।"
      },
      {
        icon: "fa-camera",
        title: "भुगतान के बाद स्क्रीनशॉट भेजें",
        body: "Telegram पर स्क्रीनशॉट भेजते ही वेरिफ़ाई करके एक्सेस दे दिया जाएगा।"
      }
    ],
    foot: "पैसा न कटा हो तो 2 मिनट रुककर दोबारा कोशिश करें, या दूसरा UPI ऐप (PhonePe / GPay / Fam) इस्तेमाल करें।"
  }
};

function PaymentNotes({ lang }: { lang: Lang }) {
  const n = PAY_NOTES[lang] || PAY_NOTES.hinglish;
  return (
    <section className="pay-notes" aria-labelledby="pay-notes-title">
      <div className="pn-head">
        <span className="pn-ico" aria-hidden="true">
          <i className="fa-solid fa-triangle-exclamation" />
        </span>
        <div>
          <b id="pay-notes-title">{n.title}</b>
          <p>{n.lead}</p>
        </div>
      </div>
      <ol className="pn-list">
        {n.items.map((item) => (
          <li key={item.title}>
            <span className="pn-i" aria-hidden="true">
              <i className={`fa-solid ${item.icon}`} />
            </span>
            <div>
              <b>{item.title}</b>
              <p>{item.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="pn-foot">
        <i className="fa-solid fa-circle-info" aria-hidden="true" /> {n.foot}
      </p>
    </section>
  );
}

function monthsOf(name: string): number {
  const n = parseInt(name, 10) || 1;
  if (/year/i.test(name)) return n * 12;
  if (/month/i.test(name)) return n;
  return n;
}

export function BuyPage({ packKey }: { packKey: string }) {
  const { config } = useConfig();
  const { toast } = useToast();
  const { lang } = useLang();
  const device = useDevice();

  const key: PackKey = (PACK_KEYS.includes(packKey as PackKey) ? packKey : "movies") as PackKey;
  const pack = config.packs[key];
  const plans = useMemo(() => (pack ? activePlans(pack) : []), [pack]);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  const payTimer = useRef<number | null>(null);

  const plan: Plan | null = useMemo(() => plans.find((p) => p.id === selectedId) || null, [plans, selectedId]);
  const decision = useMemo(() => (plan ? resolvePayment(plan) : null), [plan]);
  const rzpRef = useRef<HTMLDivElement | null>(null);

  const invalid = !pack || !pack.active;

  useEffect(() => {
    if (invalid) navigate("/", { replace: true });
  }, [invalid]);

  useEffect(() => {
    if (invalid) return;
    void notify(
      block("CATALOGUE ACCESSED", [
        line("Selected", `${pack.emoji} ${pack.title}`),
        line("Session Time", `${Math.round((performance.now() / 1000) / 60)} mins`)
      ])
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /* Razorpay payment button mount (unchanged integration) */
  useEffect(() => {
    const mount = rzpRef.current;
    if (!mount) return;
    mount.innerHTML = "";
    const buttonId = decision && decision.mode === "razorpay" ? decision.razorpayButtonId : "";
    if (!buttonId) return;
    const form = document.createElement("form");
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/payment-button.js";
    script.setAttribute("data-payment-button-id", buttonId);
    script.async = true;
    form.appendChild(script);
    mount.appendChild(form);
    return () => {
      mount.innerHTML = "";
    };
  }, [decision]);

  useEffect(() => {
    const clear = () => {
      if (payTimer.current) {
        window.clearTimeout(payTimer.current);
        payTimer.current = null;
      }
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") clear();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      clear();
    };
  }, []);

  useEffect(() => {
    setQrFailed(false);
  }, [selectedId]);

  if (invalid) return null;

  const upiUri = plan ? buildUpiUri(config, plan.name, key, plan.price) : "";
  const upiQr = plan ? qrSrc(upiUri, 520) : "";
  const payeeMobile = (config.links.payeeMobile || "").trim();

  const proceed = () => {
    if (!plan) {
      toast("Pehle ek plan select karo! 👆", "warn");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
    void notify(
      block("CHECKOUT INITIALIZED", [
        line("Pack", pack.title),
        line("Duration", plan.name),
        line("Payable", `₹${plan.price}`)
      ])
    );
  };

  const payByUpi = () => {
    if (!plan) return;
    void notify(
      block("INTENT · PAY VIA UPI APP", [
        line("Pack", pack.title),
        line("Plan", plan.name),
        line("Amount", `₹${plan.price}`),
        line("UPI Target", config.links.upi)
      ])
    );
    /* If the UPI app does not take over the screen, the deep link was blocked
       (some apps refuse P2P intents). Tell the buyer what to do instead. */
    if (payTimer.current) window.clearTimeout(payTimer.current);
    payTimer.current = window.setTimeout(() => {
      toast("UPI app nahi khula? QR scan karo ya mobile number se pay karo 👇", "warn");
    }, 2800);
    window.location.href = upiUri;
  };

  const copyPayeeMobile = async () => {
    if (!payeeMobile) return;
    try {
      await navigator.clipboard.writeText(payeeMobile);
      toast(`✅ Number copied — ${payeeMobile}`, "success");
    } catch {
      toast(`Payee number: ${payeeMobile}`, "default");
    }
    void notify(block("CLIPBOARD · PAYEE MOBILE COPIED", [line("Number", payeeMobile)]));
  };

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(config.links.upi);
      toast("✅ UPI ID Copied!", "success");
    } catch {
      toast(`UPI ID: ${config.links.upi}`, "default");
    }
    void notify(block("CLIPBOARD · UPI COPIED", [line("ID", config.links.upi)]));
  };

  const sendProof = () => {
    if (!plan) return;
    void notify(
      block("🚨 PAYMENT CONFIRMATION INCOMING!", [
        line("Pack", pack.title),
        line("Plan", plan.name),
        line("Amount", `₹${plan.price}`)
      ])
    );
    window.open(screenshotMessageUrl(config, pack, plan, plan.price), "_blank", "noopener,noreferrer");
  };

  const universal = () => {
    void notify(
      block("UNIVERSAL LINK CLICKED", [
        line("Pack", pack.title),
        line("Plan", plan ? plan.name : "—"),
        line("Amount", `₹${plan ? plan.price : 0}`)
      ])
    );
  };

  return (
    <div id="buyPage" style={{ display: "block" }}>
      {config.announcement.enabled && config.announcement.showOnBuyPage ? <Announcement /> : null}

      <div className="buy-inner">
        <div className="buy-topbar">
          <button type="button" className="page-back" onClick={() => navigate("/")}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> HOME
          </button>
          <BrandLogo size={26} />
        </div>

        {step === 1 ? (
          <div id="buyStep1" style={{ textAlign: "center" }}>
            <div className="sec-title" style={{ color: "var(--gold-hi)" }}>
              {config.content.buyTitle}
            </div>
            <div className="sec-sub">
              {pack.emoji} {pack.title.toUpperCase()} · {config.content.buySub}
            </div>

            <div className="plans" id="planGrid">
              {plans.map((p) => {
                const best = isBestValue(p, plans);
                const selected = p.id === selectedId;
                return (
                  <div
                    key={p.id}
                    className={`plan-card${best ? " best" : ""}${selected ? " selected" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    onClick={() => setSelectedId(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(p.id);
                      }
                    }}
                  >
                    {best ? <i className="pc-best">{p.featured ? "BEST VALUE" : "BEST ₹/MO"}</i> : null}
                    {p.sticker ? (
                      <span className="pc-sticker" aria-hidden="true">
                        {p.sticker}
                      </span>
                    ) : null}
                    <div className="pc-dur">{p.name.toUpperCase()}</div>
                    <div className="pc-amt" style={p.soldOut ? { textDecoration: "line-through", opacity: 0.5 } : undefined}>
                      ₹{p.price}
                    </div>
                    <div className="pc-per">
                      {p.soldOut ? "SOLD OUT" : `₹${Math.round(p.price / Math.max(1, monthsOf(p.name)))}/mo`}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="beam"
              role="button"
              tabIndex={0}
              onClick={proceed}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  proceed();
                }
              }}
            >
              <span>
                <i className="fa-solid fa-arrow-right" aria-hidden="true" /> {config.content.proceedLabel}
              </span>
            </div>
          </div>
        ) : null}

        {step === 2 && plan ? (
          <div id="buyStep2" style={{ textAlign: "center" }}>
            <div className="payment-hero">
              <div className="pay-label">{config.content.payLabel}</div>
              <div id="payAmt">₹{plan.price}</div>
              <div id="selectedPlanLabel">
                {pack.title} · {plan.name}
              </div>
            </div>

            <div className={`upi-card${device.payWithQr ? " qr-primary" : " link-primary"}`}>
              <div className="pay-label" style={{ textAlign: "center" }}>
                {config.content.paymentHeading}
              </div>

              {/* ── PRIMARY · Razorpay universal (works on every device) ── */}
              <div className="pay-primary">
                <span className="pp-badge">
                  <i className="fa-solid fa-star" aria-hidden="true" /> RECOMMENDED
                </span>
                <a
                  className="pay-primary-btn"
                  href={config.links.razorpay}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={universal}
                >
                  <i className="fa-solid fa-shield-halved" aria-hidden="true" />
                  <span>PAY ₹{plan.price} · RAZORPAY UNIVERSAL</span>
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </a>
                <p className="pp-note">
                  Card · UPI · Netbanking — sab ek hi link se. Merchant gateway hai, isliye{" "}
                  <b>“UPI Risk Policy” wala alert yahan nahi aata</b>.
                </p>
              </div>

              <div className="pay-divider" role="separator">
                <span>YA UPI ID SE TRY KARO</span>
              </div>

              {device.payWithQr ? (
                <div className="device-hint hint-desktop" role="note">
                  <span className="dh-ico">
                    <i className="fa-solid fa-desktop" aria-hidden="true" />
                  </span>
                  <span className="dh-txt">
                    <b>Desktop par ho? 📱</b> Phone ka UPI app kholo aur neeche wala QR scan karo — amount ₹{plan.price} already
                    set hai. Ya UPI ID copy karke bhej do.
                  </span>
                </div>
              ) : (
                <div className="device-hint hint-mobile" role="note">
                  <span className="dh-ico">
                    <i className="fa-solid fa-mobile-screen-button" aria-hidden="true" />
                  </span>
                  <span className="dh-txt">
                    <b>Mobile par ho? ⚡</b> Neeche <b>PAY ₹{plan.price} VIA UPI</b> dabao — GPay / PhonePe / Paytm seedha khulega,
                    amount pehle se bhara hoga.
                  </span>
                </div>
              )}

              <div className={`qr-frame${qrFailed ? " qr-broken" : ""}`}>
                <span className="qr-amount-chip">SCAN · ₹{plan.price}</span>
                {qrFailed ? (
                  <div className="qr-fallback" role="note">
                    <i className="fa-solid fa-qrcode" aria-hidden="true" />
                    <b>QR load nahi hua</b>
                    <small>Internet check karo, ya neeche UPI ID copy karke apne UPI app mein daal do.</small>
                  </div>
                ) : (
                  <img
                    id="upiQrImage"
                    alt={`UPI QR code for ₹${plan.price} — ${pack.title} ${plan.name}`}
                    src={upiQr}
                    decoding="async"
                    onError={() => setQrFailed(true)}
                  />
                )}
                <span className="qr-brand">{config.brand.shortName || config.brand.name}</span>
              </div>

              <ol className="qr-steps">
                <li><b>1</b> UPI app kholo</li>
                <li><b>2</b> QR scan karo</li>
                <li><b>3</b> ₹{plan.price} pay karo</li>
              </ol>

              <div className="upi-id-row">
                <div style={{ minWidth: 0, textAlign: "left" }}>
                  <div className="upi-id-caption">{config.content.upiCaption}</div>
                  <div className="upi-id-value">{config.links.upi}</div>
                </div>
                <button className="premium-copy" onClick={copyUpi} type="button">
                  COPY
                </button>
              </div>

              <button
                id="dynamicUpiBtn"
                className={`dynamic-upi-btn${device.payWithQr ? " is-secondary" : ""}`}
                onClick={payByUpi}
                type="button"
              >
                <i className={`fa-solid ${device.payWithQr ? "fa-arrow-up-right-from-square" : "fa-bolt"}`} aria-hidden="true" />{" "}
                {device.payWithQr ? "YA ISI DEVICE PAR UPI APP KHOLO" : `PAY ₹${plan.price} VIA UPI →`}
              </button>

              {/* the warning the buyer needs *right here*, next to the button */}
              <div className="pay-warn" role="note">
                <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                <span>
                  <b>UPI ID se payment fail ho sakti hai.</b> Paytm / GPay personal UPI par “UPI Risk
                  Policy” alert dikha ke transfer rok dete hain — paisa nahi katta. Aisa ho to{" "}
                  <b>upar wale Razorpay Universal</b> button se pay karo, wahan ye dikkat nahi aati.
                </span>
              </div>

              <div className="pay-routes">
                {payeeMobile ? (
                  <button type="button" className="pay-route" onClick={() => void copyPayeeMobile()}>
                    <span className="pr-ico" aria-hidden="true">
                      <i className="fa-solid fa-mobile-screen" />
                    </span>
                    <span className="pr-txt">
                      <b>MOBILE NUMBER SE PAY</b>
                      <small>{payeeMobile} · tap to copy</small>
                    </span>
                    <i className="fa-solid fa-copy pr-end" aria-hidden="true" />
                  </button>
                ) : null}
                <a
                  className="pay-route is-safe"
                  href={config.links.razorpay}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={universal}
                >
                  <span className="pr-ico" aria-hidden="true">
                    <i className="fa-solid fa-shield-halved" />
                  </span>
                  <span className="pr-txt">
                    <b>UPI FAIL HUI? RAZORPAY SE PAY</b>
                    <small>merchant gateway · koi risk alert nahi</small>
                  </span>
                  <i className="fa-solid fa-arrow-up-right-from-square pr-end" aria-hidden="true" />
                </a>
              </div>

              <p className="upi-hint">{config.content.upiHint}</p>

              <PaymentNotes lang={lang} />
            </div>

            {key === "adult" || key === "combo" ? (
              <div id="payNote" className="note-box" style={{ marginBottom: 13, borderColor: "rgba(var(--acc-rgb),.5)" }}>
                <p>
                  ⚡ <b>{config.content.paymentNoteTitle}</b> {config.content.paymentNote}
                </p>
              </div>
            ) : null}

            <div className="shot-card">
              <div className="ico">
                <i className="fa-solid fa-camera" aria-hidden="true" />
              </div>
              <h3>{config.content.screenshotTitle}</h3>
              <p>{config.content.screenshotDesc}</p>
              <a
                className="screenshot-btn"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  sendProof();
                }}
              >
                <i className="fa-brands fa-telegram" aria-hidden="true" /> {config.content.screenshotCta}
              </a>
            </div>

            <div className="pay-heading">{config.content.universalCta}</div>
            <div id="rzpButtonMount" ref={rzpRef} />
            {decision && decision.mode !== "razorpay" ? (
              <div style={{ fontSize: 11, color: "var(--faint)", padding: "12px", textAlign: "center" }}>
                Is plan ke liye neeche Universal Payment use karein.
              </div>
            ) : null}

            <a
              className="universal-btn"
              href={config.links.razorpay}
              target="_blank"
              rel="noopener noreferrer"
              onClick={universal}
              style={{ marginTop: 10 }}
            >
              <i className="fa-solid fa-bolt" aria-hidden="true" />{" "}
              {config.content.universalLabel.replace("{telegramUpper}", config.links.telegram.toUpperCase())}
            </a>

            <p className="contact-line">
              {config.content.supportPrefix}{" "}
              <a href={telegramUrl(config.links.telegram)} target="_blank" rel="noopener noreferrer">
                Telegram · @{config.links.telegram}
              </a>{" "}
              ya <a href={`mailto:${config.links.email}`}>email</a> {config.content.supportSuffix}
            </p>

            <div style={{ marginTop: 16 }}>
              <button type="button" className="st-btn" onClick={() => setStep(1)}>
                <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Change plan
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
