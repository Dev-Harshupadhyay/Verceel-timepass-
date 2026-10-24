import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "@/state/ThemeProvider";
import { ToastProvider } from "@/state/ToastProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { THEMES } from "@/config";
import { mockFetchConfig, Providers, flush } from "./_utils";

function Harness() {
  const { theme } = useTheme();
  return (
    <div>
      <ThemeToggle />
      <span data-testid="theme">{theme}</span>
    </div>
  );
}

function renderTheme() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <Harness />
      </ToastProvider>
    </ThemeProvider>
  );
}

describe("theme system", () => {
  it("defaults a fresh visitor to Obsidian Gold (today's design)", () => {
    mockFetchConfig(null);
    renderTheme();
    expect(document.documentElement.getAttribute("data-theme")).toBe("obsidian");
    expect(screen.getByTestId("theme").textContent).toBe("obsidian");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("toggle switches gold -> pearl light -> gold", async () => {
    mockFetchConfig(null);
    const user = userEvent.setup();
    renderTheme();
    await user.click(screen.getByTestId("theme-toggle"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("pearl");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(localStorage.getItem("tp_theme")).toBe("pearl");

    await user.click(screen.getByTestId("theme-toggle"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("obsidian");
    expect(localStorage.getItem("tp_theme")).toBe("obsidian");
  });

  it("toggle is an accessible pressed button", async () => {
    mockFetchConfig(null);
    const user = userEvent.setup();
    renderTheme();
    const btn = screen.getByTestId("theme-toggle");
    expect(btn.getAttribute("aria-pressed")).toBe("true"); // gold is dark
    await user.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(btn.getAttribute("aria-label")).toMatch(/dark/i);
  });

  it("restores the saved choice on reload", async () => {
    localStorage.setItem("tp_theme", "violet-dark");
    mockFetchConfig(null);
    renderTheme();
    await flush();
    expect(document.documentElement.getAttribute("data-theme")).toBe("violet-dark");
  });

  it("falls back to Obsidian Gold for a corrupt saved value", () => {
    localStorage.setItem("tp_theme", "not-a-theme");
    mockFetchConfig(null);
    renderTheme();
    expect(document.documentElement.getAttribute("data-theme")).toBe("obsidian");
  });

  it("maps a removed 'apple-light' saved value to gold", async () => {
    localStorage.setItem("tp_theme", "apple-light");
    mockFetchConfig(null);
    renderTheme();
    await flush();
    expect(document.documentElement.getAttribute("data-theme")).toBe("obsidian");
  });

  it("keeps all original six themes plus violet-dark, and drops apple-light", () => {
    const ids = THEMES.map((t) => t.id);
    expect(ids).toEqual(["obsidian", "pearl", "violet-dark", "amethyst", "cyber", "crimson", "emerald"]);
    expect(ids).not.toContain("apple-light");
  });

  it("updates meta theme-color with the active theme", async () => {
    const meta = document.createElement("meta");
    meta.id = "themeColorMeta";
    meta.setAttribute("content", "#ffffff");
    document.head.appendChild(meta);

    mockFetchConfig(null);
    const user = userEvent.setup();
    renderTheme();
    await user.click(screen.getByTestId("theme-toggle"));
    expect(meta.getAttribute("content")).toBe("#f7f4ed");
    await user.click(screen.getByTestId("theme-toggle"));
    expect(meta.getAttribute("content")).toBe("#07060a");
    meta.remove();
  });

  it("respects the admin global default for first-time visitors", async () => {
    const { DEFAULT_CONFIG } = await import("@/config");
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.appearance.defaultTheme = "violet-dark";
    mockFetchConfig(cfg);
    render(
      <Providers>
        <Harness />
      </Providers>
    );
    await flush();
    await flush();
    expect(document.documentElement.getAttribute("data-theme")).toBe("violet-dark");
  });

  it("never overrides an explicit visitor choice with the global default", async () => {
    localStorage.setItem("tp_theme", "emerald");
    const { DEFAULT_CONFIG } = await import("@/config");
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cfg.appearance.defaultTheme = "obsidian";
    mockFetchConfig(cfg);
    render(
      <Providers>
        <Harness />
      </Providers>
    );
    await flush();
    expect(screen.getByTestId("theme").textContent).toBe("emerald");
  });
});
