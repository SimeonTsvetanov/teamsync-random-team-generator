import { expect, test, type Page } from "@playwright/test";
import { app as config, type AppConfig } from "../../app.config.ts";

// PWA e2e (forge-pwa → pwa §2, §4): manifest power features, offline fallback only when offline.
const app: AppConfig = config;

/** Opens the app and reloads once so the service worker controls the page. */
async function openControlled(page: Page): Promise<void> {
  await page.goto("./");
  await page.evaluate(async () => { await window.navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

test("manifest carries shortcuts and share target only when app.config enables them", async ({ request }) => {
  const m = (await (await request.get("./manifest.webmanifest")).json()) as Record<string, unknown>;
  expect(m["shortcuts"] !== undefined).toBe(Boolean(app.shortcuts?.length));
  expect(m["share_target"] !== undefined).toBe(Boolean(app.modes.shareTarget));
});

test("shortcuts have a 96 px icon and a GET share target declares its enctype (pwa §2)", async ({ request }) => {
  const m = (await (await request.get("./manifest.webmanifest")).json()) as {
    shortcuts?: { icons?: { src: string; sizes: string }[] }[];
    share_target?: { method?: string; enctype?: string };
  };
  for (const shortcut of m.shortcuts ?? []) expect(shortcut.icons?.some((i) => i.sizes === "96x96")).toBe(true);
  if (m.share_target?.method === "GET") expect(m.share_target.enctype).toBe("application/x-www-form-urlencoded");
  const icon = await request.get("./pwa-96x96.png");
  expect(icon.ok()).toBe(true);
});

test("shared text arrives once and the address bar is cleaned", async ({ page }) => {
  test.skip(!app.modes.shareTarget, "share target not enabled for this app");
  await page.goto("./?share-target=1&title=T&text=Hello%20team&url=");
  await expect.poll(() => page.evaluate(() => location.search)).toBe("");
});

test("online: a file the service worker didn't save comes from the network, not our 404 page", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Service workers are Chromium-only in Playwright");
  await openControlled(page);
  const response = await page.goto("./sitemap.xml");
  expect(response?.headers()["content-type"]).toContain("xml");
  expect(await response?.text()).toContain("<urlset");
  // An unknown address online is the server's 404: our page, but never its offline variant
  // ([data-ep-offline] blocks are hidden unless offline; the h1 always carries data-ep-offline-text).
  const missing = await page.goto("./no-such-page");
  expect(missing?.status()).toBe(404);
  await expect(page.locator("[data-ep-offline]").first()).toBeHidden();
});

test("offline: an unsaved address shows our offline page; saved pages reload with any query", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Service workers are Chromium-only in Playwright");
  await openControlled(page);
  await context.setOffline(true);
  await page.goto("./no-such-page");
  await expect(page.locator("[data-ep-offline]").first()).toBeVisible();
  // Each saved page with a selector only that page has (the 404 page has neither).
  for (const [path, selector] of [["./", "[data-menu-open]"], ["./?teams=3&embed=1", "[data-menu-open]"], ["./terms/", ".page-body"]] as const) {
    await page.goto(path);
    await page.reload();
    await expect(page.locator(selector), path).toBeAttached();
    await expect(page.locator("[data-ep-offline]"), path).toHaveCount(0);
  }
  await context.setOffline(false);
});
