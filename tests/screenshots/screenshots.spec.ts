import { test } from "@playwright/test";
import { prepare } from "./prepare.ts";

// `pnpm screenshots` — real app captures for the manifest (richer install dialog) and the
// listings. Light theme, English, sample data from prepare.ts, no personal content. Run before a
// release when the UI is final; commit app/public/screenshots/*.png (forge-pwa → icons-and-assets §3).
const shots = [
  { file: "narrow.png", viewport: { width: 390, height: 844 }, scale: 2 }, // 780×1688
  { file: "wide.png", viewport: { width: 1280, height: 800 }, scale: 1 },
] as const;

for (const s of shots) {
  test(`screenshot ${s.file}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: s.scale, colorScheme: "light", locale: "en-US" });
    const page = await context.newPage();
    await page.goto("./");
    await prepare(page);
    await page.screenshot({ path: `app/public/screenshots/${s.file}` });
    await context.close();
  });
}
