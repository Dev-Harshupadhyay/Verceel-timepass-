import type { ReactNode } from "react";
import { act, render } from "@testing-library/react";
import { vi } from "vitest";
import { ThemeProvider } from "@/state/ThemeProvider";
import { ToastProvider } from "@/state/ToastProvider";
import { ConfigProvider } from "@/state/ConfigProvider";
import { LangProvider } from "@/state/LangProvider";
import { AuthProvider } from "@/state/AuthProvider";
import type { Config } from "@/types";

export function mockFetchConfig(data: Config | null = null, configured = true) {
  const fn = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/api/pricing")) {
      return new Response(
        JSON.stringify({ ok: true, configured, data, revision: data?.revision ?? 0, updatedAt: data?.updatedAt ?? null }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfigProvider>
          <LangProvider>
            <AuthProvider>{children}</AuthProvider>
          </LangProvider>
        </ConfigProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export function renderWithProviders(ui: ReactNode) {
  return render(<Providers>{ui}</Providers>);
}

export async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}
