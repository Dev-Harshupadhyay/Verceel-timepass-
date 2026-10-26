import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BuyPage } from "@/pages/Buy";
import { DEFAULT_CONFIG } from "@/config";
import { normalizeConfig } from "../api/_lib/config-schema.js";
import { mockFetchConfig, renderWithProviders, flush } from "./_utils";
import type { Config } from "@/types";

const NEW_UPI = "pmharshu@naviaxis";
const OLD_UPI = "pmharsh@fam";

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

async function openPayment(c: Config, user: ReturnType<typeof userEvent.setup>) {
  desktop();
  mockFetchConfig(c);
  renderWithProviders(<BuyPage packKey="movies" />);
  await flush();
  await screen.findByText("CHOOSE YOUR PLAN");
  await user.click(screen.getByText("₹50"));
  await user.click(screen.getAllByRole("button", { name: /PROCEED TO PAY/i })[0]);
  await flush();
}

/* ─────────────── the new UPI id ─────────────── */

describe("upi id migration", () => {
  it("ships the naviaxis id", () => {
    expect(DEFAULT_CONFIG.links.upi).toBe(NEW_UPI);
  });

  it("moves an already-published pmharsh@fam config over", () => {
    const c = cfg();
    c.links.upi = OLD_UPI;
    const { config, errors } = normalizeConfig(c);
    expect(config.links.upi).toBe(NEW_UPI);
    expect(errors.length).toBe(0);
  });

  it("never overrides an id the admin chose themselves", () => {
    const c = cfg();
    c.links.upi = "someone@okhdfcbank";
    expect(normalizeConfig(c).config.links.upi).toBe("someone@okhdfcbank");
  });

  it("builds the QR + deep link from the new id", async () => {
    const user = userEvent.setup();
    await openPayment(cfg(), user);
    const qr = document.querySelector("#upiQrImage") as HTMLImageElement;
    const decoded = decodeURIComponent(decodeURIComponent(qr.src));
    expect(decoded).toContain(NEW_UPI);
    expect(decoded).not.toContain(OLD_UPI);
    expect(screen.getByText(NEW_UPI)).toBeTruthy();
  });

  it("migrates the old shipped payment heading too", () => {
    const c = cfg();
    c.content.paymentHeading = "⚡ SECURE UPI PAYMENT";
    expect(normalizeConfig(c).config.content.paymentHeading).toBe("⚡ SECURE PAYMENT");
  });
});

/* ─────────────── Razorpay first ─────────────── */

describe("razorpay universal is the primary action", () => {
  it("renders a recommended primary button that opens the razorpay link", async () => {
    const user = userEvent.setup();
    await openPayment(cfg(), user);

    const primary = document.querySelector(".pay-primary")!;
    expect(primary).toBeTruthy();
    expect(primary.textContent).toContain("RECOMMENDED");
    expect(primary.textContent).toContain("RAZORPAY UNIVERSAL");

    const btn = primary.querySelector("a.pay-primary-btn") as HTMLAnchorElement;
    expect(btn.getAttribute("href")).toBe(DEFAULT_CONFIG.links.razorpay);
    expect(btn.getAttribute("target")).toBe("_blank");
    expect(btn.getAttribute("rel")).toContain("noopener");
    expect(btn.textContent).toContain("PAY ₹50");
  });

  it("puts the primary button before the UPI zone in the DOM", async () => {
    const user = userEvent.setup();
    await openPayment(cfg(), user);
    const card = document.querySelector(".upi-card")!;
    const primary = card.querySelector(".pay-primary")!;
    const qr = card.querySelector(".qr-frame")!;
    // Node.compareDocumentPosition: 4 === FOLLOWING
    expect(primary.compareDocumentPosition(qr) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("separates the two routes with a divider", async () => {
    const user = userEvent.setup();
    await openPayment(cfg(), user);
    const divider = document.querySelector(".pay-divider");
    expect(divider?.textContent).toMatch(/YA UPI ID SE TRY KARO/i);
  });
});

/* ─────────────── the warning under the deep link ─────────────── */

describe("warning about UPI payments failing", () => {
  it("sits right under the deep-link button and points at Razorpay", async () => {
    const user = userEvent.setup();
    await openPayment(cfg(), user);

    const btn = document.querySelector("#dynamicUpiBtn")!;
    const warn = document.querySelector(".pay-warn")!;
    expect(warn).toBeTruthy();
    // the warning comes directly after the button
    expect(btn.nextElementSibling).toBe(warn);

    expect(warn.textContent).toMatch(/UPI ID se payment fail ho sakti hai/i);
    expect(warn.textContent).toMatch(/Razorpay Universal/i);
    expect(warn.querySelector("i.fa-triangle-exclamation")).toBeTruthy();
  });

  it("keeps an escape hatch inside the UPI zone", async () => {
    const user = userEvent.setup();
    await openPayment(cfg(), user);
    const safe = document.querySelector("a.pay-route.is-safe") as HTMLAnchorElement;
    expect(safe).toBeTruthy();
    expect(safe.getAttribute("href")).toBe(DEFAULT_CONFIG.links.razorpay);
    expect(safe.textContent).toMatch(/UPI FAIL HUI\? RAZORPAY SE PAY/i);
  });

  it("mentions the risk policy in the note under the primary button", async () => {
    const user = userEvent.setup();
    await openPayment(cfg(), user);
    await waitFor(() =>
      expect(document.querySelector(".pp-note")!.textContent).toMatch(/UPI Risk Policy” wala alert yahan nahi aata/)
    );
  });
});
