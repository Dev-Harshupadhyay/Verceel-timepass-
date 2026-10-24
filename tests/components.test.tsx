import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PricingCards } from "@/components/PricingCards";
import { FaqAccordion } from "@/components/Faq";
import { Announcement } from "@/components/Announcement";
import { Drawer } from "@/components/Drawer";
import { DEFAULT_CONFIG } from "@/config";
import { LangSwitch } from "@/state/LangProvider";
import { mockFetchConfig, renderWithProviders, flush } from "./_utils";
import type { Config } from "@/types";

function cfg(): Config {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

describe("pricing cards", () => {
  it("renders every pack with its original prices", async () => {
    mockFetchConfig(cfg());
    renderWithProviders(<PricingCards onBuy={() => {}} />);
    await flush();
    expect(await screen.findByText("Movies & Series")).toBeTruthy();
    expect(screen.getByText("Adult Pack")).toBeTruthy();
    expect(screen.getByText("Combo Pack")).toBeTruthy();

    expect(screen.getByText("1 Month Plan")).toBeTruthy();
    expect(screen.getAllByText("₹50").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹1500").length).toBeGreaterThan(0);
  });

  it("hides an inactive plan but keeps the others", async () => {
    const c = cfg();
    c.packs.movies.plans[1].active = false; // 3 Months
    mockFetchConfig(c);
    renderWithProviders(<PricingCards onBuy={() => {}} />);
    await flush();
    await screen.findByText("Movies & Series");
    expect(screen.queryByText("3 Months Plan")).toBeNull();
    expect(screen.getByText("6 Months Plan")).toBeTruthy();
  });

  it("hides a whole pack when it is switched off", async () => {
    const c = cfg();
    c.packs.adult.active = false;
    mockFetchConfig(c);
    renderWithProviders(<PricingCards onBuy={() => {}} />);
    await flush();
    await screen.findByText("Movies & Series");
    expect(screen.queryByText("Adult Pack")).toBeNull();
  });

  it("marks sold out plans", async () => {
    const c = cfg();
    c.packs.combo.plans[0].soldOut = true;
    mockFetchConfig(c);
    renderWithProviders(<PricingCards onBuy={() => {}} />);
    await flush();
    expect(await screen.findByText(/1 Month Combo · SOLD OUT/)).toBeTruthy();
  });

  it("shows the crown badge only on the crown pack", async () => {
    mockFetchConfig(cfg());
    renderWithProviders(<PricingCards onBuy={() => {}} />);
    await flush();
    expect(await screen.findByText("★ CROWN PICK")).toBeTruthy();
  });

  it("uses the config CTA label", async () => {
    const c = cfg();
    c.packs.movies.cta = "GET MOVIES";
    mockFetchConfig(c);
    renderWithProviders(<PricingCards onBuy={() => {}} />);
    await flush();
    expect(await screen.findByText("GET MOVIES")).toBeTruthy();
  });
});

describe("FAQ", () => {
  it("opens and closes an answer", async () => {
    mockFetchConfig(cfg());
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <LangSwitch />
        <FaqAccordion items={cfg().faq.slice(0, 3)} />
      </>
    );
    await user.click(screen.getByRole("button", { name: "English" }));

    const first = screen.getByRole("button", { name: /cheaper than OTT/i });
    expect(first.getAttribute("aria-expanded")).toBe("false");
    await user.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(/You pay once for one pack/i)).toBeTruthy();
    await user.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("false");
  });

  it("renders Hinglish and Hindi copy when the language changes", async () => {
    mockFetchConfig(cfg());
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <LangSwitch />
        <FaqAccordion items={cfg().faq.slice(0, 2)} />
      </>
    );

    expect(screen.getByText(/OTT subscriptions se sasta kaise/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "हिन्दी" }));
    expect(screen.getByText(/OTT सब्सक्रिप्शन से सस्ता कैसे/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByText(/cheaper than OTT subscriptions/i)).toBeTruthy();
  });

  it("never renders injected markup", async () => {
    const c = cfg();
    c.faq[0].q = { en: '<img src=x onerror="alert(1)">Injected?', hinglish: "Injected?", hi: "Injected?" };
    mockFetchConfig(c);
    renderWithProviders(<FaqAccordion items={c.faq.slice(0, 1)} />);
    const btn = await screen.findByRole("button", { name: /Injected/ });
    expect(btn.querySelector("img")).toBeNull();
  });
});

describe("announcement", () => {
  it("stays hidden until enabled", async () => {
    mockFetchConfig(cfg());
    renderWithProviders(<Announcement />);
    await flush();
    expect(screen.queryByTestId("announcement")).toBeNull();
  });

  it("renders the text, badge, CTA and shimmer class", async () => {
    const c = cfg();
    c.announcement = {
      ...c.announcement,
      enabled: true,
      text: "FLAT 40% OFF — 1 Year Combo ₹1500 → ₹900",
      badge: "LIMITED TIME",
      ctaLabel: "GRAB DEAL",
      ctaUrl: "/buy/combo",
      tone: "violet",
      animation: "shimmer"
    };
    mockFetchConfig(c);
    renderWithProviders(<Announcement />);
    const bar = await screen.findByTestId("announcement");
    expect(bar.className).toContain("tone-violet");
    expect(bar.className).toContain("anim-shimmer");
    expect(bar.textContent).toContain("FLAT 40% OFF");
    expect(screen.getByText("LIMITED TIME")).toBeTruthy();
    expect(screen.getByText("GRAB DEAL").getAttribute("href")).toBe("/buy/combo");
  });

  it("can be dismissed and stays dismissed for that revision", async () => {
    const c = cfg();
    c.announcement = { ...c.announcement, enabled: true, text: "Offer live", dismissible: true };
    mockFetchConfig(c);
    const user = userEvent.setup();
    renderWithProviders(<Announcement />);
    await screen.findByTestId("announcement");
    await user.click(screen.getByLabelText("Dismiss announcement"));
    await waitFor(() => expect(screen.queryByTestId("announcement")).toBeNull());
    expect(localStorage.getItem("tp_announce_dismissed")).toContain("Offer live");
  });

  it("hides an expired announcement", async () => {
    const c = cfg();
    c.announcement = { ...c.announcement, enabled: true, text: "Old offer", expiresAt: "2020-01-01T00:00:00.000Z" };
    mockFetchConfig(c);
    renderWithProviders(<Announcement />);
    await flush();
    expect(screen.queryByTestId("announcement")).toBeNull();
  });

  it("escapes user text", async () => {
    const c = cfg();
    c.announcement = { ...c.announcement, enabled: true, text: "<script>alert(1)</script> safe" };
    mockFetchConfig(c);
    renderWithProviders(<Announcement />);
    const bar = await screen.findByTestId("announcement");
    expect(bar.querySelector("script")).toBeNull();
  });
});

describe("harsh dev crown card (drawer)", () => {
  it("renders crown, name, quote, bio, stats, tags and both CTAs", async () => {
    mockFetchConfig(cfg());
    renderWithProviders(<Drawer open onClose={() => {}} onThemeOpen={() => {}} />);
    await flush();

    expect(screen.getAllByText(/MADE BY/i).length).toBeGreaterThan(0);
    // crown pill (emoji is stripped, crown icon + label remain)
    expect(screen.getByText("FOUNDER · CREATOR")).toBeTruthy();
    expect(screen.getAllByText(/Harsh/).length).toBeGreaterThan(0);
    expect(screen.getByText("@" + DEFAULT_CONFIG.brand.devHandle)).toBeTruthy();
    expect(screen.getByText("WEB DEVELOPER · UI DESIGNER")).toBeTruthy();
    expect(screen.getByText(/sab ek hi banda/)).toBeTruthy();
    expect(screen.getByText(DEFAULT_CONFIG.brand.devBio)).toBeTruthy();

    for (const tag of DEFAULT_CONFIG.brand.devTags) {
      expect(screen.getByText(tag)).toBeTruthy();
    }
    for (const st of DEFAULT_CONFIG.brand.devStats) {
      expect(screen.getAllByText(st.value).length).toBeGreaterThan(0);
    }

    const hire = screen.getByText(/HIRE \/ CONTACT/i).closest("a");
    expect(hire?.getAttribute("href")).toContain("t.me");
    expect(hire?.getAttribute("rel")).toContain("noopener");
    expect(screen.getByText(DEFAULT_CONFIG.brand.devPortfolioLabel)).toBeTruthy();
  });

  it("shows the live theme chips as pressed for the active theme", async () => {
    mockFetchConfig(cfg());
    renderWithProviders(<Drawer open onClose={() => {}} onThemeOpen={() => {}} />);
    await flush();
    const gold = screen.getByRole("button", { name: /OBSIDIAN GOLD/i });
    expect(gold.getAttribute("aria-pressed")).toBe("true");
    const pearl = screen.getByRole("button", { name: /PEARL LIGHT/i });
    expect(pearl.getAttribute("aria-pressed")).toBe("false");
  });

  it("uses a custom crown label + bio from the studio", async () => {
    const c = cfg();
    c.brand.devCrown = "👑 LEAD DEV";
    c.brand.devBio = "Custom bio line for the test.";
    mockFetchConfig(c);
    renderWithProviders(<Drawer open onClose={() => {}} onThemeOpen={() => {}} />);
    await flush();
    expect(screen.getByText("LEAD DEV")).toBeTruthy();
    expect(screen.getByText("Custom bio line for the test.")).toBeTruthy();
  });
});
