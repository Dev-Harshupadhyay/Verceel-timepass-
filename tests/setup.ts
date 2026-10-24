import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

const hasDom = typeof window !== "undefined";

if (hasDom) {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      }) as unknown as MediaQueryList;
  }
  window.scrollTo = (() => {}) as typeof window.scrollTo;
  if (!Element.prototype.animate) {
    // @ts-expect-error minimal Animation shim for jsdom
    Element.prototype.animate = () => ({ cancel: () => {}, finished: Promise.resolve() });
  }
}

beforeEach(() => {
  if (hasDom) {
    localStorage.clear();
    sessionStorage.clear();
  }
  vi.restoreAllMocks();
});

afterEach(() => {
  if (hasDom) cleanup();
});
