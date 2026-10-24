import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/state/AuthProvider";
import { useConfig } from "@/state/ConfigProvider";
import { useToast } from "@/state/ToastProvider";
import { navigate } from "@/lib/router";
import { normalize, summarizeChanges, THEMES } from "@/config";
import { publishConfig } from "@/lib/api";
import { storage, KEYS } from "@/lib/storage";
import { downloadJson } from "@/lib/download";
import { BrandLogo } from "@/components/BrandLogo";
import { Chip } from "./fields";
import { OverviewPane, ContentPane, LinksPane, AnnouncementPane, AppearancePane, VisitorsPane } from "./panes";
import { PlansPane, InfoPane, BackupsPane } from "./panes2";
import type { Config, ValidationError } from "@/types";

const TABS = [
  { id: "overview", label: "Overview", icon: "fa-gauge-high" },
  { id: "content", label: "Content", icon: "fa-font" },
  { id: "plans", label: "Plans", icon: "fa-indian-rupee-sign" },
  { id: "links", label: "Links & Images", icon: "fa-link" },
  { id: "announcement", label: "Announcement", icon: "fa-bullhorn" },
  { id: "info", label: "Info & FAQ", icon: "fa-circle-info" },
  { id: "appearance", label: "Appearance", icon: "fa-palette" },
  { id: "backups", label: "Backups", icon: "fa-clock-rotate-left" },
  { id: "visitors", label: "Visitors", icon: "fa-users" }
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Studio() {
  const { authed } = useAuth();
  return authed ? <StudioShell /> : <LoginGate />;
}

/* ─────────────────────────── GATE ─────────────────────────── */

function LoginGate() {
  const { login, busy, error } = useAuth();
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(value);
  };

  return (
    <div className="studio-gate">
      <div className="gate-card">
        <BrandLogo size={54} className="gate-logo" />
        <h1>Live Website Studio</h1>
        <p>Password daal ke apni site live edit karo — bina redeploy.</p>
        <form className="gate-form" onSubmit={submit}>
          <div style={{ position: "relative" }}>
            <input
              className="st-input"
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Admin password"
              autoComplete="current-password"
              autoFocus
              style={{ textAlign: "center", letterSpacing: 2, paddingRight: 42 }}
              aria-label="Admin password"
            />
            <button
              type="button"
              className="pw-eye"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)" }}
            >
              <i className={`fa-solid ${show ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
            </button>
          </div>
          <div className="gate-err" role="alert">
            {error || ""}
          </div>
          <button type="submit" className="st-btn primary block" disabled={busy}>
            {busy ? "VERIFYING…" : "UNLOCK STUDIO"}
          </button>
        </form>
        <div className="gate-foot">
          Password server-side <code>ADMIN_PASSWORD</code> se check hota hai.
          <br />
          <button type="button" className="page-back" style={{ marginTop: 8 }} onClick={() => navigate("/")}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to site
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── SHELL ─────────────────────────── */

function StudioShell() {
  const { config, commitLive, configured, revision, updatedAt, applyPreview } = useConfig();
  const { password, logout } = useAuth();
  const { toast, confirm } = useToast();

  const savedDraft = useRef<Config | null>(null);
  const [draft, setDraft] = useState<Config>(() => {
    const raw = storage.getJSON<unknown>(KEYS.draft);
    if (raw) {
      const { config: parsed, errors } = normalize(raw);
      if (!errors.length) {
        savedDraft.current = parsed;
        return parsed;
      }
    }
    return config;
  });
  const [touched, setTouched] = useState<boolean>(() => !!savedDraft.current);
  const [tab, setTab] = useState<TabId>(() => {
    const saved = storage.get(KEYS.adminTab);
    return (TABS.some((t) => t.id === saved) ? saved : "overview") as TabId;
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [lastPublish, setLastPublish] = useState<{ revision: number; at: string } | null>(null);

  /* first paint: adopt live config until the admin edits something */
  useEffect(() => {
    if (!touched && !savedDraft.current) setDraft(config);
  }, [config, touched]);

  /* autosave draft — a refresh never loses work */
  useEffect(() => {
    if (!touched) return;
    const timer = window.setTimeout(() => storage.setJSON(KEYS.draft, draft), 500);
    return () => window.clearTimeout(timer);
  }, [draft, touched]);

  useEffect(() => {
    storage.set(KEYS.adminTab, tab);
  }, [tab]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(config), [draft, config]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const update = useCallback((fn: (d: Config) => void) => {
    setDraft((prev) => {
      const next: Config = JSON.parse(JSON.stringify(prev));
      fn(next);
      return next;
    });
    setTouched(true);
  }, []);

  const discard = async () => {
    if (dirty) {
      const ok = await confirm({ title: "Discard changes?", message: "Draft delete ho jayega aur live config wapas aa jayegi.", confirmLabel: "Discard", danger: true });
      if (!ok) return;
    }
    storage.remove(KEYS.draft);
    savedDraft.current = null;
    setTouched(false);
    setDraft(config);
    setErrors([]);
    toast("Draft discarded", "default");
  };

  const preview = () => {
    const { config: normalized, errors: errs } = normalize(draft);
    if (errs.length) {
      setErrors(errs);
      toast(`${errs.length} fields galat hain`, "error");
      return;
    }
    applyPreview(normalized);
    navigate("/");
    toast("👁️ Preview on — sirf is device par", "success");
  };

  const publish = async () => {
    const { config: normalized, errors: errs } = normalize(draft);
    if (errs.length) {
      setErrors(errs);
      toast(`${errs.length} fields galat hain — pehle theek karo`, "error");
      setTab("overview");
      return;
    }
    const diff = summarizeChanges(config, normalized);
    const summaryLine = [
      diff.sections.length ? `Sections: ${diff.sections.join(", ")}` : "Koi section change nahi",
      diff.prices.length ? `Price: ${diff.prices.join(" · ")}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    const ok = await confirm({
      title: "Publish live?",
      message: `${summaryLine}\n\nPublish hote hi ye sab visitors ko dikhega.`,
      confirmLabel: "Publish now"
    });
    if (!ok) return;

    setPublishing(true);
    setErrors([]);
    const res = await publishConfig(password, normalized);
    setPublishing(false);

    if (res.ok && res.data) {
      const live = normalize(res.data).config;
      commitLive(live);
      setDraft(live);
      setTouched(false);
      savedDraft.current = null;
      storage.remove(KEYS.draft);
      setLastPublish({ revision: live.revision, at: live.updatedAt || new Date().toISOString() });
      toast(`✅ LIVE FOR EVERYONE · rev ${live.revision}`, "success");
      return;
    }

    if (res.details && res.details.length) setErrors(res.details);
    const msg =
      res.status === 501
        ? "KV storage configured nahi — README ke setup steps dekho"
        : res.status === 401
          ? "Session expire ho gayi — dobara login karo"
          : res.error || "Publish fail ho gaya";
    toast(`❌ ${msg}`, "error");
  };

  const Pane = (() => {
    const props = { draft, update };
    switch (tab) {
      case "content":
        return <ContentPane {...props} />;
      case "plans":
        return <PlansPane {...props} />;
      case "links":
        return <LinksPane {...props} />;
      case "announcement":
        return <AnnouncementPane {...props} />;
      case "info":
        return <InfoPane {...props} />;
      case "appearance":
        return <AppearancePane {...props} />;
      case "backups":
        return <BackupsPane {...props} />;
      case "visitors":
        return <VisitorsPane {...props} />;
      default:
        return <OverviewPane {...props} />;
    }
  })();

  const themeName = THEMES.find((t) => t.id === draft.appearance.defaultTheme)?.name || "—";

  return (
    <div className="studio-overlay">
      <div className="studio-shell">
        <aside className="studio-side">
          <div className="studio-brand">
            <BrandLogo size={26} />
            <div>
              <b>Live Studio</b>
              <small>CONTENT · NO REDEPLOY</small>
            </div>
          </div>

          <nav className="studio-nav" aria-label="Studio sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className="studio-nav-btn"
                aria-current={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                <i className={`fa-solid ${t.icon}`} aria-hidden="true" />
                {t.label}
                {t.id === "overview" && errors.length ? <span className="nav-dot" /> : null}
              </button>
            ))}
          </nav>

          <div className="studio-side-foot">
            <button type="button" className="studio-nav-btn" onClick={() => navigate("/")}>
              <i className="fa-solid fa-up-right-from-square" aria-hidden="true" /> View site
            </button>
            <button type="button" className="studio-nav-btn" onClick={() => { logout(); navigate("/"); }}>
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> Logout
            </button>
          </div>
        </aside>

        <div className="studio-main">
          <div className="studio-topbar">
            <div>
              <h1>{TABS.find((t) => t.id === tab)?.label}</h1>
              <div className="st-sub">LIVE WEBSITE STUDIO</div>
            </div>
            <div className="st-actions">
              {lastPublish ? <Chip tone="live">LIVE · REV {lastPublish.revision}</Chip> : null}
              <Chip tone={configured ? "live" : "off"}>{configured ? "KV READY" : "KV OFF"}</Chip>
              <button type="button" className="st-btn tiny" onClick={() => setTab("backups")}>
                Rev {revision || "—"}
              </button>
            </div>
          </div>

          <div className="studio-body">
            <div className="studio-wrap">
              {errors.length ? (
                <div className="studio-card" style={{ borderColor: "rgba(229,83,61,.45)" }}>
                  <div className="studio-row stack">
                    <div className="sr-label"><b style={{ color: "#e5533d" }}>Validation</b><small>{errors.length} fields theek karne hain</small></div>
                    <div className="sr-body">
                      {errors.slice(0, 8).map((e, i) => (
                        <div className="warn-inline" key={i}>
                          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                          <span><b>{e.path}</b> — {e.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {Pane}

              <div className="save-bar">
                <div className="sb-info">
                  <b>{dirty ? "Unsaved changes" : lastPublish ? "Published" : "Synced with live"}</b>
                  Rev {revision || 0} · {updatedAt ? new Date(updatedAt).toLocaleString("en-IN") : "code defaults"} · default theme: {themeName}
                </div>
                <div className="sb-actions">
                  <button type="button" className="st-btn" onClick={() => downloadJson(draft, "timepass-config.json")}>
                    <i className="fa-solid fa-download" aria-hidden="true" /> Export
                  </button>
                  <button type="button" className="st-btn" onClick={preview}>
                    <i className="fa-solid fa-eye" aria-hidden="true" /> Preview
                  </button>
                  <button type="button" className="st-btn" onClick={() => void discard()} disabled={!dirty}>
                    Discard
                  </button>
                  <button type="button" className="st-btn primary" onClick={() => void publish()} disabled={publishing || !dirty}>
                    {publishing ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" /> PUBLISHING…
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" /> PUBLISH LIVE
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
