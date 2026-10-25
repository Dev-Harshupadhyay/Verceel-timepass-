import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BuyPage } from "@/pages/Buy";
import { LangSwitch } from "@/state/LangProvider";
import { Announcement } from "@/components/Announcement";
import { PriceCompare } from "@/components/PriceCompare";
import { DEFAULT_CONFIG } from "@/config";
import { detectDevice } from "@/lib/device";
import { resolvePayment } from "@/lib/payments";
import { mockFetchConfig, renderWithProviders, flush } from "./_utils";
import type { Config } from "@/types";

function cfg(): Config {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

/* ────────────────── device detection ────────────────── */

function setPointer({ coarse, width, touch }: { coarse: boolean; width: number; touch: boolean }) {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true, writable: true });
  Object.defineProperty(navigator, "maxTouchPoints", { value: touch ? 5 : 0, configurable: true });
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("pointer: coarse") ? coarse : false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      }) as unknown as MediaQueryList
  );
}

describe("device detection", () => {
  it("uses the QR flow for a mouse-only desktop", () => {
    setPointer({ coarse: false, width: 1440, touch: false });
    const d = detectDevice();
    expect(d.kind).toBe("desktop");
    expect(d.isDesktop).toBe(true);
    expect(d.payWithQr).toBe(true);
  });

  it("uses the UPI deep-link flow for a phone", () => {
    setPointer({ coarse: true, width: 390, touch: true });
    const d = detectDevice();
    expect(d.kind).toBe("mobile");
    expect(d.hasTouch).toBe(true);
    expect(d.payWithQr).toBe(false);
  });

  it("labels a touch tablet as a touch device (deep link, not QR)", () => {
    setPointer({ coarse: true, width: 834, touch: true });
    const d = detectDevice();
    expect(d.kind).toBe("tablet");
    expect(d.payWithQr).toBe(false);
  });
});

/* ────────────────── buy page: desktop vs mobile ────────────────── */

async function goToPayment(userEventSetup: ReturnType<typeof userEvent.setup>) {
  mockFetchConfig(cfg());
  renderWithProviders(<BuyPage packKey="movies" />);
  await flush();
  await screen.findByText("CHOOSE YOUR PLAN");
  await userEventSetup.click(screen.getByText("₹50"));
  await userEventSetup.click(screen.getAllByRole("button", { name: /PROCEED TO PAY/i })[0]);
  await flush();
}

describe("buy page payment surface", () => {
  it("desktop: shows the QR, amount chip, steps and UPI ID first", async () => {
    setPointer({ coarse: false, width: 1440, touch: false });
    const user = userEvent.setup();
    await goToPayment(user);

    expect(screen.getByText(/Desktop par ho/i)).toBeTruthy();
    expect(document.querySelector("#upiQrImage")).toBeTruthy();
    expect(screen.getByText(/SCAN · ₹50/)).toBeTruthy();
    expect(document.querySelectorAll(".qr-steps li").length).toBe(3);
    expect(screen.getByText(DEFAULT_CONFIG.links.upi)).toBeTruthy();
    expect(document.querySelector(".upi-card")?.className).toContain("qr-primary");
  });

  it("desktop: the deep link is a secondary option, not the main button", async () => {
    setPointer({ coarse: false, width: 1440, touch: false });
    const user = userEvent.setup();
    await goToPayment(user);
    const btn = document.querySelector("#dynamicUpiBtn");
    expect(btn?.className).toContain("is-secondary");
    expect(btn?.textContent).toContain("YA ISI DEVICE PAR UPI APP KHOLO");
  });

  it("mobile: shows the deep-link hint and the primary PAY button", async () => {
    setPointer({ coarse: true, width: 390, touch: true });
    const user = userEvent.setup();
    await goToPayment(user);

    expect(screen.getByText(/Mobile par ho/i)).toBeTruthy();
    expect(document.querySelector(".upi-card")?.className).toContain("link-primary");
    const btn = document.querySelector("#dynamicUpiBtn");
    expect(btn?.className).not.toContain("is-secondary");
    expect(btn?.textContent).toContain("PAY ₹50 VIA UPI");
    // QR is still available as a fallback
    expect(document.querySelector("#upiQrImage")).toBeTruthy();
  });
});

/* ────────────────── universal / UPI routing ────────────────── */

describe("universal UPI routing", () => {
  const basePlan = DEFAULT_CONFIG.packs.movies.plans[0];

  it("defaults every seeded plan to universal (UPI deep link)", () => {
    for (const pack of Object.values(DEFAULT_CONFIG.packs)) {
      for (const plan of pack.plans) expect(plan.payMode).toBe("universal");
    }
  });

  it("never flags a Razorpay amount mismatch on a universal plan", () => {
    const d = resolvePayment({ ...basePlan, payMode: "universal", price: 999, razorpayAmount: 50 });
    expect(d.mode).toBe("upi");
    expect(d.mismatch).toBe(false);
    expect(d.amount).toBe(999);
  });

  it("still flags a mismatch when the plan actually asks for Razorpay", () => {
    const d = resolvePayment({ ...basePlan, payMode: "auto", price: 999, razorpayAmount: 50 });
    expect(d.mode).toBe("upi");
    expect(d.mismatch).toBe(true);
  });

  it("charges the new price after a price change", () => {
    const plan = { ...basePlan, payMode: "universal" as const, price: 1499 };
    expect(resolvePayment(plan).amount).toBe(1499);
  });
});

/* ────────────────── OTT comparison ────────────────── */

describe("OTT vs Timepass Premium comparison", () => {
  it("renders live per-month maths from the config", async () => {
    mockFetchConfig(cfg());
    renderWithProviders(<PriceCompare onBuy={() => {}} />);
    await flush();

    expect(screen.getByText("Ek OTT ka 1 mahina = hamara poora saal")).toBeTruthy();
    // 1-year pack ₹465 → ₹39/month
    expect(screen.getAllByText(/₹39/).length).toBeGreaterThan(0);
    expect(screen.getByText("YAHAN HO TUM")).toBeTruthy();
    expect(screen.getByText("Netflix")).toBeTruthy();
    expect(screen.getByText("JioHotstar")).toBeTruthy();
    expect(document.querySelectorAll(".cmp-row").length).toBe(7); // ours + 6 OTT
  });

  it("follows a price change made in the studio", async () => {
    const c = cfg();
    c.packs.movies.plans[3].price = 600; // 1 Year → ₹50/mo
    mockFetchConfig(c);
    renderWithProviders(<PriceCompare onBuy={() => {}} />);
    await flush();
    expect(screen.getAllByText(/₹50/).length).toBeGreaterThan(0);
  });

  it("switches copy with the language", async () => {
    mockFetchConfig(cfg());
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <LangSwitch />
        <PriceCompare onBuy={() => {}} />
      </>
    );
    await flush();

    await user.click(screen.getByRole("button", { name: "English" }));
    await waitFor(() => expect(screen.getByText("One OTT month = our whole year")).toBeTruthy());

    await user.click(screen.getByRole("button", { name: "हिन्दी" }));
    await waitFor(() => expect(screen.getByText("एक OTT का 1 महीना = हमारा पूरा साल")).toBeTruthy());
  });

  it("hides itself when no plan has a price", async () => {
    const c = cfg();
    c.packs.movies.plans.forEach((p) => { p.price = 0; });
    mockFetchConfig(c);
    const { container } = renderWithProviders(<PriceCompare onBuy={() => {}} />);
    await flush();
    expect(container.querySelector(".cmp")).toBeNull();
  });
});

/* ────────────────── announcement v2 ────────────────── */

describe("announcement banner v2", () => {
  it("renders the badge pulse dot, marquee track and CTA arrow", async () => {
    const c = cfg();
    c.announcement = {
      ...c.announcement,
      enabled: true,
      text: "🔥 Sab plans ₹50 se shuru",
      badge: "LIMITED TIME",
      ctaLabel: "GRAB DEAL",
      ctaUrl: "/buy/movies",
      animation: "marquee"
    };
    mockFetchConfig(c);
    renderWithProviders(<Announcement />);
    const bar = await screen.findByTestId("announcement");

    expect(bar.className).toContain("anim-marquee");
    expect(bar.querySelector(".announce-dot")).toBeTruthy();
    expect(bar.querySelectorAll(".announce-track > span").length).toBe(4);
    const cta = screen.getByText(/GRAB DEAL/);
    expect(cta.getAttribute("href")).toBe("/buy/movies");
    expect(cta.querySelector("i.fa-arrow-right")).toBeTruthy();
  });

  it("shows a countdown chip when an expiry is set", async () => {
    const c = cfg();
    c.announcement = {
      ...c.announcement,
      enabled: true,
      text: "Offer live",
      expiresAt: new Date(Date.now() + 2 * 86_400_000).toISOString()
    };
    mockFetchConfig(c);
    renderWithProviders(<Announcement />);
    const bar = await screen.findByTestId("announcement");
    expect(bar.querySelector(".announce-countdown")?.textContent).toMatch(/d/);
  });
});
