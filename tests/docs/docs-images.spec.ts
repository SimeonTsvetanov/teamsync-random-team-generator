// `pnpm docs:images` — generates every docs image in the light and dark theme from tests/docs/shots.ts.
// Fixed viewport, 2x, reduced motion, animations off, English and a seeded random source: re-running
// gives the same images, and the light and dark image of a shot show the same content.
// bypassCSP: the app's meta CSP would block the CSS Playwright injects for `style` and `mask`.
import { expect, test } from "@playwright/test";
import { DOCS_SHOTS } from "./shots.ts";

const VIEWPORTS = { phone: { width: 390, height: 844 }, desktop: { width: 1280, height: 800 } } as const;
/** Toasts ("Ready to work offline", "Copied") come and go — they don't belong in a docs image. */
const HIDE_TOASTS = "[data-toasts] { display: none; }";

/**
 * Runs in the page before any app script: replaces crypto.getRandomValues with a seeded PRNG
 * (mulberry32), so every shuffle/random pick is the same in every run and in both themes.
 * Docs images only — the app itself always uses the device's secure random numbers.
 */
function seedRandom(seed: number): void {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
  Object.defineProperty(crypto, "getRandomValues", {
    configurable: true,
    value: <T extends ArrayBufferView | null>(array: T): T => {
      if (array) {
        const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
        for (let i = 0; i < bytes.length; i += 4) {
          const n = next();
          for (let k = 0; k < 4 && i + k < bytes.length; k++) bytes[i + k] = (n >>> (8 * k)) & 0xff;
        }
      }
      return array;
    },
  });
  Math.random = (): number => next() / 2 ** 32;
}

for (const shot of DOCS_SHOTS) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`docs image ${shot.page}/${shot.name}-${colorScheme}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: VIEWPORTS[shot.device], deviceScaleFactor: 2, colorScheme, reducedMotion: "reduce", locale: "en-US", bypassCSP: true });
      await context.addInitScript(seedRandom, 20261108);
      const page = await context.newPage();
      await page.goto("./");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // explicit ready signal, never networkidle
      await shot.setUp(page);
      await page.mouse.move(-1, -1); // no hover state in the picture
      const options = { path: `docs/images/${shot.page}/${shot.name}-${colorScheme}.png`, animations: "disabled", mask: shot.mask?.(page) ?? [], maskColor: "#8E8E93", style: shot.showToasts ? "" : HIDE_TOASTS } as const;
      await (shot.crop ? shot.crop(page).screenshot(options) : page.screenshot(options));
      await context.close();
    });
  }
}
