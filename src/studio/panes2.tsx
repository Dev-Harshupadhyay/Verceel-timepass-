import { useEffect, useState } from "react";
import { Row, TextField, TextArea, SwitchRow, Seg, Select, TriField, Chip } from "./fields";
import { useConfig } from "@/state/ConfigProvider";
import { useAuth } from "@/state/AuthProvider";
import { useToast } from "@/state/ToastProvider";
import { normalize } from "@/config";
import { fetchHistory, fetchRevisionConfig, restoreRevision, resetConfig } from "@/lib/api";
import { resolvePayment } from "@/lib/payments";
import { downloadJson } from "@/lib/download";
import type { Config, FaqCat, FaqItem, InfoPoint, PackKey, PayMode, RevisionSummary } from "@/types";
import type { PaneProps } from "./panes";

const PACK_KEYS: PackKey[] = ["movies", "adult", "combo"];

/* ─────────────────────────── PLANS ─────────────────────────── */

const PAY_MODE_OPTIONS: { value: PayMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "razorpay", label: "Razorpay only" },
  { value: "upi", label: "UPI only" },
  { value: "universal", label: "Universal" }
];

export function PlansPane({ draft, update }: PaneProps) {
  return (
    <div className="studio-pane">
      <div className="warn-inline" style={{ marginTop: 0, marginBottom: 14 }}>
        <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
        <span>
          <b>Razorpay button ka amount dashboard mein fixed hota hai.</b> Isliye har plan ke saath “Button amount” bhi store hota
          hai. Price se mismatch hote hi site automatically UPI + Universal par bhej deti hai — galat amount charge nahi hoga.
        </span>
      </div>

      {PACK_KEYS.map((key) => {
        const pack = draft.packs[key];
        return (
          <div key={key}>
            <div className="studio-h2">{pack.emoji} {pack.title.toUpperCase()}</div>
            <div className="studio-card">
              <Row label="Title">
                <TextField value={pack.title} maxLength={40} onChange={(v) => update((d) => { d.packs[key].title = v; })} />
              </Row>
              <Row label="Subtitle">
                <TextField value={pack.sub} maxLength={40} onChange={(v) => update((d) => { d.packs[key].sub = v; })} />
              </Row>
              <Row label="Emoji">
                <TextField value={pack.emoji} maxLength={8} onChange={(v) => update((d) => { d.packs[key].emoji = v; })} />
              </Row>
              <Row label="CTA label">
                <TextField value={pack.cta} maxLength={40} onChange={(v) => update((d) => { d.packs[key].cta = v; })} />
              </Row>
              <Row label="Plan suffix" hint="Jaise “Plan” / “Access”">
                <TextField value={pack.suffix} maxLength={20} onChange={(v) => update((d) => { d.packs[key].suffix = v; })} />
              </Row>
              <SwitchRow label="Crown badge" hint="“CROWN PICK” dikhta hai" checked={pack.crown} onChange={(v) => update((d) => { d.packs[key].crown = v; })} />
              <SwitchRow label="Pack live" hint="Off = site par nahi dikhega" checked={pack.active} onChange={(v) => update((d) => { d.packs[key].active = v; })} />
            </div>

            <div className="studio-card">
              {pack.plans.map((plan, i) => {
                const decision = resolvePayment(plan);
                return (
                  <div className="plan-row" key={plan.id}>
                    <div className="plan-head">
                      <TextField
                        value={plan.name}
                        maxLength={32}
                        onChange={(v) => update((d) => { d.packs[key].plans[i].name = v; })}
                        placeholder="1 Month"
                      />
                      <TextField
                        value={plan.razorpayButtonId}
                        maxLength={40}
                        onChange={(v) => update((d) => { d.packs[key].plans[i].razorpayButtonId = v.trim(); })}
                        placeholder="pl_xxxxxxxx (khali = UPI)"
                      />
                    </div>

                    <TextField
                      type="number"
                      value={String(plan.price)}
                      onChange={(v) => update((d) => { d.packs[key].plans[i].price = Math.max(0, Math.round(Number(v) || 0)); })}
                    />

                    <div className="plan-head">
                      <div className="st-inline">
                        <div style={{ flex: "0 0 108px" }}>
                          <TextField
                            type="number"
                            value={plan.razorpayAmount == null ? "" : String(plan.razorpayAmount)}
                            onChange={(v) =>
                              update((d) => {
                                d.packs[key].plans[i].razorpayAmount = v === "" ? null : Math.max(0, Math.round(Number(v) || 0));
                              })
                            }
                            placeholder="Button ₹"
                          />
                        </div>
                        <div style={{ flex: "1 1 130px" }}>
                          <Select<PayMode>
                            value={plan.payMode}
                            options={PAY_MODE_OPTIONS}
                            onChange={(v) => update((d) => { d.packs[key].plans[i].payMode = v; })}
                            label={`${plan.name} payment mode`}
                          />
                        </div>
                      </div>
                      <div className="plan-flags">
                        <button type="button" className="plan-mini" aria-pressed={plan.active} onClick={() => update((d) => { d.packs[key].plans[i].active = !plan.active; })}>
                          {plan.active ? "● Live" : "○ Hidden"}
                        </button>
                        <button type="button" className="plan-mini" aria-pressed={plan.soldOut} onClick={() => update((d) => { d.packs[key].plans[i].soldOut = !plan.soldOut; })}>
                          Sold out
                        </button>
                        <button type="button" className="plan-mini" aria-pressed={plan.featured} onClick={() => update((d) => { d.packs[key].plans[i].featured = !plan.featured; })}>
                          Featured
                        </button>
                        <button
                          type="button"
                          className="plan-mini"
                          aria-label={`Remove ${plan.name}`}
                          onClick={() => update((d) => { d.packs[key].plans.splice(i, 1); })}
                          disabled={pack.plans.length <= 1}
                        >
                          ✕
                        </button>
                      </div>
                      {decision.mismatch ? (
                        <div className="warn-inline" style={{ marginTop: 2 }}>
                          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                          <span>
                            Button ₹{plan.razorpayAmount} charge karega, price ₹{plan.price} hai — is plan par UPI {`>`} Razorpay
                            jayega. Button amount update karo ya ID hata do.
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {pack.plans.length < 6 ? (
                <div className="studio-row">
                  <div className="sr-body">
                    <button
                      type="button"
                      className="st-btn"
                      onClick={() =>
                        update((d) => {
                          const list = d.packs[key].plans;
                          list.push({
                            id: `${key}-${list.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
                            name: `${list.length + 1} Month`,
                            price: 100,
                            razorpayButtonId: "",
                            razorpayAmount: null,
                            payMode: "auto",
                            active: true,
                            soldOut: false,
                            featured: false
                          });
                        })
                      }
                    >
                      <i className="fa-solid fa-plus" aria-hidden="true" /> Add plan
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── INFO & FAQ ─────────────────────────── */

const FAQ_CAT_OPTIONS: { value: FaqCat; label: string }[] = [
  { value: "pricing", label: "Pricing" },
  { value: "payment", label: "Payment" },
  { value: "access", label: "Access" },
  { value: "support", label: "Support" },
  { value: "policy", label: "Policy" }
];

const INFO_ICONS = [
  { value: "tag", label: "🏷 Tag" },
  { value: "layer-group", label: "📚 Layers" },
  { value: "clapperboard", label: "🎬 Clapper" },
  { value: "bolt", label: "⚡ Bolt" },
  { value: "shield-halved", label: "🛡 Shield" },
  { value: "headset", label: "🎧 Headset" },
  { value: "wallet", label: "💳 Wallet" },
  { value: "lock", label: "🔒 Lock" }
];

export function InfoPane({ draft, update }: PaneProps) {
  return (
    <div className="studio-pane">
      <div className="studio-h2">INFO PAGE</div>
      <div className="studio-card">
        <TriField label="Page title" value={draft.info.title} maxLength={120} onChange={(v) => update((d) => { d.info.title = v; })} />
        <TriField label="Intro paragraph" multiline maxLength={900} value={draft.info.intro} onChange={(v) => update((d) => { d.info.intro = v; })} />
        <TriField label="Value section title" maxLength={80} value={draft.info.valueTitle} onChange={(v) => update((d) => { d.info.valueTitle = v; })} />
      </div>

      <div className="studio-h2">WHY IT'S AFFORDABLE · POINTS</div>
      {draft.info.points.map((point: InfoPoint, i) => (
        <div className="studio-card" key={i}>
          <Row label={`Point ${i + 1}`}>
            <div className="st-inline">
              <div style={{ flex: "0 0 140px" }}>
                <Select
                  value={point.icon}
                  options={INFO_ICONS}
                  onChange={(v) => update((d) => { d.info.points[i].icon = v; })}
                  label={`Point ${i + 1} icon`}
                />
              </div>
              <button
                type="button"
                className="st-btn tiny danger"
                onClick={() => update((d) => { d.info.points.splice(i, 1); })}
                style={{ marginLeft: "auto" }}
              >
                Remove
              </button>
            </div>
          </Row>
          <TriField label="Heading" value={point.title} maxLength={90} onChange={(v) => update((d) => { d.info.points[i].title = v; })} />
          <TriField label="Description" multiline maxLength={500} value={point.desc} onChange={(v) => update((d) => { d.info.points[i].desc = v; })} />
        </div>
      ))}
      <button
        type="button"
        className="st-btn"
        style={{ marginBottom: 8 }}
        onClick={() =>
          update((d) => {
            if (d.info.points.length >= 8) return;
            d.info.points.push({ icon: "star", title: { en: "", hinglish: "", hi: "" }, desc: { en: "", hinglish: "", hi: "" } });
          })
        }
      >
        <i className="fa-solid fa-plus" aria-hidden="true" /> Add point
      </button>

      <div className="studio-h2">HOW IT WORKS</div>
      <div className="studio-card">
        <TriField label="Section title" value={draft.info.howTitle} maxLength={80} onChange={(v) => update((d) => { d.info.howTitle = v; })} />
      </div>
      {draft.info.howItWorks.map((step, i) => (
        <div className="studio-card" key={i}>
          <TriField label={`Step ${i + 1} title`} value={step.title} maxLength={80} onChange={(v) => update((d) => { d.info.howItWorks[i].title = v; })} />
          <TriField label={`Step ${i + 1} text`} multiline maxLength={300} value={step.desc} onChange={(v) => update((d) => { d.info.howItWorks[i].desc = v; })} />
        </div>
      ))}

      <div className="studio-h2">POLICIES</div>
      <div className="studio-card">
        <TriField label="Section title" value={draft.info.policyTitle} maxLength={80} onChange={(v) => update((d) => { d.info.policyTitle = v; })} />
      </div>
      {draft.info.policies.map((policy, i) => (
        <div className="studio-card" key={i}>
          <TriField label={`Policy ${i + 1} title`} value={policy.title} maxLength={80} onChange={(v) => update((d) => { d.info.policies[i].title = v; })} />
          <TriField label={`Policy ${i + 1} text`} multiline maxLength={500} value={policy.desc} onChange={(v) => update((d) => { d.info.policies[i].desc = v; })} />
        </div>
      ))}

      <div className="studio-card">
        <TriField label="Support note" multiline maxLength={300} value={draft.info.supportNote} onChange={(v) => update((d) => { d.info.supportNote = v; })} />
      </div>

      <div className="studio-h2">FAQ ({draft.faq.length})</div>
      {draft.faq.map((item: FaqItem, i) => (
        <div className="studio-card" key={item.id}>
          <Row label={`Q${i + 1}`}>
            <div className="st-inline">
              <div style={{ flex: "1 1 140px" }}>
                <Select<FaqCat>
                  value={item.cat}
                  options={FAQ_CAT_OPTIONS}
                  onChange={(v) => update((d) => { d.faq[i].cat = v; })}
                  label={`Question ${i + 1} category`}
                />
              </div>
              <button type="button" className="st-btn tiny" onClick={() => update((d) => { if (i > 0) { const [x] = d.faq.splice(i, 1); d.faq.splice(i - 1, 0, x); } })} aria-label="Move up">
                ↑
              </button>
              <button type="button" className="st-btn tiny" onClick={() => update((d) => { if (i < d.faq.length - 1) { const [x] = d.faq.splice(i, 1); d.faq.splice(i + 1, 0, x); } })} aria-label="Move down">
                ↓
              </button>
              <button type="button" className="st-btn tiny danger" onClick={() => update((d) => { d.faq.splice(i, 1); })}>
                Remove
              </button>
            </div>
          </Row>
          <Row label="Active">
            <div className="switch-row">
              <button type="button" role="switch" className="switch" aria-checked={item.active} aria-label={`FAQ ${i + 1} active`} onClick={() => update((d) => { d.faq[i].active = !item.active; })} />
            </div>
          </Row>
          <TriField label="Question" value={item.q} maxLength={160} onChange={(v) => update((d) => { d.faq[i].q = v; })} />
          <TriField label="Answer" multiline maxLength={900} value={item.a} onChange={(v) => update((d) => { d.faq[i].a = v; })} />
        </div>
      ))}
      <button
        type="button"
        className="st-btn"
        onClick={() =>
          update((d) => {
            if (d.faq.length >= 30) return;
            const id = `faq-${Date.now().toString(36)}`;
            d.faq.push({
              id,
              cat: "support",
              active: true,
              q: { en: "", hinglish: "", hi: "" },
              a: { en: "", hinglish: "", hi: "" }
            });
          })
        }
      >
        <i className="fa-solid fa-plus" aria-hidden="true" /> Add question
      </button>
    </div>
  );
}

/* ─────────────────────────── BACKUPS ─────────────────────────── */

export function BackupsPane({ draft, update }: PaneProps) {
  const { password } = useAuth();
  const { toast, confirm } = useToast();
  const { configured, revision, updatedAt, commitLive } = useConfig();

  const [revisions, setRevisions] = useState<RevisionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadHistory = async () => {
    if (!password) return;
    setLoading(true);
    const res = await fetchHistory(password);
    setLoading(false);
    if (res.ok) setRevisions(res.revisions);
    else toast(res.error || "History load nahi hui", "error");
  };

  useEffect(() => {
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRevision = async (id: number) => {
    setBusyId(id);
    const res = await fetchRevisionConfig(password, id);
    setBusyId(null);
    if (res.ok && res.data) {
      const { config: loaded } = normalize(res.data);
      update((d) => {
        Object.assign(d, loaded);
      });
      toast(`Rev ${id} draft mein load ho gayi`, "success");
    } else {
      toast(res.error || "Revision load fail", "error");
    }
  };

  const doRestore = async (id: number) => {
    const ok = await confirm({
      title: `Restore revision ${id}?`,
      message: "Ye revision dobara publish ho jayegi aur sabke liye live ho jayegi.",
      confirmLabel: "Restore & publish",
      danger: true
    });
    if (!ok) return;
    setBusyId(id);
    const res = await restoreRevision(password, id);
    setBusyId(null);
    if (res.ok && res.data) {
      commitLive(normalize(res.data).config);
      toast(`✅ Rev ${id} live ho gayi`, "success");
      void loadHistory();
    } else {
      toast(res.error || "Restore fail", "error");
    }
  };

  const doReset = async () => {
    const ok = await confirm({
      title: "Reset live config?",
      message: "Published config delete ho jayegi aur site code defaults par chali jayegi. Backup pehle export kar lo.",
      confirmLabel: "Reset live",
      danger: true
    });
    if (!ok) return;
    const res = await resetConfig(password);
    if (res.ok && res.data) {
      commitLive(normalize(res.data).config);
      toast("↩️ Code defaults live ho gaye", "success");
      void loadHistory();
    } else {
      toast(res.error || "Reset fail", "error");
    }
  };

  const importFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const { config, errors } = normalize(parsed);
      if (errors.length) {
        toast(`Import mein ${errors.length} galat field — theek karke dobara try karo`, "error");
        return;
      }
      update((d) => {
        Object.assign(d, config);
      });
      toast("📥 Import ho gaya — ab Publish dabao", "success");
    } catch {
      toast("File JSON valid nahi hai", "error");
    }
  };

  return (
    <div className="studio-pane">
      <div className="studio-card">
        <div className="studio-row">
          <div className="sr-label"><b>Current live</b><small>Jo abhi sabko dikh raha hai</small></div>
          <div className="sr-body">
            <div className="st-inline">
              <Chip tone={revision ? "live" : "off"}>REV {revision || "—"}</Chip>
              <span className="st-field-note">{updatedAt ? new Date(updatedAt).toLocaleString("en-IN") : "Code defaults"}</span>
              {!configured ? <Chip tone="err">KV OFF</Chip> : null}
            </div>
          </div>
        </div>
        <div className="studio-row">
          <div className="sr-label"><b>Export</b><small>Poora config JSON</small></div>
          <div className="sr-body">
            <button type="button" className="st-btn" onClick={() => { downloadJson(draft, `timepass-config-rev${draft.revision || 0}.json`); toast("Export download ho gaya", "success"); }}>
              <i className="fa-solid fa-download" aria-hidden="true" /> Export JSON
            </button>
          </div>
        </div>
        <div className="studio-row">
          <div className="sr-label"><b>Import</b><small>Validated JSON draft mein load hota hai</small></div>
          <div className="sr-body">
            <input
              type="file"
              accept="application/json,.json"
              className="st-input"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                if (file) void importFile(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </div>

      <div className="studio-h2">REVISIONS (LAST 20)</div>
      <div className="studio-card">
        {loading ? (
          <div className="studio-row"><div className="sr-body"><span className="st-field-note">Loading…</span></div></div>
        ) : revisions.length ? (
          <div className="rev-list">
            {revisions.map((rev) => (
              <div className="rev-item" key={rev.id}>
                <span className="rev-id">{rev.id}</span>
                <div className="rev-main">
                  <b>{new Date(rev.at).toLocaleString("en-IN")}</b>
                  <small>
                    {rev.source === "restore" ? `restored from #${rev.restoredFrom} · ` : ""}
                    {rev.sections.length ? rev.sections.join(", ") : "no section change"}
                    {rev.prices.length ? ` · ${rev.prices.join(" · ")}` : ""}
                  </small>
                </div>
                <div className="rev-actions">
                  <button type="button" className="st-btn tiny" disabled={busyId === rev.id} onClick={() => void loadRevision(rev.id)}>
                    Load
                  </button>
                  <button type="button" className="st-btn tiny" disabled={busyId === rev.id} onClick={() => void doRestore(rev.id)}>
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="studio-row"><div className="sr-body"><span className="st-field-note">Abhi koi revision nahi (pehli publish ke baad dikhegi).</span></div></div>
        )}
      </div>

      <div className="studio-h2">DANGER ZONE</div>
      <div className="studio-card">
        <div className="studio-row">
          <div className="sr-label"><b>Reset live config</b><small>Code defaults par wapas</small></div>
          <div className="sr-body">
            <button type="button" className="st-btn danger" onClick={() => void doReset()}>
              <i className="fa-solid fa-rotate-left" aria-hidden="true" /> Reset live
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { Config };
