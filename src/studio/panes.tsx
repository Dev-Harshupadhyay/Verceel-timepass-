import { useEffect, useState } from "react";
import { Row, TextField, TextArea, SwitchRow, Seg, Select, Chip } from "./fields";
import { Announcement } from "@/components/Announcement";
import { useConfig } from "@/state/ConfigProvider";
import { useTheme } from "@/state/ThemeProvider";
import { useAuth } from "@/state/AuthProvider";
import { useToast } from "@/state/ToastProvider";
import { fetchStorageStatus, type StorageReport } from "@/lib/api";
import { resolvePayment } from "@/lib/payments";
import { THEMES } from "@/config";
import { readVisits, clearVisits, exportVisits } from "@/lib/visits";
import type { Config, DevStat, ThemeId, TrustItem, AnnounceTone, AnnounceAnim } from "@/types";

export interface PaneProps {
  draft: Config;
  update: (fn: (d: Config) => void) => void;
}

/* ─────────────────────────── OVERVIEW ─────────────────────────── */

export function OverviewPane({ draft }: PaneProps) {
  const { configured, revision, updatedAt, source, error } = useConfig();
  const { password } = useAuth();
  const [storage, setStorage] = useState<StorageReport | null>(null);
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();

  const checkStorage = async () => {
    if (!password) return;
    setChecking(true);
    const res = await fetchStorageStatus(password);
    setChecking(false);
    if (!res) {
      toast("Storage check fail — server se baat nahi hui", "error");
      return;
    }
    setStorage(res);
    if (res.storage.configured && res.ping === "ok") toast("✅ KV connected aur readable hai", "success");
    else if (res.storage.configured) toast("KV vars mile, par read fail — token/url check karo", "warn");
    else toast("❌ KV connect nahi hai — neeche reason dekho", "error");
  };
  const plans = Object.values(draft.packs).flatMap((p) => (p.active ? p.plans.filter((x) => x.active) : []));
  const prices = plans.map((p) => p.price);
  const issues: string[] = [];

  Object.entries(draft.packs).forEach(([key, pack]) => {
    if (!pack.active) return;
    pack.plans.forEach((plan) => {
      if (!plan.active) return;
      /* only warn when the stale button amount could actually be charged —
         UPI/universal plans never touch the Razorpay button */
      if (resolvePayment(plan).mismatch) {
        issues.push(`${pack.title} · ${plan.name}: Razorpay button ₹${plan.razorpayAmount} vs price ₹${plan.price}`);
      }
    });
    if (!pack.plans.length) issues.push(`${pack.title}: koi plan nahi hai`);
    void key;
  });
  if (!draft.links.upi) issues.push("UPI ID khaali hai");
  if (!draft.faq.filter((f) => f.active).length) issues.push("Koi active FAQ nahi hai");

  return (
    <div className="studio-pane">
      <div className="studio-card">
        <div className="studio-row">
          <div className="sr-label">
            <b>Storage</b>
            <small>Live config kis source se aa raha hai</small>
          </div>
          <div className="sr-body">
            <div className="st-inline">
              {configured ? <Chip tone="live">KV CONNECTED</Chip> : <Chip tone="off">KV OFF · CODE DEFAULTS</Chip>}
              {source === "live" ? <Chip tone="live">LIVE DATA</Chip> : source === "cache" ? <Chip tone="draft">CACHED</Chip> : <Chip tone="off">DEFAULTS</Chip>}
              {error ? <Chip tone="err">READ ERROR</Chip> : null}
            </div>
            {error ? <span className="st-field-note">{error}</span> : null}
            {!configured ? (
              <span className="st-field-note">
                Publish karne ke liye Vercel par Upstash Redis connect karo (README dekho). Tab tak site code defaults par chalegi.
              </span>
            ) : null}
            <div className="st-inline" style={{ marginTop: 6 }}>
              <button type="button" className="st-btn tiny" onClick={() => void checkStorage()} disabled={checking}>
                <i className={`fa-solid ${checking ? "fa-spinner fa-spin" : "fa-stethoscope"}`} aria-hidden="true" /> Storage check
              </button>
            </div>
            {storage ? (
              <div className="storage-report">
                <div className="sr-line">
                  <Chip tone={storage.storage.configured ? "live" : "err"}>
                    {storage.storage.configured ? "VARS MIL GAYE" : "VARS NAHI MILE"}
                  </Chip>
                  <span className="st-field-note">
                    provider: <b>{storage.storage.provider}</b>
                    {storage.ping ? ` · ping: ${storage.ping}` : ""}
                  </span>
                </div>
                {storage.storage.presentVars.length ? (
                  <div className="sr-line">
                    <span className="st-field-note">mila: {storage.storage.presentVars.join(", ")}</span>
                  </div>
                ) : null}
                {storage.storage.missing.length ? (
                  <div className="sr-line">
                    <span className="st-field-note" style={{ color: "#e5533d" }}>
                      missing: {storage.storage.missing.join(" · ")}
                    </span>
                  </div>
                ) : null}
                {storage.storage.hint ? (
                  <div className="sr-line">
                    <span className="st-field-note">{storage.storage.hint}</span>
                  </div>
                ) : null}
                {storage.storage.needsRedeployLikely ? (
                  <div className="sr-line">
                    <span className="st-field-note">
                      <b>Redeploy kiya?</b> Env vars sirf naye deployment par lagte hain — Deployments → latest → ⋯ → Redeploy.
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className="studio-row">
          <div className="sr-label">
            <b>Live revision</b>
            <small>Publish hone par badhta hai</small>
          </div>
          <div className="sr-body">
            <div className="st-inline">
              <Chip tone={revision ? "live" : "off"}>REV {revision || "—"}</Chip>
              <span className="st-field-note">{updatedAt ? new Date(updatedAt).toLocaleString("en-IN") : "Abhi publish nahi hua"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="studio-card">
        <div className="studio-row">
          <div className="sr-label"><b>Active plans</b><small>Sab packs milake</small></div>
          <div className="sr-body"><b style={{ fontSize: 20 }}>{plans.length}</b></div>
        </div>
        <div className="studio-row">
          <div className="sr-label"><b>Lowest price</b><small>Sabse sasta live plan</small></div>
          <div className="sr-body"><b style={{ fontSize: 20 }}>{prices.length ? `₹${Math.min(...prices)}` : "—"}</b></div>
        </div>
        <div className="studio-row">
          <div className="sr-label"><b>FAQ items</b><small>Active questions</small></div>
          <div className="sr-body"><b style={{ fontSize: 20 }}>{draft.faq.filter((f) => f.active).length}</b></div>
        </div>
        <div className="studio-row">
          <div className="sr-label"><b>Default appearance</b><small>Naye visitors ko kya dikhega</small></div>
          <div className="sr-body"><b style={{ fontSize: 13 }}>{THEMES.find((t) => t.id === draft.appearance.defaultTheme)?.name}</b></div>
        </div>
      </div>

      {issues.length ? (
        <div className="studio-card">
          <div className="studio-row stack">
            <div className="sr-label"><b>Needs attention</b><small>Publish se pehle dekh lo</small></div>
            <div className="sr-body">
              {issues.map((issue, i) => (
                <div className="warn-inline" key={i}>
                  <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────── CONTENT ─────────────────────────── */

const TRUST_ICON_OPTIONS = [
  { value: "bolt", label: "⚡ Bolt" },
  { value: "lock", label: "🔒 Lock" },
  { value: "headset", label: "🎧 Headset" },
  { value: "star", label: "★ Star" },
  { value: "shield", label: "🛡 Shield" },
  { value: "gift", label: "🎁 Gift" }
];

export function ContentPane({ draft, update }: PaneProps) {
  return (
    <div className="studio-pane">
      <div className="studio-h2">BRAND</div>
      <div className="studio-card">
        <Row label="Site name" hint="Hero aur titles mein use hota hai">
          <TextField value={draft.brand.name} maxLength={60} onChange={(v) => update((d) => { d.brand.name = v; })} />
        </Row>
        <Row label="Short name" hint="Navbar / footer ke liye">
          <TextField value={draft.brand.shortName} maxLength={60} onChange={(v) => update((d) => { d.brand.shortName = v; })} />
        </Row>
        <Row label="Logo URL" hint="Khaali = built-in /logo.svg">
          <TextField
            value={draft.brand.logoUrl}
            placeholder="/logo.svg or https://…"
            onChange={(v) => update((d) => { d.brand.logoUrl = v; })}
          />
        </Row>
      </div>

      <div className="studio-h2">HERO</div>
      <div className="studio-card">
        <Row label="Hero heading">
          <TextField value={draft.hero.title} maxLength={60} onChange={(v) => update((d) => { d.hero.title = v; })} />
        </Row>
        <Row label="Tagline">
          <TextField value={draft.hero.tagline} maxLength={80} onChange={(v) => update((d) => { d.hero.tagline = v; })} />
        </Row>
        <Row label="Live badge">
          <TextField value={draft.hero.badge} maxLength={60} onChange={(v) => update((d) => { d.hero.badge = v; })} />
        </Row>
        <Row label="Hero button" hint="Khaali chhodo to button hide ho jayega">
          <TextField value={draft.hero.ctaLabel} maxLength={40} onChange={(v) => update((d) => { d.hero.ctaLabel = v; })} />
        </Row>
        <Row label="Hero image URL">
          <TextField value={draft.hero.image} onChange={(v) => update((d) => { d.hero.image = v; })} />
        </Row>
        <Row label="Plans heading">
          <TextField value={draft.hero.sectionLabel} maxLength={50} onChange={(v) => update((d) => { d.hero.sectionLabel = v; })} />
        </Row>
        <Row label="Plans sub-label">
          <TextField value={draft.hero.sectionSub} maxLength={40} onChange={(v) => update((d) => { d.hero.sectionSub = v; })} />
        </Row>
        <Row label="FAQ heading">
          <TextField value={draft.hero.faqLabel} maxLength={40} onChange={(v) => update((d) => { d.hero.faqLabel = v; })} />
        </Row>
        <Row label="FAQ sub-label">
          <TextField value={draft.hero.faqSub} maxLength={40} onChange={(v) => update((d) => { d.hero.faqSub = v; })} />
        </Row>
      </div>

      <div className="studio-h2">TRUST STRIP</div>
      <div className="studio-card">
        {draft.hero.trust.map((item: TrustItem, i) => (
          <Row key={i} label={`Item ${i + 1}`}>
            <div className="st-inline" style={{ alignItems: "stretch" }}>
              <div style={{ flex: "0 0 130px" }}>
                <Select
                  value={item.icon}
                  options={TRUST_ICON_OPTIONS}
                  onChange={(v) => update((d) => { d.hero.trust[i].icon = v; })}
                  label={`Trust icon ${i + 1}`}
                />
              </div>
              <div style={{ flex: "1 1 110px" }}>
                <TextField value={item.title} maxLength={24} onChange={(v) => update((d) => { d.hero.trust[i].title = v; })} />
              </div>
              <div style={{ flex: "1 1 110px" }}>
                <TextField value={item.sub} maxLength={32} onChange={(v) => update((d) => { d.hero.trust[i].sub = v; })} />
              </div>
            </div>
          </Row>
        ))}
      </div>

      <div className="studio-h2">PAYMENT TEXTS</div>
      <div className="studio-card">
        <Row label="Amount label">
          <TextField value={draft.content.payLabel} maxLength={40} onChange={(v) => update((d) => { d.content.payLabel = v; })} />
        </Row>
        <Row label="UPI heading">
          <TextField value={draft.content.paymentHeading} maxLength={60} onChange={(v) => update((d) => { d.content.paymentHeading = v; })} />
        </Row>
        <Row label="UPI caption">
          <TextField value={draft.content.upiCaption} maxLength={40} onChange={(v) => update((d) => { d.content.upiCaption = v; })} />
        </Row>
        <Row label="UPI note template" hint="Variables: {plan} {pack} {bot} {brand}" stack>
          <TextField value={draft.content.upiNoteTemplate} maxLength={80} onChange={(v) => update((d) => { d.content.upiNoteTemplate = v; })} />
        </Row>
        <Row label="UPI hint" stack>
          <TextArea value={draft.content.upiHint} maxLength={300} onChange={(v) => update((d) => { d.content.upiHint = v; })} />
        </Row>
        <Row label="Payment note title">
          <TextField value={draft.content.paymentNoteTitle} maxLength={40} onChange={(v) => update((d) => { d.content.paymentNoteTitle = v; })} />
        </Row>
        <Row label="Payment note" stack>
          <TextArea value={draft.content.paymentNote} maxLength={400} onChange={(v) => update((d) => { d.content.paymentNote = v; })} />
        </Row>
        <Row label="Screenshot card title">
          <TextField value={draft.content.screenshotTitle} maxLength={60} onChange={(v) => update((d) => { d.content.screenshotTitle = v; })} />
        </Row>
        <Row label="Screenshot card text" stack>
          <TextArea value={draft.content.screenshotDesc} maxLength={240} onChange={(v) => update((d) => { d.content.screenshotDesc = v; })} />
        </Row>
        <Row label="Screenshot button">
          <TextField value={draft.content.screenshotCta} maxLength={60} onChange={(v) => update((d) => { d.content.screenshotCta = v; })} />
        </Row>
        <Row label="Universal button label" hint="{telegramUpper} auto-fill hota hai">
          <TextField value={draft.content.universalLabel} maxLength={80} onChange={(v) => update((d) => { d.content.universalLabel = v; })} />
        </Row>
        <Row label="More options heading">
          <TextField value={draft.content.universalCta} maxLength={60} onChange={(v) => update((d) => { d.content.universalCta = v; })} />
        </Row>
        <Row label="Support line prefix">
          <TextField value={draft.content.supportPrefix} maxLength={80} onChange={(v) => update((d) => { d.content.supportPrefix = v; })} />
        </Row>
        <Row label="Support line suffix">
          <TextField value={draft.content.supportSuffix} maxLength={40} onChange={(v) => update((d) => { d.content.supportSuffix = v; })} />
        </Row>
      </div>

      <div className="studio-h2">BUY PAGE</div>
      <div className="studio-card">
        <Row label="Buy title">
          <TextField value={draft.content.buyTitle} maxLength={60} onChange={(v) => update((d) => { d.content.buyTitle = v; })} />
        </Row>
        <Row label="Buy subtitle">
          <TextField value={draft.content.buySub} maxLength={80} onChange={(v) => update((d) => { d.content.buySub = v; })} />
        </Row>
        <Row label="Proceed label">
          <TextField value={draft.content.proceedLabel} maxLength={40} onChange={(v) => update((d) => { d.content.proceedLabel = v; })} />
        </Row>
      </div>

      <div className="studio-h2">FOOTER &amp; NOTICE</div>
      <div className="studio-card">
        <Row label="Footer line">
          <TextField value={draft.content.footerLine} maxLength={90} onChange={(v) => update((d) => { d.content.footerLine = v; })} />
        </Row>
        <Row label="Footer credit">
          <TextField value={draft.content.footerCredit} maxLength={90} onChange={(v) => update((d) => { d.content.footerCredit = v; })} />
        </Row>
        <Row label="Telegram eyebrow">
          <TextField value={draft.content.telegramEyebrow} maxLength={60} onChange={(v) => update((d) => { d.content.telegramEyebrow = v; })} />
        </Row>
        <Row label="Telegram title">
          <TextField value={draft.content.telegramTitle} maxLength={90} onChange={(v) => update((d) => { d.content.telegramTitle = v; })} />
        </Row>
        <Row label="Telegram text" stack>
          <TextArea value={draft.content.telegramDesc} maxLength={160} onChange={(v) => update((d) => { d.content.telegramDesc = v; })} />
        </Row>
        <Row label="FAQ view-all label">
          <TextField value={draft.content.faqViewAll} maxLength={40} onChange={(v) => update((d) => { d.content.faqViewAll = v; })} />
        </Row>
        <Row label="FAQ section title">
          <TextField value={draft.content.faqTeaserTitle} maxLength={60} onChange={(v) => update((d) => { d.content.faqTeaserTitle = v; })} />
        </Row>
      </div>

      <div className="studio-h2">DEVELOPER PROFILE (CROWN CARD)</div>
      <div className="studio-card">
        <Row label="Crown label" hint="Card ke top par badge">
          <TextField value={draft.brand.devCrown} maxLength={48} onChange={(v) => update((d) => { d.brand.devCrown = v; })} />
        </Row>
        <Row label="Name">
          <TextField value={draft.brand.devName} maxLength={40} onChange={(v) => update((d) => { d.brand.devName = v; })} />
        </Row>
        <Row label="Handle">
          <TextField value={draft.brand.devHandle} maxLength={40} onChange={(v) => update((d) => { d.brand.devHandle = v; })} />
        </Row>
        <Row label="Role line">
          <TextField value={draft.brand.devRole} maxLength={80} onChange={(v) => update((d) => { d.brand.devRole = v; })} />
        </Row>
        <Row label="Quote" hint="Chhota highlight line" stack>
          <TextField value={draft.brand.devQuote} maxLength={90} onChange={(v) => update((d) => { d.brand.devQuote = v; })} />
        </Row>
        <Row label="Bio" stack>
          <TextArea value={draft.brand.devBio} maxLength={420} onChange={(v) => update((d) => { d.brand.devBio = v; })} />
        </Row>
        <Row label="Portfolio button label">
          <TextField value={draft.brand.devPortfolioLabel} maxLength={32} onChange={(v) => update((d) => { d.brand.devPortfolioLabel = v; })} />
        </Row>
        <Row label="Tags" hint="Comma se separate karo">
          <TextField
            value={draft.brand.devTags.join(", ")}
            onChange={(v) =>
              update((d) => {
                d.brand.devTags = v.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 10);
              })
            }
          />
        </Row>
        {draft.brand.devStats.map((stat: DevStat, i) => (
          <Row key={i} label={`Stat ${i + 1}`}>
            <div className="st-inline">
              <div style={{ flex: "0 0 100px" }}>
                <TextField value={stat.value} maxLength={12} onChange={(v) => update((d) => { d.brand.devStats[i].value = v; })} />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <TextField value={stat.label} maxLength={20} onChange={(v) => update((d) => { d.brand.devStats[i].label = v; })} />
              </div>
            </div>
          </Row>
        ))}
        <Row label="Purchase guide title">
          <TextField value={draft.content.devGuideTitle} maxLength={40} onChange={(v) => update((d) => { d.content.devGuideTitle = v; })} />
        </Row>
      </div>
    </div>
  );
}

/* ─────────────────────────── LINKS ─────────────────────────── */

export function LinksPane({ draft, update }: PaneProps) {
  return (
    <div className="studio-pane">
      <div className="studio-h2">PAYMENT</div>
      <div className="studio-card">
        <Row label="UPI ID" hint="QR + UPI deep link isi se bante hain">
          <TextField
            value={draft.links.upi}
            placeholder="name@bank"
            onChange={(v) => update((d) => { d.links.upi = v; })}
            note={`UPI link: upi://pay?pa=${draft.links.upi || "…"}`}
          />
        </Row>
        <Row label="Razorpay universal link">
          <TextField value={draft.links.razorpay} onChange={(v) => update((d) => { d.links.razorpay = v; })} />
        </Row>
      </div>

      <div className="studio-h2">TELEGRAM &amp; CONTACT</div>
      <div className="studio-card">
        <Row label="Support username" hint="@ ke bina">
          <TextField
            value={draft.links.telegram}
            onChange={(v) => update((d) => { d.links.telegram = v.replace(/^@/, ""); })}
            note={`https://t.me/${draft.links.telegram}`}
          />
        </Row>
        <Row label="Channel username">
          <TextField
            value={draft.links.channel}
            onChange={(v) => update((d) => { d.links.channel = v.replace(/^@/, ""); })}
            note={`https://t.me/${draft.links.channel}`}
          />
        </Row>
        <Row label="Tracker bot">
          <TextField
            value={draft.links.bot}
            onChange={(v) => update((d) => { d.links.bot = v.replace(/^@/, ""); })}
            note={`https://t.me/${draft.links.bot}`}
          />
        </Row>
        <Row label="Email">
          <TextField value={draft.links.email} onChange={(v) => update((d) => { d.links.email = v; })} />
        </Row>
        <Row label="Portfolio URL">
          <TextField value={draft.links.portfolio} onChange={(v) => update((d) => { d.links.portfolio = v; })} />
        </Row>
      </div>

      <div className="note-inline">
        <i className="fa-solid fa-circle-info" aria-hidden="true" />
        <span>
          Ye values site ke har jagah use hoti hain — buy page, UPI QR, Telegram DM, drawer, info page aur admin ke sab links.
          Publish karne ke baad sab jagah turant badal jayengi.
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── ANNOUNCEMENT ─────────────────────────── */

export function AnnouncementPane({ draft, update }: PaneProps) {
  const ann = draft.announcement;
  const localExpiry = ann.expiresAt ? new Date(ann.expiresAt) : null;
  const localValue = localExpiry
    ? `${localExpiry.getFullYear()}-${String(localExpiry.getMonth() + 1).padStart(2, "0")}-${String(localExpiry.getDate()).padStart(2, "0")}T${String(localExpiry.getHours()).padStart(2, "0")}:${String(localExpiry.getMinutes()).padStart(2, "0")}`
    : "";

  return (
    <div className="studio-pane">
      <div className="studio-h2">LIVE PREVIEW</div>
      <div className="studio-card" style={{ padding: 0, overflow: "hidden" }}>
        {ann.enabled && ann.text.trim() ? (
          <Announcement value={ann} preview revisionOverride={draft.revision} />
        ) : (
          <div style={{ padding: "18px 16px", textAlign: "center", fontSize: 11, color: "var(--faint)" }}>
            Announcement off hai — enable karke text likho, preview yahan dikhega.
          </div>
        )}
      </div>

      <div className="studio-h2">QUICK PRESETS</div>
      <div className="studio-card">
        <Row label="One-tap fill" hint="Text, badge aur button ek click mein" stack>
          <div className="st-inline">
            {[
              {
                k: "50",
                badge: "STARTING ₹50",
                text: "🔥 Sab plans sirf ₹50 se shuru — OTT se sasta, instant access!",
                label: "GRAB DEAL",
                url: "/buy/movies"
              },
              {
                k: "limited",
                badge: "LIMITED TIME",
                text: "⚡ Limited offer — 1 Year Combo ₹1500, aaj hi book karo!",
                label: "BUY COMBO",
                url: "/buy/combo"
              },
              {
                k: "new",
                badge: "NEW",
                text: "🎬 Nayi movies aur series add ho gayi hain — abhi dekho!",
                label: "DEKHO",
                url: "/buy/movies"
              },
              {
                k: "sale",
                badge: "FESTIVE SALE",
                text: "🎉 Festive sale live — har pack par best price, jaldi karo!",
                label: "BUY NOW",
                url: "/buy/combo"
              }
            ].map((preset) => (
              <button
                key={preset.k}
                type="button"
                className="st-btn tiny"
                onClick={() =>
                  update((d) => {
                    d.announcement.enabled = true;
                    d.announcement.badge = preset.badge;
                    d.announcement.text = preset.text;
                    d.announcement.ctaLabel = preset.label;
                    d.announcement.ctaUrl = preset.url;
                  })
                }
              >
                {preset.badge.charAt(0) + preset.badge.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </Row>
      </div>

      <div className="studio-h2">SETTINGS</div>
      <div className="studio-card">
        <SwitchRow
          label="Show announcement"
          hint="Off karne par site bilkul normal dikhegi"
          checked={ann.enabled}
          onChange={(v) => update((d) => { d.announcement.enabled = v; })}
        />
        <Row label="Message" hint="Offer / discount / update" stack>
          <TextArea
            value={ann.text}
            maxLength={160}
            rows={2}
            placeholder="🔥 FLAT 40% OFF — 1 Year Combo ₹1500 → ₹900"
            onChange={(v) => update((d) => { d.announcement.text = v; })}
          />
        </Row>
        <Row label="Badge" hint="Optional chhota label">
          <TextField
            value={ann.badge}
            maxLength={32}
            placeholder="LIMITED TIME"
            onChange={(v) => update((d) => { d.announcement.badge = v; })}
          />
        </Row>
        <Row label="Button label">
          <TextField
            value={ann.ctaLabel}
            maxLength={32}
            placeholder="GRAB DEAL"
            onChange={(v) => update((d) => { d.announcement.ctaLabel = v; })}
          />
        </Row>
        <Row label="Button URL" hint="http(s) ya /relative">
          <TextField
            value={ann.ctaUrl}
            placeholder="/buy/combo"
            onChange={(v) => update((d) => { d.announcement.ctaUrl = v; })}
          />
        </Row>
        <Row label="Tone">
          <Seg<AnnounceTone>
            label="Tone"
            value={ann.tone}
            options={[
              { value: "gold", label: "Gold" },
              { value: "violet", label: "Violet" },
              { value: "red", label: "Urgent" }
            ]}
            onChange={(v) => update((d) => { d.announcement.tone = v; })}
          />
        </Row>
        <Row label="Animation">
          <Seg<AnnounceAnim>
            label="Animation"
            value={ann.animation}
            options={[
              { value: "shimmer", label: "Shimmer" },
              { value: "marquee", label: "Marquee" },
              { value: "none", label: "None" }
            ]}
            onChange={(v) => update((d) => { d.announcement.animation = v; })}
          />
        </Row>
        <SwitchRow
          label="Dismissible"
          hint="Visitor × daba ke hata sakta hai"
          checked={ann.dismissible}
          onChange={(v) => update((d) => { d.announcement.dismissible = v; })}
        />
        <SwitchRow
          label="Buy page par bhi dikhao"
          checked={ann.showOnBuyPage}
          onChange={(v) => update((d) => { d.announcement.showOnBuyPage = v; })}
        />
        <Row label="Expires at" hint="Khaali = kabhi expire nahi">
          <TextField
            type="datetime-local"
            value={localValue}
            onChange={(v) =>
              update((d) => {
                d.announcement.expiresAt = v ? new Date(v).toISOString() : null;
              })
            }
          />
        </Row>
      </div>

      <div className="note-inline">
        <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
        <span>Shimmer animation text par chalti hai (reduced-motion users ke liye off). Marquee tab use karo jab message lamba ho.</span>
      </div>
    </div>
  );
}

/* ─────────────────────────── APPEARANCE ─────────────────────────── */

export function AppearancePane({ draft, update }: PaneProps) {
  const { explicit, theme } = useTheme();
  const options = THEMES.map((t) => ({ value: t.id as ThemeId, label: `${t.name}${t.dark ? " · dark" : " · light"}` }));

  return (
    <div className="studio-pane">
      <div className="studio-h2">GLOBAL DEFAULT</div>
      <div className="studio-card">
        <Row label="Default theme" hint="Sirf naye visitors ke liye">
          <Select<ThemeId>
            value={draft.appearance.defaultTheme}
            options={options}
            onChange={(v) => update((d) => { d.appearance.defaultTheme = v; })}
            label="Default theme"
          />
        </Row>
        <Row label="Dark mode theme" hint="Sun/Moon toggle ise use karta hai">
          <Select<ThemeId>
            value={draft.appearance.darkTheme}
            options={THEMES.filter((t) => t.dark).map((t) => ({ value: t.id as ThemeId, label: t.name }))}
            onChange={(v) => update((d) => { d.appearance.darkTheme = v; })}
            label="Dark theme"
          />
        </Row>
      </div>

      <div className="note-inline">
        <i className="fa-solid fa-circle-info" aria-hidden="true" />
        <span>
          Visitor ne pehle se apna theme choose kiya hai to wo hamesha jeetega — ye sirf first-time visitors par lagta hai.
          {explicit ? ` Tumhare browser par abhi "${theme}" saved hai, isliye change publish karne ke baad bhi yahan purana hi dikhega.` : ""}
        </span>
      </div>

      <div className="studio-h2">PREVIEW</div>
      <div className="studio-card">
        <div className="studio-row">
          <div className="sr-label"><b>Quick preview</b><small>Publish se pehle dekh lo</small></div>
          <div className="sr-body">
            <ThemePreviewButtons draft={draft} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemePreviewButtons({ draft }: { draft: Config }) {
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  return (
    <div className="st-inline">
      <button type="button" className="st-btn tiny" onClick={() => { setTheme(draft.appearance.defaultTheme, { persist: false }); toast("Global default preview", "success"); }}>
        Preview default
      </button>
      <button type="button" className="st-btn tiny" onClick={() => { setTheme(draft.appearance.darkTheme, { persist: false }); toast("Dark theme preview", "success"); }}>
        Preview dark
      </button>
      <span className="st-field-note">Current: {(THEMES.find((t) => t.id === theme) || THEMES[0]).name}</span>
    </div>
  );
}

/* ─────────────────────────── VISITORS ─────────────────────────── */

export function VisitorsPane(_: PaneProps) {
  const [logs, setLogs] = useState(() => readVisits());
  const { toast } = useToast();

  useEffect(() => {
    setLogs(readVisits());
  }, []);

  return (
    <div className="studio-pane">
      <div className="st-inline" style={{ marginBottom: 12 }}>
        <button type="button" className="st-btn" onClick={() => { exportVisits(); toast("Export ready", "success"); }}>
          <i className="fa-solid fa-file-export" aria-hidden="true" /> Export JSON
        </button>
        <button
          type="button"
          className="st-btn danger"
          onClick={() => {
            clearVisits();
            setLogs([]);
            toast("Logs clear ho gaye", "success");
          }}
        >
          <i className="fa-solid fa-trash" aria-hidden="true" /> Clear logs
        </button>
        <span className="st-field-note">{logs.length} visits (is browser ke)</span>
      </div>

      {!logs.length ? (
        <div className="admin-empty">
          <i className="fa-solid fa-satellite-dish" aria-hidden="true" />
          <b>No local logs yet</b>
          <small>Visitors from this browser will appear here.</small>
        </div>
      ) : (
        logs.map((log, i) => (
          <article className="admin-log" key={`${log.time}-${i}`}>
            <div className="log-top">
              <span className="log-live">
                <i /> VISIT {i + 1}
              </span>
              <time>{new Date(log.time).toLocaleString("en-IN")}</time>
            </div>
            <div className="log-grid">
              <div><small>IP</small><b>{log.ip}</b></div>
              <div><small>ISP</small><b>{log.isp}</b></div>
              <div><small>LOCATION</small><b>{[log.city, log.region, log.country].filter(Boolean).join(", ")}</b></div>
              <div><small>DEVICE</small><b>{log.device}</b></div>
              <div><small>BROWSER</small><b>{log.browser}</b></div>
              <div><small>OS</small><b>{log.os}</b></div>
              <div><small>SCREEN</small><b>{log.screen}</b></div>
              <div><small>TIMEZONE</small><b>{log.tz}</b></div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
