import { expect, test } from "@playwright/test";
import { app } from "../../app.config.ts";

// UI languages (forge-app-shell → i18n). English is always the default; extra languages are
// opt-in via Settings or ?lang=xx and remembered per device. Skipped for English-only apps.
const langs: readonly string[] = app.languages;
const other = langs.find((l) => l !== "en");

test("English is the default and the static page is English", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("[data-menu-open]")).toHaveAttribute("aria-label", "Open menu");
});

test.describe("second language", () => {
  test.skip(!other, "English-only app");
  const lang = other ?? "";

  test("?lang= translates the shell for this visit only", async ({ page }) => {
    await page.goto(`./?lang=${lang}`);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator("[data-menu-open]")).not.toHaveAttribute("aria-label", "Open menu");
    await page.goto("./");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("Settings → Language switches, is remembered, and back to English works", async ({ page }) => {
    await page.goto("./#settings");
    await page.locator(`label[for="lang-${lang}"]`).click();
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator('dialog[data-dialog="settings"][open] h2')).not.toHaveText("Settings");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await page.goto("./#settings");
    await page.locator('label[for="lang-en"]').click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('dialog[data-dialog="settings"][open] h2')).toHaveText("Settings");
  });
});
