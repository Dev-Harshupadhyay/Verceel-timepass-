import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { DEFAULT_CONFIG } from "@/config";
import { mockFetchConfig, renderWithProviders, flush } from "./_utils";

function goTo(path: string) {
  window.history.pushState({}, "", path);
}

describe("every route renders without React errors", () => {
  for (const route of ["/", "/faq", "/info", "/buy/movies", "/buy/adult", "/buy/combo"]) {
    it(`renders ${route} without console errors`, async () => {
      const errors: string[] = [];
      const spy = vi.spyOn(console, "error").mockImplementation((...a) => {
        errors.push(a.map(String).join(" "));
      });
      goTo(route);
      mockFetchConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
      const { container } = renderWithProviders(<App />);
      await flush();
      // open things on the plan pages
      if (route.startsWith("/buy")) {
        const user = userEvent.setup();
        const card = container.querySelector<HTMLElement>(".plan-card");
        if (card) await user.click(card);
        const proceed = screen.queryAllByRole("button", { name: /PROCEED TO PAY/i })[0];
        if (proceed) await user.click(proceed);
        await flush();
      }
      spy.mockRestore();
      expect(errors).toEqual([]);
    });
  }
});
