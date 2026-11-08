import { expect, type Page } from "@playwright/test";

/** TeamSync sample state for the manifest screenshots: the followers in 3 teams. */
export async function prepare(page: Page): Promise<void> {
  // An explicit "ready" signal instead of networkidle (testing §6): the page heading is shown and fonts are loaded.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.locator("#names").fill("the followers");
  for (let i = 0; i < 3 && Number(await page.locator("[data-teams-value]").textContent()) < 3; i++) await page.getByRole("button", { name: "More teams" }).click();
  await page.getByRole("button", { name: "Generate teams" }).click();
  await expect(page.getByRole("article")).toHaveCount(3);
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
  await page.evaluate(() => { document.querySelectorAll(".toast").forEach((t) => { t.remove(); }); });
}
