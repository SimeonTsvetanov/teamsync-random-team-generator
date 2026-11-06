import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("app loads with title, footer year and no CSP errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("./");
  await expect(page).toHaveTitle(/TeamSync/);
  await expect(page.locator("[data-year]")).toHaveText(String(new Date().getFullYear()));
  expect(errors).toEqual([]);
});

test("no serious accessibility violations", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)))); // axe mis-measures contrast while anything fades in
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
});
