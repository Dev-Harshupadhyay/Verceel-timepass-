import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FaqPage } from "@/pages/Faq";
import { InfoPage } from "@/pages/Info";
import { PricingCards } from "@/components/PricingCards";
import { BuyPage } from "@/pages/Buy";
import { DEFAULT_CONFIG } from "@/config";
import { normalizeConfig } from "../api/_lib/config-schema.js";
import { mockFetchConfig, renderWithProviders, flush } from "./_utils";
import type { Config } from "@/types";

function cfg(): Config {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

/* ─────────────────── FAQ page ─────────────────── */

describe("FAQ page v2", () => {
  it("renders the hero with stats and popular picks", async () => {
    mockFetchConfig(cfg());
    const { container } = renderWithProviders(<FaqPage />);
    await flush();

    expect(container.querySelector(".fx-hero")).toBeTruthy();
    expect(screen.getByText("HELP CENTER")).toBeTruthy();
    expect(screen.getByText("Frequently Asked Questions")).toBeTruthy();

    const stats = container.querySelectorAll(".fx-stats > div");
    expect(stats.length).toBe(3);
    expect(stats[0].textContent).toContain(String(DEFAULT_CONFIG.faq.length)); // answers
    expect(stats[1].textContent).toContain("3"); // languages

    // popular chips come from the seeded ids
    const pills = container.querySelectorAll(".fx-pill");
    expect(pills.length).toBe(3);
  });

  it("jumps to a popular question and opens it", async () => {
    mockFetchConfig(cfg());
    const user = userEvent.setup();
    const { container } = renderWithProviders(<FaqPage />);
    await flush();

    const pill = container.querySelector<HTMLButtonElement>(".fx-pill");
    expect(pill).toBeTruthy();
    expect(pill!.textContent).toMatch(/OTT subscriptions se sasta kaise/i);
    await user.click(pill!);

    await waitFor(() => {
      const btn = document.getElementById("faq-btn-faq-price");
      expect(btn?.getAttribute("aria-expanded")).toBe("true");
    });
  });

  it("highlights the search match with <mark>, never HTML", async () => {
    mockFetchConfig(cfg());
    const user = userEvent.setup();
    const { container } = renderWithProviders(<FaqPage />);
    await flush();

    await user.type(screen.getByPlaceholderText(/Search question/i), "UPI");

    await waitFor(() => expect(container.querySelectorAll("mark.fq-hl").length).toBeGreaterThan(0));
    expect(container.querySelector(".injected")).toBeNull();
    expect(screen.getByText(/results/)).toBeTruthy();

    // clear button restores everything
    await user.click(screen.getByLabelText("Clear search"));
    await waitFor(() => expect(container.querySelectorAll("mark.fq-hl").length).toBe(0));
  });

  it("shows category emoji icons on every row", async () => {
    mockFetchConfig(cfg());
    const { container } = renderWithProviders(<FaqPage />);
    await flush();
    const rows = container.querySelectorAll(".faq-item");
    expect(rows.length).toBe(DEFAULT_CONFIG.faq.length);
    rows.forEach((row) => expect(row.querySelector(".fq-ico")?.textContent).toBeTruthy());
  });
});

/* ─────────────────── Info page ─────────────────── */

describe("info page v2", () => {
  it("renders the hero, stats and one tile per pack", async () => {
    mockFetchConfig(cfg());
    const { container } = renderWithProviders(<InfoPage />);
    await flush();

    expect(container.querySelector(".ix-hero")).toBeTruthy();
    expect(screen.getByText(/Ek OTT subscription se kam price/i)).toBeTruthy();

    const tiles = container.querySelectorAll(".pack-tile");
    expect(tiles.length).toBe(3); // movies / adult / combo
    expect(container.querySelector(".pack-tile.is-crown")).toBeTruthy();
    expect(tiles[0].textContent).toContain("Movies & Series");
    expect(tiles[0].textContent).toContain("₹50");
  });

  it("shows the plan stickers inside the tiles", async () => {
    mockFetchConfig(cfg());
    const { container } = renderWithProviders(<InfoPage />);
    await flush();
    const stickers = [...container.querySelectorAll(".pt-sticker")].map((n) => n.textContent);
    expect(stickers).toContain("🌙");
    expect(stickers).toContain("👑");
    expect(stickers).toContain("🍿");
  });

  it("has emoji steps and policy cards", async () => {
    mockFetchConfig(cfg());
    const { container } = renderWithProviders(<InfoPage />);
    await flush();
    expect(container.querySelectorAll(".s-emoji").length).toBe(DEFAULT_CONFIG.info.howItWorks.length);
    expect(container.querySelectorAll(".policy").length).toBe(DEFAULT_CONFIG.info.policies.length);
  });

  it("buy buttons navigate to the pack page", async () => {
    mockFetchConfig(cfg());
    const user = userEvent.setup();
    const { container } = renderWithProviders(<InfoPage />);
    await flush();
    const buy = [...container.querySelectorAll<HTMLButtonElement>(".pt-cta")][0];
    await user.click(buy);
    expect(window.location.pathname).toBe("/buy/movies");
  });
});

/* ─────────────────── pack + plan stickers ─────────────────── */

describe("pack sticker styling", () => {
  it("renders a watermark, sparkle and per-plan stickers on home cards", async () => {
    mockFetchConfig(cfg());
    const { container } = renderWithProviders(<PricingCards onBuy={() => {}} />);
    await flush();

    const cards = container.querySelectorAll(".card");
    expect(cards.length).toBe(3);
    expect(container.querySelectorAll(".p-watermark").length).toBe(3);
    expect(container.querySelectorAll(".p-emoji-spark").length).toBe(3);

    // combo plans carry their own emoji
    const combo = container.querySelector(".pack-combo");
    const stickers = [...combo!.querySelectorAll(".pr-sticker")].map((n) => n.textContent);
    expect(stickers).toEqual(["🎟️", "🍿", "💎", "🏆"]);
  });

  it("shows the sticker on buy-page plan cards", async () => {
    mockFetchConfig(cfg());
    const { container } = renderWithProviders(<BuyPage packKey="movies" />);
    await flush();
    const stickers = [...container.querySelectorAll(".pc-sticker")].map((n) => n.textContent);
    expect(stickers).toEqual(["🌙", "⭐", "🔥", "👑"]);
  });

  it("keeps working when a plan has no sticker (old saved configs)", async () => {
    const c = cfg();
    c.packs.movies.plans.forEach((p) => {
      delete (p as Partial<typeof p>).sticker;
    });
    mockFetchConfig(c);
    const { container } = renderWithProviders(<PricingCards onBuy={() => {}} />);
    await flush();
    // the normaliser fills it from the seeded plan at that index — never a crash, never a blank row
    expect(container.querySelectorAll(".pr-sticker").length).toBeGreaterThan(0);
    expect(screen.getByText("Movies & Series")).toBeTruthy();
  });

  it("defaults a missing sticker from the seeded plan at that index", () => {
    const raw = cfg();
    delete (raw.packs.movies.plans[0] as unknown as Record<string, unknown>).sticker;
    const { config, errors } = normalizeConfig(raw);
    expect(errors.length).toBe(0);
    expect(config.packs.movies.plans[0].sticker).toBe("🌙"); // index fallback
  });
});
