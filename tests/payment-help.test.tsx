import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BuyPage } from "@/pages/Buy";
import { LangSwitch } from "@/state/LangProvider";
import { DEFAULT_CONFIG } from "@/config";
import { isMobileNo } from "../api/_lib/config-schema.js";
import { mockFetchConfig, renderWithProviders, flush } from "./_utils";
import type { Config } from "@/types";
import { act } from "react";

function cfg(): Config {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function desktop() {
  Object.defineProperty(window, "innerWidth", { value: 1440, configurable: true, writable: true });
  Object.defineProperty(navigator, "maxTouchPoints", { value: 0, configurable: true });
  vi.spyOn(window, "matchMedia").mockImplementation(
    (q: string) =>
      ({
        matches: false,
        media: q,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      }) as unknown as MediaQueryList
  );
}

async function openPayment(c: Config, user: ReturnType<typeof userEvent.setup>, wrap?: React.ReactNode) {
  desktop();
  mockFetchConfig(c);
  renderWithProviders(
    <>
      {wrap}
      <BuyPage packKey="movies" />
    </>
  );
  await flush();
  await screen.findByText("CHOOSE YOUR PLAN");
  await user.click(screen.getByText("₹50"));
  await user.click(screen.getAllByRole("button", { name: /PROCEED TO PAY/i })[0]);
  await flush();
}

/* ─────────────── UPI risk-policy notes ─────────────── */

describe("payment notes (UPI risk policy)", () => {
  it("explains the Paytm alert with all five routes", async () => {
    const user = userEvent.setup();
    await openPayment(cfg(), user);

    const notes = document.querySelector(".pay-notes");
    expect(notes).toBeTruthy();
    expect(notes!.textContent).toContain("IMPORTANT NOTES · PAYMENT");
    expect(notes!.textContent).toMatch(/UPI Risk Policy/);
    expect(notes!.querySelectorAll(".pn-list li").length).toBe(6);
    // razorpay is now the first thing recommended
    expect(notes!.querySelectorAll(".pn-list li")[0].textContent).toMatch(/Razorpay Universal/);
    expect(notes!.textContent).toMatch(/UPI ID se payment fail ho sakti hai/);
    expect(notes!.textContent).toMatch(/Pay via Mobile Number/);
    expect(notes!.textContent).toMatch(/Pay via Scanning QR/);
  });

  it("speaks the visitor's language", async () => {
    const user = userEvent.setup();
    await openPayment(cfg(), user, <LangSwitch />);

    await user.click(screen.getByRole("button", { name: "English" }));
    await waitFor(() => expect(document.querySelector(".pay-notes")!.textContent).toMatch(/UPI Risk Policy/));
    expect(document.querySelector(".pay-notes")!.textContent).toMatch(/Choose “Pay via Mobile Number”/);

    await user.click(screen.getByRole("button", { name: "हिन्दी" }));
    await waitFor(() => expect(document.querySelector(".pay-notes")!.textContent).toMatch(/घबराएँ नहीं/));
  });
});

/* ─────────────── fallback routes ─────────────── */

describe("payment fallback routes", () => {
  it("always offers the merchant (Razorpay) route", async () => {
    const user = userEvent.setup();
    await openPayment(cfg(), user);

    const safe = document.querySelector("a.pay-route.is-safe") as HTMLAnchorElement | null;
    expect(safe).toBeTruthy();
    expect(safe!.getAttribute("href")).toBe(DEFAULT_CONFIG.links.razorpay);
    expect(safe!.getAttribute("target")).toBe("_blank");
    expect(safe!.getAttribute("rel")).toContain("noopener");
    expect(safe!.textContent).toMatch(/RAZORPAY SE PAY/i);
  });

  it("hides the mobile-number route while no number is configured", async () => {
    const user = userEvent.setup();
    await openPayment(cfg(), user); // payeeMobile is "" by default
    const routes = document.querySelector(".pay-routes")!;
    expect(routes.querySelector(".pay-route:not(.is-safe)")).toBeNull();
    // only the merchant route is offered
    expect(routes.querySelectorAll(".pay-route").length).toBe(1);
  });

  it("shows the payee number and copies it on tap", async () => {
    const c = cfg();
    c.links.payeeMobile = "9876543210";
    const user = userEvent.setup();
    await openPayment(c, user);

    const routes = document.querySelector(".pay-routes")!;
    const btn = routes.querySelector<HTMLButtonElement>(".pay-route:not(.is-safe)")!;
    expect(btn).toBeTruthy();
    expect(btn.textContent).toMatch(/MOBILE NUMBER SE PAY/i);
    expect(btn.textContent).toContain("9876543210");
    await user.click(btn);
    expect(await navigator.clipboard.readText()).toBe("9876543210");
  });
});

/* ─────────────── QR failure fallback ─────────────── */

describe("QR image fallback", () => {
  it("swaps in instructions when the QR image cannot load", async () => {
    const user = userEvent.setup();
    await openPayment(cfg(), user);

    const img = document.querySelector("#upiQrImage") as HTMLImageElement;
    expect(img).toBeTruthy();
    await act(async () => {
      fireEvent.error(img);
    });

    expect(document.querySelector("#upiQrImage")).toBeNull();
    const fb = document.querySelector(".qr-fallback");
    expect(fb).toBeTruthy();
    expect(fb!.textContent).toMatch(/QR load nahi hua/i);
    // the UPI id is still copyable, so the buyer is never stuck
    expect(screen.getByText(DEFAULT_CONFIG.links.upi)).toBeTruthy();
    expect(screen.getByText("COPY")).toBeTruthy();
  });
});

/* ─────────────── schema validation ─────────────── */

describe("payeeMobile validation", () => {
  it("accepts only real Indian mobile numbers", () => {
    expect(isMobileNo("9876543210")).toBe(true);
    expect(isMobileNo("98 765 43210")).toBe(true);
    expect(isMobileNo("5876543210")).toBe(false); // cannot start with 5
    expect(isMobileNo("98765")).toBe(false);
    expect(isMobileNo("")).toBe(false);
  });

  it("keeps a valid number and drops a bad one", async () => {
    const { normalizeConfig } = await import("../api/_lib/config-schema.js");
    const good = cfg();
    good.links.payeeMobile = "98765 43210";
    expect(normalizeConfig(good).config.links.payeeMobile).toBe("9876543210");

    const bad = cfg();
    bad.links.payeeMobile = "12345";
    const res = normalizeConfig(bad);
    expect(res.config.links.payeeMobile).toBe("");
    expect(res.errors.some((e: { path: string }) => e.path === "links.payeeMobile")).toBe(true);
  });
});
