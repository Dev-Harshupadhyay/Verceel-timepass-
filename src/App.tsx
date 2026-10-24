import { useCallback, useEffect, useState } from "react";
import { usePath, parseRoute, navigate } from "@/lib/router";
import { Header } from "@/components/Header";
import { Announcement } from "@/components/Announcement";
import { Drawer } from "@/components/Drawer";
import { ThemeModal, TelegramModal } from "@/components/Modals";
import { Home } from "@/pages/Home";
import { BuyPage } from "@/pages/Buy";
import { InfoPage } from "@/pages/Info";
import { FaqPage } from "@/pages/Faq";
import { Studio } from "@/studio/Studio";
import { useConfig } from "@/state/ConfigProvider";
import { useToast } from "@/state/ToastProvider";
import { notify, block, line } from "@/lib/notify";
import { trackVisit } from "@/lib/visits";
import { BrandLogo } from "@/components/BrandLogo";

export default function App() {
  const path = usePath();
  const route = parseRoute(path);

  if (route.name === "studio") return <Studio />;

  return <Site route={route.name} pack={route.pack} />;
}

function Site({ route, pack }: { route: "home" | "buy" | "info" | "faq"; pack?: string }) {
  const { config, previewing, clearPreview } = useConfig();
  const { toast } = useToast();
  const [drawer, setDrawer] = useState(false);
  const [themeModal, setThemeModal] = useState(false);
  const [telegram, setTelegram] = useState(false);

  /* one visit log per browser tab session (same as before) */
  useEffect(() => {
    const key = "tp_session_tracked";
    let seen = false;
    try {
      seen = sessionStorage.getItem(key) === "1";
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    if (!seen) void trackVisit();
  }, []);

  /* the original site showed the Telegram notice on load and auto-closed it */
  useEffect(() => {
    if (route !== "home") return;
    let seen = false;
    try {
      seen = sessionStorage.getItem("tp_tg_seen") === "1";
      sessionStorage.setItem("tp_tg_seen", "1");
    } catch {
      /* ignore */
    }
    if (seen) return;
    const show = window.setTimeout(() => setTelegram(true), 1100);
    const hide = window.setTimeout(() => setTelegram(false), 5400);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [route]);

  const onInfo = useCallback(() => {
    if (route === "buy" || route === "info" || route === "faq") navigate("/");
    else navigate("/info");
  }, [route]);

  const onTrack = useCallback(() => {
    const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    void notify(block("🚩 ADMIN LOGIN TRIGGERED", [line("Action", "Harsh Bhai accessed the portal"), line("Time", time)]));
    toast(`🚩 Jai Shree Ram, ${config.brand.devName} Bhai!`, "success");
  }, [config.brand.devName, toast]);

  return (
    <>
      <div className="amb" aria-hidden="true" />
      {config.announcement.enabled && route !== "buy" ? <Announcement /> : null}

      <Header
        mode={route}
        onInfo={onInfo}
        onTheme={() => setThemeModal(true)}
        onAdmin={() => navigate("/studio")}
        onMenu={() => setDrawer(true)}
      />

      <main>
        {route === "home" ? <Home onTrack={onTrack} /> : null}
        {route === "buy" ? <BuyPage packKey={pack || "movies"} /> : null}
        {route === "info" ? <InfoPage /> : null}
        {route === "faq" ? <FaqPage /> : null}
      </main>

      <Drawer open={drawer} onClose={() => setDrawer(false)} onThemeOpen={() => { setDrawer(false); setThemeModal(true); }} />
      <ThemeModal open={themeModal} onClose={() => setThemeModal(false)} />
      <TelegramModal open={telegram} onClose={() => setTelegram(false)} />

      {previewing ? (
        <div className="preview-bar" role="status">
          <span className="pb-dot" aria-hidden="true" />
          <span>
            <b>PREVIEW</b> — sirf is device par dikh raha hai
          </span>
          <button
            type="button"
            className="st-btn tiny"
            onClick={() => {
              clearPreview();
              navigate("/studio");
            }}
          >
            Exit preview
          </button>
        </div>
      ) : null}

      <div className="app-brandmark" aria-hidden="true">
        <BrandLogo size={16} />
      </div>
    </>
  );
}
