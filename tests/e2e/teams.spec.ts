import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// TeamSync app flows — acceptance criteria from docs/SPEC.md §9.
const FOLLOWERS = ["Moni", "Iliyana", "George", "Viki", "Eli", "Asen", "Lubomir", "Ralica", "Venci", "Slavi", "Joni", "Apapa", "Mitaka G", "Tonkata", "Dinkata", "Keti", "Raiko", "Tancheto"];
const names = (n: number): string => Array.from({ length: n }, (_, i) => `Player ${String(i + 1)}`).join("\n");
const serious = async (page: Page): Promise<string[]> => {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)))); // axe mis-measures contrast while anything fades in
  return (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations
    .filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id);
};
const generate = (page: Page) => page.getByRole("button", { name: "Generate teams" }).click();
// Phones show results as the next screen; go back to the names before editing them.
const backToNames = async (page: Page): Promise<void> => {
  const back = page.locator("[data-results-back]");
  if (await back.isVisible()) await back.click();
};
const setTeams = async (page: Page, n: number): Promise<void> => {
  for (let i = 0; i < 10 && Number(await page.locator("[data-teams-value]").textContent()) > n; i++) await page.getByRole("button", { name: "Fewer teams" }).click();
  for (let i = 0; i < 10 && Number(await page.locator("[data-teams-value]").textContent()) < n; i++) await page.getByRole("button", { name: "More teams" }).click();
};

test("AC1: 10 names → 2 teams of 5; 11 names → 4/4/3; every name once", async ({ page }) => {
  await page.goto("./");
  await page.locator("#names").fill(names(10));
  await setTeams(page, 2);
  await generate(page);
  const cards = page.locator(".team-card");
  await expect(cards).toHaveCount(2);
  for (const c of await cards.all()) await expect(c.locator("li")).toHaveCount(5);
  await backToNames(page);
  await page.locator("#names").fill(names(11));
  await setTeams(page, 3);
  await generate(page);
  await expect(cards).toHaveCount(3);
  const sizes = await Promise.all((await cards.all()).map((c) => c.locator("li").count()));
  expect(sizes).toEqual([4, 4, 3]);
  const all = (await page.locator(".team-card li").allTextContents()).sort();
  expect(all).toEqual(names(11).split("\n").sort());
  expect(await serious(page)).toEqual([]);
});

test("AC3: Copy gives the team text with the attribution line", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions are Chromium-only in Playwright");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./");
  await page.locator("#names").fill("Ana\nBoris\nVesko\nGergana");
  await generate(page);
  await page.getByRole("button", { name: "Copy" }).click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text.startsWith("✨ TEAMS GENERATED ✨")).toBe(true);
  expect(text).toContain("🏆 Team 1 | Members - 2");
  expect(text.trim().endsWith("— Made with TeamSync · https://simeontsvetanov.github.io/teamsync-random-team-generator/")).toBe(true);
});

test("AC4: more teams than names shows a clear message; ?teams=4 pre-selects 4", async ({ page }) => {
  await page.goto("./?teams=4");
  await expect(page.locator("[data-teams-value]")).toHaveText("4");
  await page.locator("#names").fill("Ana\nBoris\nVesko");
  await generate(page);
  await expect(page.getByRole("alert")).toContainText("You have 3 names");
  await expect(page.locator(".team-card")).toHaveCount(0);
  expect(await serious(page)).toEqual([]);
  await page.getByRole("button", { name: "More teams" }).click();
  await expect(page).toHaveURL(/teams=5/);
});

test("AC5: typing 'the followers' on its own line expands to the 18 names", async ({ page }) => {
  await page.goto("./");
  const area = page.locator("#names");
  await area.fill("Ana\n");
  await area.pressSequentially("The Followers");
  await expect(area).toHaveValue(["Ana", ...FOLLOWERS].join("\n"));
  await expect(page.locator("[data-names-count]")).toHaveText("19 names");
});

test("AC6: the list survives a reload; Clear has Undo; Clear my data removes it", async ({ page }) => {
  await page.goto("./");
  const area = page.locator("#names");
  await area.fill("Ana\nBoris");
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).some((k) => k.endsWith(":v1:names")))).toBe(true); // debounced save done
  await page.reload();
  await expect(area).toHaveValue("Ana\nBoris");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(area).toHaveValue("");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(area).toHaveValue("Ana\nBoris");
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
  await expect(page.locator(".team-card h3").first()).toHaveText("Отбор 1");
});

test("dark mode: results and errors keep WCAG AA contrast", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("./?teams=3");
  await page.locator("#names").fill(names(9));
  await generate(page);
  await expect(page.locator(".team-card")).toHaveCount(3);
  expect(await serious(page)).toEqual([]);
  await backToNames(page);
  await page.locator("#names").fill("Ana");
  await generate(page);
  await expect(page.getByRole("alert")).toBeVisible();
  expect(await serious(page)).toEqual([]);
  await context.close();
});

test("WhatsApp: pasting a chat list keeps only the names; shared text arrives via Share → TeamSync; Share offers WhatsApp", async ({ page, browserName }) => {
  await page.goto("./");
  const area = page.locator("#names");
  // Firefox ignores clipboardData on synthetic paste events, so the paste part runs elsewhere.
  if (browserName !== "firefox") {
  await area.focus();
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.setData("text/plain", "[06.11.26, 18:03] Moni: 1. Ana\n[06.11.26, 18:03] Moni: 2. Boris\n⚽ Vesko");
    document.querySelector("#names")?.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await expect(area).toHaveValue("Ana\nBoris\nVesko");
  }

  await page.goto("./?share-target=1&title=&text=" + encodeURIComponent("- Gergana\n- Dimitar\n- Elena\n- Fani") + "&url=");
  await expect(area).toHaveValue("Gergana\nDimitar\nElena\nFani");
  await expect(page.getByText("4 names added from the shared text")).toBeVisible();
  await expect.poll(() => page.evaluate(() => location.search)).not.toContain("share-target");

  await generate(page);
  // One Share button: without a native share sheet it offers WhatsApp + Copy.
  await page.evaluate(() => { Object.defineProperty(navigator, "share", { value: undefined, configurable: true }); });
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const href = await page.locator('dialog[data-dialog="share"] a').getAttribute("href");
  expect(href?.startsWith("https://wa.me/?text=")).toBe(true);
  expect(decodeURIComponent(href ?? "")).toContain("🏆 Team 1 | Members - 2");
});

test("Clear and start over asks first, then empties the list and returns to the first screen", async ({ page }) => {
  await page.goto("./");
  await page.locator("#names").fill("Ana\nBoris\nVesko");
  await generate(page);
  await page.getByRole("button", { name: "Clear and start over" }).click();
  const alert = page.getByRole("alertdialog");
  await alert.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator(".team-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Clear and start over" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.locator("[data-results]")).toBeHidden();
  await expect(page.locator("#names")).toBeVisible();
  await expect(page.locator("#names")).toHaveValue("");
  await page.reload();
  await expect(page.locator("#names")).toHaveValue("");
});
