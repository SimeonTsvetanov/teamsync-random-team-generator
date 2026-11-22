import { expect, test } from "@playwright/test";

// What only the standalone page adds around the team screen (split from the former teams.spec.ts in
// PLAN TS-02): the `?teams=` address, Settings → Clear my data and Language, `?lang=` and the
// Android share target. The screen's own flows are in tests/e2e/miniapp/teams.spec.ts.

test("AC4: the address keeps ?teams= in step with the stepper", async ({ page }) => {
  await page.goto("./?teams=4");
  await expect(page.locator("[data-teams-value]")).toHaveText("4");
  await page.getByRole("button", { name: "More teams" }).click();
  await expect(page).toHaveURL(/teams=5/);
});

test("AC6: Clear my data removes the saved list", async ({ page }) => {
  await page.goto("./");
  await page.locator("#names").fill("Ana\nBoris");
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).some((k) => k.endsWith(":v1:names")))).toBe(true); // debounced save done
  await page.goto("./#settings");
  await page.getByRole("button", { name: "Clear my data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Your data was cleared ✓")).toBeVisible(); // clearing finished
  await page.goto("./");
  await expect(page.locator("#names")).toHaveValue("");
});

test("AC7: English first; Bulgarian via Settings is remembered; ?lang=bg for one visit", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("button", { name: "Generate teams" })).toBeVisible();
  await page.goto("./?lang=bg");
  await expect(page.getByRole("button", { name: "Направи отбори" })).toBeVisible();
  await page.goto("./");
  await expect(page.getByRole("button", { name: "Generate teams" })).toBeVisible();
  await page.goto("./#settings");
  await page.locator('label[for="lang-bg"]').click();
  await page.goto("./");
  await expect(page.getByRole("button", { name: "Направи отбори" })).toBeVisible();
  await page.locator("#names").fill("Ана\nБорис");
  await page.getByRole("button", { name: "Направи отбори" }).click();
  await expect(page.getByRole("article", { name: "Отбор 1" })).toBeVisible();
});

test("WhatsApp: shared text arrives via Share → TeamSync", async ({ page }) => {
  await page.goto(`./?share-target=1&title=&text=${encodeURIComponent("- Gergana\n- Dimitar\n- Elena\n- Fani")}&url=`);
  const area = page.locator("#names");
  await expect(area).toHaveValue("Gergana\nDimitar\nElena\nFani");
  await expect(page.getByText("4 names added from the shared text")).toBeVisible();
  await expect.poll(() => page.evaluate(() => location.search)).not.toContain("share-target");
});
