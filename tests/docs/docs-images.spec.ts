// `pnpm docs:images` — generates every docs image in the light and dark theme from tests/docs/shots.ts.
// Fixed viewport, 2x, reduced motion, animations off, English: re-running gives the same images.
// bypassCSP: the app's meta CSP would block the CSS Playwright injects for `style` and `mask`.
import { test } from "@playwright/test";
import { DOCS_SHOTS } from "./shots.ts";

const VIEWPORTS = { phone: { width: 390, height: 844 }, desktop: { width: 1280, height: 800 } } as const;
/** Toasts ("Ready to work offline", "Copied") come and go — they don't belong in a docs image. */
const HIDE_TOASTS = "[data-toasts] { display: none; }";

for (const shot of DOCS_SHOTS) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`docs image ${shot.page}/${shot.name}-${colorScheme}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: VIEWPORTS[shot.device], deviceScaleFactor: 2, colorScheme, reducedMotion: "reduce", locale: "en-US", bypassCSP: true });
      const page = await context.newPage();
      await page.goto("./");
      await shot.setUp(page);
      await page.mouse.move(-1, -1); // no hover state in the picture
      const options = { path: `docs/images/${shot.page}/${shot.name}-${colorScheme}.png`, animations: "disabled", mask: shot.mask?.(page) ?? [], maskColor: "#8E8E93", style: shot.showToasts ? "" : HIDE_TOASTS } as const;
      await (shot.crop ? shot.crop(page).screenshot(options) : page.screenshot(options));
      await context.close();
    });
  }
}
