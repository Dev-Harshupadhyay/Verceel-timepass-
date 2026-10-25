// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards for layout bugs that unit tests cannot see (jsdom has no layout).
 * Each case documents a real regression that shipped once.
 */

const ui = readFileSync(path.join(process.cwd(), "src/styles/ui.css"), "utf8");
const legacy = readFileSync(path.join(process.cwd(), "src/styles/legacy.css"), "utf8");

/** declarations of the first top-level `<selector> { ... }` block */
function rule(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = css.match(new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`, "m"));
  return m ? m[1] : null;
}

function count(css: string, selector: string): number {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (css.match(new RegExp(`(?:^|\\n)${escaped} \\{`, "g")) || []).length;
}

describe("css guards", () => {
  it(".card never clips its children — the crown badge sits at top:-10px", () => {
    const body = rule(ui, ".card");
    expect(body).not.toBeNull();
    expect(body).not.toMatch(/overflow\s*:\s*hidden/);
    // the badge really is outside the card box in legacy.css
    const crown = rule(legacy.replace(/^\s+/gm, ""), ".crown");
    expect(crown).toMatch(/top:\s*-10px/);
  });

  it("the pack watermark is clipped by its own wrapper instead", () => {
    expect(rule(ui, ".p-watermark-wrap")).toMatch(/overflow:\s*hidden/);
    expect(rule(ui, ".p-watermark")).not.toMatch(/overflow/);
  });

  it("pack tile content paints above the watermark", () => {
    expect(rule(ui, ".pt-watermark")).toMatch(/z-index:\s*0/);
    const content = ui.match(/\.pt-head,\s*\n\.pt-plans,\s*\n\.pt-cta \{([^}]*)\}/);
    expect(content?.[1]).toMatch(/z-index:\s*1/);
  });

  it("the accordion has exactly one definition (no stale duplicate)", () => {
    expect(count(ui, ".faq-item")).toBe(1);
    expect(count(ui, ".faq-q")).toBe(1);
    expect(count(ui, ".pr-sticker")).toBe(1);
  });

  it("the accordion collapse animation is still wired", () => {
    const body = rule(ui, ".faq-a");
    expect(body).toMatch(/grid-template-rows:\s*0fr/);
    expect(ui).toMatch(/\.faq-item\[data-open="true"\] \.faq-a \{ grid-template-rows: 1fr; \}/);
  });

  it("no absolute element escapes a clipped parent without a z-index plan", () => {
    // .crown / .qr-amount-chip / .qr-brand are the only intentional overflows
    expect(ui).toMatch(/\.qr-amount-chip \{[\s\S]*?top: -9px/);
  });
});
