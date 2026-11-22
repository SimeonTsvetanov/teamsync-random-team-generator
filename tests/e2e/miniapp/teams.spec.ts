import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openApp } from "../support/entry.ts";
import { attribution, confirmDialog, shareSheet, toasts } from "../support/host.ts";

// TeamSync's team screen — acceptance criteria from docs/SPEC.md §9. Runs on the standalone page
// and inside Quizzard (`#/teams`): only the screen's root and the host services of the contract
// (support/host.ts) are touched; the standalone shell's own parts are in tests/e2e/shell.
const FOLLOWERS = ["Moni", "Iliyana", "George", "Viki", "Eli", "Asen", "Lubomir", "Ralica", "Venci", "Slavi", "Joni", "Apapa", "Mitaka G", "Tonkata", "Dinkata", "Keti", "Raiko", "Tancheto"];
const names = (n: number): string => Array.from({ length: n }, (_, i) => `Player ${String(i + 1)}`).join("\n");
const serious = async (page: Page): Promise<string[]> => {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)))); // axe mis-measures contrast while anything fades in
  return (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations
    .filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id);
};
const generate = (root: Locator) => root.getByRole("button", { name: "Generate teams" }).click();
// Phones show results as the next screen; go back to the names before editing them.
const backToNames = async (root: Locator): Promise<void> => {
  const back = root.locator("[data-results-back]");
  if (await back.isVisible()) await back.click();
};
const setTeams = async (root: Locator, n: number): Promise<void> => {
  const value = root.locator("[data-teams-value]");
  for (let i = 0; i < 10 && Number(await value.textContent()) > n; i++) await root.getByRole("button", { name: "Fewer teams" }).click();
  for (let i = 0; i < 10 && Number(await value.textContent()) < n; i++) await root.getByRole("button", { name: "More teams" }).click();
};

test("AC1: 10 names → 2 teams of 5; 11 names → 4/4/3; every name once", async ({ page }) => {
  const root = await openApp(page);
  await root.locator("#names").fill(names(10));
  await setTeams(root, 2);
  await generate(root);
  const cards = root.getByRole("article");
  await expect(cards).toHaveCount(2);
  for (const c of await cards.all()) await expect(c.getByRole("listitem")).toHaveCount(5);
  await backToNames(root);
  await root.locator("#names").fill(names(11));
  await setTeams(root, 3);
  await generate(root);
  await expect(cards).toHaveCount(3);
  const sizes = await Promise.all((await cards.all()).map((c) => c.getByRole("listitem").count()));
  expect(sizes).toEqual([4, 4, 3]);
  const all = (await root.getByRole("article").getByRole("listitem").allTextContents()).sort();
  expect(all).toEqual(names(11).split("\n").sort());
  expect(await serious(page)).toEqual([]);
});

test("AC3: Copy gives the team text with the attribution line", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions are Chromium-only in Playwright");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const root = await openApp(page);
  await root.locator("#names").fill("Ana\nBoris\nVesko\nGergana");
  await generate(root);
  await root.getByRole("button", { name: "Copy" }).click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text.startsWith("✨ TEAMS GENERATED ✨")).toBe(true);
  expect(text).toContain("🏆 Team 1 | Members - 2");
  // The first shuffle of these names: count 1 fused to the name (DECISIONS 2026-11-22).
  expect(text.trim().endsWith(`— Made with ${attribution().name}1 · ${attribution().url}`)).toBe(true);
});

// The address following the stepper is the standalone page's: shell/teams-standalone.spec.ts.
test("AC4: more teams than names shows a clear message; ?teams=4 pre-selects 4", async ({ page }) => {
  const root = await openApp(page, { query: "teams=4" });
  await expect(root.locator("[data-teams-value]")).toHaveText("4");
  await root.locator("#names").fill("Ana\nBoris\nVesko");
  await generate(root);
  await expect(root.getByRole("alert")).toContainText("You have 3 names");
  await expect(root.getByRole("article")).toHaveCount(0);
  expect(await serious(page)).toEqual([]);
});

test("AC5: typing 'the followers' on its own line expands to the 18 names", async ({ page }) => {
  const root = await openApp(page);
  const area = root.locator("#names");
  await area.fill("Ana\n");
  await area.pressSequentially("The Followers");
  await expect(area).toHaveValue(["Ana", ...FOLLOWERS].join("\n"));
  await expect(root.locator("[data-names-count]")).toHaveText("19 names");
});

// "Clear my data" is the standalone Settings: shell/teams-standalone.spec.ts.
test("AC6: the list survives a reload; Clear has Undo", async ({ page }) => {
  const root = await openApp(page);
  const area = root.locator("#names");
  await area.fill("Ana\nBoris");
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).some((k) => k.endsWith(":v1:names")))).toBe(true); // debounced save done
  await page.reload(); // keeps a hash route
  await expect(area).toHaveValue("Ana\nBoris");
  await root.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(area).toHaveValue("");
  await toasts(page).getByRole("button", { name: "Undo" }).click();
  await expect(area).toHaveValue("Ana\nBoris");
});

test("dark mode: results and errors keep WCAG AA contrast", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  const root = await openApp(page, { query: "teams=3" });
  await root.locator("#names").fill(names(9));
  await generate(root);
  await expect(root.getByRole("article")).toHaveCount(3);
  expect(await serious(page)).toEqual([]);
  await backToNames(root);
  await root.locator("#names").fill("Ana");
  await generate(root);
  await expect(root.getByRole("alert")).toBeVisible();
  expect(await serious(page)).toEqual([]);
  await context.close();
});

// Text shared into the app (Android share target) is the standalone page's: shell/teams-standalone.spec.ts.
test("WhatsApp: pasting a chat list keeps only the names; Share offers WhatsApp", async ({ page, browserName }) => {
  const root = await openApp(page);
  const area = root.locator("#names");
  // Firefox ignores clipboardData on synthetic paste events, so the paste part runs elsewhere.
  if (browserName !== "firefox") {
    await area.focus();
    await area.evaluate((el) => {
      const dt = new DataTransfer();
      dt.setData("text/plain", "[06.11.26, 18:03] Moni: 1. Ana\n[06.11.26, 18:03] Moni: 2. Boris\n⚽ Vesko");
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    await expect(area).toHaveValue("Ana\nBoris\nVesko");
  }

  await area.fill("Gergana\nDimitar\nElena\nFani");
  await generate(root);
  // One Share button: without a native share sheet the host offers WhatsApp + Copy.
  await page.evaluate(() => { Object.defineProperty(navigator, "share", { value: undefined, configurable: true }); });
  await root.getByRole("button", { name: "Share", exact: true }).click();
  const href = await shareSheet(page).locator("a").getAttribute("href");
  expect(href?.startsWith("https://wa.me/?text=")).toBe(true);
  expect(decodeURIComponent(href ?? "")).toContain("🏆 Team 1 | Members - 2");
});

test("Clear and start over asks first, then empties the list and returns to the first screen", async ({ page }) => {
  const root = await openApp(page);
  await root.locator("#names").fill("Ana\nBoris\nVesko");
  await generate(root);
  await root.getByRole("button", { name: "Clear and start over" }).click();
  await confirmDialog(page).getByRole("button", { name: "Cancel" }).click();
  await expect(root.getByRole("article")).toHaveCount(2);
  await root.getByRole("button", { name: "Clear and start over" }).click();
  await confirmDialog(page).getByRole("button", { name: "Clear", exact: true }).click();
  await expect(root.locator("[data-results]")).toBeHidden();
  await expect(root.locator("#names")).toBeVisible();
  await expect(root.locator("#names")).toHaveValue("");
  await page.reload(); // keeps a hash route
  await expect(root.locator("#names")).toHaveValue("");
});
