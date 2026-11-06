import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// App-shell e2e (APP-STANDARD §14): dialogs, theme, storage namespacing, offline, policy + error pages.
const serious = async (page: Page): Promise<string[]> =>
  (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => v.id);

for (const dialog of ["help", "settings", "about", "whats-new", "report"]) {
  test(`deep link #${dialog} opens one accessible dialog`, async ({ page }) => {
    await page.goto(`./#${dialog}`);
    await expect(page.locator(`dialog[data-dialog="${dialog}"][open]`)).toBeVisible();
    await expect(page.locator("dialog.sheet[open]")).toHaveCount(1);
    expect(await serious(page)).toEqual([]);
  });
}

test("changing the deep link replaces the open dialog (no stacking)", async ({ page }) => {
  await page.goto("./#help");
  await page.evaluate(() => { window.location.hash = "#settings"; });
  await expect(page.locator('dialog[data-dialog="settings"][open]')).toBeVisible();
  await expect(page.locator("dialog.sheet[open]")).toHaveCount(1);
});

test("menu opens and every item is reachable", async ({ page }) => {
  await page.goto("./");
  await page.click("[data-menu-open]");
  await expect(page.locator("dialog[data-menu][open]")).toBeVisible();
  await expect(page.locator("dialog[data-menu] a, dialog[data-menu] nav button")).toHaveCount(14);
});

test("regression: saved dark theme is applied by theme-init.js before the app JS runs", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "light", serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto("./#settings");
  await page.click("label[for=theme-dark]");
  await page.route("**/assets/index-*.js", (r) => r.abort());
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await context.close();
});

test("storage is namespaced and Clear my data keeps other apps' data", async ({ page }) => {
  await page.goto("./#settings");
  await page.click("label[for=theme-dark]");
  const appId = await page.evaluate(() => new URL(window.document.baseURI).pathname.split("/")[1] ?? "");
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.every((k) => k.startsWith(`${appId}:v1:`))).toBe(true);
  await page.evaluate(() => { localStorage.setItem("other-app:v1:x", "1"); });
  page.on("dialog", (d) => { throw new Error(`native ${d.type()} dialog used — use confirmAction()`); });
  // Destructive actions ask first in our own alert (forge-design → ui-patterns §4); Cancel keeps data.
  await page.getByRole("button", { name: "Clear my data" }).click();
  const alert = page.getByRole("alertdialog");
  await expect(alert).toBeVisible();
  await expect(alert.getByRole("button", { name: "Cancel" })).toBeFocused();
  // Let the entry animation finish (axe mis-measures contrast while opacity < 1, seen in Firefox).
  await alert.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  // Only the alert is perceivable now (the page behind a modal is inert and dimmed).
  expect((await new AxeBuilder({ page }).include('[role="alertdialog"]').withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations
    .filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  await alert.getByRole("button", { name: "Cancel" }).click();
  await expect(alert).toHaveCount(0);
  expect(await page.evaluate((id) => Object.keys(localStorage).filter((k) => k.startsWith(`${id}:`)).length, appId)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Clear my data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect.poll(() => page.evaluate((id) => Object.keys(localStorage).filter((k) => k.startsWith(`${id}:`)).length, appId)).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem("other-app:v1:x"))).toBe("1");
});

test("closing Report a problem with typed text asks before discarding it", async ({ page }) => {
  await page.goto("./#report");
  await page.getByLabel("What happened / your idea").fill("The button does nothing");
  await page.locator('dialog[data-dialog="report"] .sheet-head button').click();
  const alert = page.getByRole("alertdialog");
  await expect(alert).toBeVisible();
  await alert.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.getByLabel("What happened / your idea")).toHaveValue("The button does nothing");
  await page.locator('dialog[data-dialog="report"] .sheet-head button').click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Discard" }).click();
  await expect(page.locator('dialog[data-dialog="report"]')).toHaveCount(0);
});

test("a draft in Report a problem survives a reload", async ({ page }) => {
  await page.goto("./#report");
  await page.getByLabel("Short title").fill("Draft title");
  await page.waitForTimeout(500); // debounce
  await page.reload();
  await expect(page.getByLabel("Short title")).toHaveValue("Draft title");
});

test("a tap outside a sheet closes it (light dismiss)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("./#about");
  await expect(page.locator('dialog[data-dialog="about"][open]')).toBeVisible();
  await page.mouse.click(10, 790);
  await expect(page.locator('dialog[data-dialog="about"]')).toHaveCount(0);
});

test("offline: an address that isn't saved shows our offline page, not the browser's", async ({ page, context }) => {
  await page.goto("./");
  await page.evaluate(async () => { await window.navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.goto("./no-such-page");
  await expect(page.locator("h1")).toHaveText("You’re offline");
  await page.goto("./?lang=en&embed=1"); // any query still opens the saved app
  await expect(page.locator("[data-menu-open]")).toBeAttached();
  await context.setOffline(false);
});

test("print shows content only", async ({ page }) => {
  await page.goto("./");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".app-header")).toBeHidden();
  await expect(page.locator(".app-footer")).toBeHidden();
  await expect(page.locator("main h1")).toBeVisible();
});

test("works offline after the first visit", async ({ page, context }) => {
  await page.goto("./");
  await page.evaluate(async () => { await window.navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".offline-pill")).toBeVisible();
  await context.setOffline(false);
});

test("SEO and agent files are real files", async ({ request }) => {
  for (const [path, type] of [["robots.txt", "text/plain"], ["sitemap.xml", "xml"], ["llms.txt", "text/plain"], ["llms-full.txt", "text/plain"], ["og-image.png", "image/png"], ["pwa-192x192.png", "image/png"], ["pwa-512x512.png", "image/png"], ["apple-touch-icon-180x180.png", "image/png"]] as const) {
    const res = await request.get(`./${path}`);
    expect(res.ok(), path).toBe(true);
    expect(res.headers()["content-type"], path).toContain(type);
  }
});

test("policy pages render and keep the email out of the HTML source", async ({ page, request }) => {
  for (const slug of ["terms", "privacy", "ai-notice", "legal-notice", "support"]) {
    await page.goto(`./${slug}/`);
    await expect(page.locator(".page-body")).not.toContainText("PAGE_BODY");
  }
  const html = await (await request.get("./support/")).text();
  expect(html).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
});

test("custom 404 page shows the requested path", async ({ page }) => {
  await page.goto("./404.html?from=/missing-page");
  await expect(page.locator("h1")).toHaveText(/doesn.t exist/);
  await expect(page.locator("[data-ep-path]")).toContainText("/");
});
