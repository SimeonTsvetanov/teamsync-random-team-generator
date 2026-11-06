import type { Page } from "@playwright/test";

/** Puts the app into a good-looking state with sample data before the screenshots (edit per app). */
export async function prepare(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}
