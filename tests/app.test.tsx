import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { DEFAULT_CONFIG } from "@/config";
import { mockFetchConfig, renderWithProviders, flush } from "./_utils";
import type { Config } from "@/types";

function cfg(): Config {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function goTo(path: string) {
  window.history.pushState({}, "", path);
}

describe("site shell", () => {
  it("renders the hero, trust strip and packs on the home page", async () => {
    goTo("/");
    mockFetchConfig(cfg());
    renderWithProviders(<App />);
    await flush();

    expect(await screen.findByRole("heading", { name: "Timepass Premium" })).toBeTruthy();
    expect(screen.getByText("Market Se Sasta OTT 🔥")).toBeTruthy();
    expect(screen.getByText("Instant")).toBeTruthy();
    expect(screen.getByText("Movies & Series")).toBeTruthy();
    expect(screen.getByText("Combo Pack")).toBeTruthy();
  });

  it("shows the sun/moon toggle and both follow each other", async () => {
    goTo("/");
    mockFetchConfig(cfg());
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await flush();

    const toggle = screen.getByTestId("theme-toggle");
    await user.click(toggle);
    expect(document.documentElement.getAttribute("data-theme")).toBe("obsidian");
    await user.click(toggle);
    expect(document.documentElement.getAttribute("data-theme")).toBe("apple-light");
  });

  it("navigates to the info page and shows trilingual content", async () => {
    goTo("/");
    mockFetchConfig(cfg());
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await flush();

    await user.click(screen.getAllByRole("button", { name: /^INFO$/i })[0]);
    expect(window.location.pathname).toBe("/info");
    await flush();

    expect(await screen.findByText(/Ek OTT subscription se kam price/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByText(/for less than one OTT subscription/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "हिन्दी" }));
    expect(screen.getByText(/एक OTT सब्सक्रिप्शन से कम कीमत/)).toBeTruthy();
  });

  it("renders the FAQ page with categories", async () => {
    goTo("/faq");
    mockFetchConfig(cfg());
    renderWithProviders(<App />);
    await flush();

    expect(await screen.findByText("Frequently Asked Questions")).toBeTruthy();
    expect(screen.getByRole("group", { name: "FAQ categories" })).toBeTruthy();
  });

  it("opens a pack buy page with its plans", async () => {
    goTo("/buy/movies");
    mockFetchConfig(cfg());
    renderWithProviders(<App />);
    await flush();

    expect(await screen.findByText("CHOOSE YOUR PLAN")).toBeTruthy();
    expect(screen.getByText("₹50")).toBeTruthy();
    expect(screen.getByText("₹465")).toBeTruthy();
  });

  it("moves to the payment step with a UPI deep link for button-less plans", async () => {
    goTo("/buy/adult");
    mockFetchConfig(cfg());
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await flush();

    await screen.findByText("CHOOSE YOUR PLAN");
    await user.click(screen.getByText("₹100"));
    await user.click(screen.getAllByRole("button", { name: /PROCEED TO PAY/i })[0]);

    expect(await screen.findByText(/SECURE UPI PAYMENT/)).toBeTruthy();
    const qr = document.querySelector("#upiQrImage") as HTMLImageElement;
    const decoded = decodeURIComponent(decodeURIComponent(qr.src));
    expect(decoded).toContain("upi://pay");
    expect(decoded).toContain("pmharsh@fam");
    expect(decoded).toContain("am=100.00");
  });

  it("shows the Studio login gate at /studio", async () => {
    goTo("/studio");
    mockFetchConfig(cfg());
    renderWithProviders(<App />);
    await flush();
    expect(await screen.findByText("Live Website Studio")).toBeTruthy();
    expect(screen.getByLabelText("Admin password")).toBeTruthy();
  });
});
