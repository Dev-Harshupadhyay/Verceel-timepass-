import { useEffect, useMemo, useRef, useState } from "react";
import { useConfig } from "@/state/ConfigProvider";
import { useToast } from "@/state/ToastProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { Announcement } from "@/components/Announcement";
import { navigate } from "@/lib/router";
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
import type { PackKey, Plan } from "@/types";

const PACK_KEYS: PackKey[] = ["movies", "adult", "combo"];

function monthsOf(name: string): number {
  const n = parseInt(name, 10) || 1;
  if (/year/i.test(name)) return n * 12;
  if (/month/i.test(name)) return n;
  return n;
}

export function BuyPage({ packKey }: { packKey: string }) {
  const { config } = useConfig();
  const { toast } = useToast();

  const key: PackKey = (PACK_KEYS.includes(packKey as PackKey) ? packKey : "movies") as PackKey;
  const pack = config.packs[key];
  const plans = useMemo(() => (pack ? activePlans(pack) : []), [pack]);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  if (invalid) return null;

  const upiUri = plan ? buildUpiUri(config, plan.name, key, plan.price) : "";
  const upiQr = plan ? qrSrc(upiUri, 520) : "";

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
    window.location.href = upiUri;
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

            <div className="upi-card">
              <div className="pay-label" style={{ textAlign: "center" }}>
                {config.content.paymentHeading}
              </div>
              <div className="qr-frame">
                <img id="upiQrImage" alt="Dynamic UPI QR Code" src={upiQr} decoding="async" />
              </div>
              <div className="upi-id-row">
                <div style={{ minWidth: 0, textAlign: "left" }}>
                  <div className="upi-id-caption">{config.content.upiCaption}</div>
                  <div className="upi-id-value">{config.links.upi}</div>
                </div>
                <button className="premium-copy" onClick={copyUpi} type="button">
                  COPY
                </button>
              </div>
              <button id="dynamicUpiBtn" className="dynamic-upi-btn" onClick={payByUpi} type="button">
                <i className="fa-solid fa-credit-card" aria-hidden="true" /> PAY ₹{plan.price} VIA UPI →
              </button>
              <p className="upi-hint">{config.content.upiHint}</p>
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
