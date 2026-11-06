import type { Page } from "@playwright/test";

/** TeamSync sample state for the manifest screenshots: the followers in 3 teams. */
export async function prepare(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.locator("#names").fill("the followers");
  for (let i = 0; i < 3 && Number(await page.locator("[data-teams-value]").textContent()) < 3; i++) await page.getByRole("button", { name: "More teams" }).click();
  await page.getByRole("button", { name: "Generate teams" }).click();
  await page.locator(".team-card").first().waitFor();
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
  await page.evaluate(() => { document.querySelectorAll(".toast").forEach((t) => { t.remove(); }); });
}
