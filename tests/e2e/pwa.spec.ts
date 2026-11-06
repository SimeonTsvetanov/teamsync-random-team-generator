import { expect, test } from "@playwright/test";
import { app as config, type AppConfig } from "../../app.config.ts";

// Manifest power features from app.config (forge-pwa → pwa §4): shortcuts, share target.
const app: AppConfig = config;

test("manifest carries shortcuts and share target only when app.config enables them", async ({ request }) => {
  const m = (await (await request.get("./manifest.webmanifest")).json()) as Record<string, unknown>;
  expect(m["shortcuts"] !== undefined).toBe(Boolean(app.shortcuts?.length));
  expect(m["share_target"] !== undefined).toBe(Boolean(app.modes.shareTarget));
});

test("shared text arrives once and the address bar is cleaned", async ({ page }) => {
  test.skip(!app.modes.shareTarget, "share target not enabled for this app");
  await page.goto("./?share-target=1&title=T&text=Hello%20team&url=");
  await expect.poll(() => page.evaluate(() => location.search)).toBe("");
});
