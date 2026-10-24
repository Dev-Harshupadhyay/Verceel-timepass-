import { useEffect, useState } from "react";

export function navigate(path: string, opts: { replace?: boolean; keepScroll?: boolean } = {}): void {
  const current = window.location.pathname + window.location.search;
  if (current === path) return;
  try {
    if (opts.replace) window.history.replaceState({}, "", path);
    else window.history.pushState({}, "", path);
  } catch {
    window.location.href = path;
    return;
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
  if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: "auto" });
}

export function usePath(): string {
  const [path, setPath] = useState<string>(() =>
    typeof window === "undefined" ? "/" : window.location.pathname || "/"
  );
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return path;
}

export interface Route {
  name: "home" | "buy" | "info" | "faq" | "studio";
  pack?: string;
}

export function parseRoute(path: string): Route {
  const clean = (path || "/").replace(/\/+$/, "") || "/";
  if (clean === "/studio" || clean.startsWith("/studio/")) return { name: "studio" };
  if (clean === "/info") return { name: "info" };
  if (clean === "/faq") return { name: "faq" };
  const buy = /^\/buy\/([a-z]+)$/.exec(clean);
  if (buy) return { name: "buy", pack: buy[1] };
  return { name: "home" };
}
