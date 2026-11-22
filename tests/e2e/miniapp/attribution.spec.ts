import { expect, test, type Locator, type Page } from "@playwright/test";
import { openApp } from "../support/entry.ts";
import { shareSheet } from "../support/host.ts";

// The last line of copied and shared teams (DECISIONS 2026-11-22): "— Made with <app><count> · <url>",
// the count = shuffles in a row of the same people. Runs in both hosts, so the app name and address
// are read from the line, never assumed. Copy is captured by a clipboard stub that works in every
// browser (the real clipboard needs Chromium-only permissions).
const ROSTER = "Ana\nBoris\nVesko\nGergana";
const LINE = /^— Made with (?<name>.+?)(?<count>\d+) · (?<url>https:\/\/\S+)$/u;

/** Replaces the Clipboard API with one that records each text written (before the app loads). */
const captureCopies = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const copies: string[] = [];
    Object.defineProperty(window, "e2eCopies", { value: copies });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: (text: string): Promise<void> => { copies.push(text); return Promise.resolve(); } },
    });
  });
};
const copies = (page: Page): Promise<string[]> =>
  // because captureCopies defined it on window before any page script ran.
  page.evaluate(() => [...(window as unknown as { e2eCopies: string[] }).e2eCopies]);

/** Presses Copy and returns the last line of the text it wrote. */
const copyLastLine = async (page: Page, root: Locator): Promise<string> => {
  const before = (await copies(page)).length;
  await root.getByRole("button", { name: "Copy", exact: true }).click();
  await expect.poll(async () => (await copies(page)).length).toBe(before + 1);
  return (await copies(page)).at(-1)?.split("\n").at(-1) ?? "";
};
const countIn = (line: string): number => Number(LINE.exec(line)?.groups?.["count"]);
const generate = (root: Locator) => root.getByRole("button", { name: "Generate teams" }).click();
const shuffleAgain = (root: Locator) => root.getByRole("button", { name: "Shuffle again" }).click();
const editNames = async (root: Locator, text: string): Promise<void> => {
  const back = root.locator("[data-results-back]");
  const names = root.locator("#names");
  // Phones: results are the next screen, reached by a transition. A one-shot look at the Back button
  // can come before it is there (mobile WebKit in CI, 2026-11-22), so retry until the list is editable.
  await expect(async () => {
    if (await back.isVisible()) await back.click();
    await expect(names).toBeEditable({ timeout: 1000 });
  }).toPass();
  await names.fill(text);
};

test("the copied line counts shuffles of the same people and starts again when they change; Share says the same", async ({ page }) => {
  await captureCopies(page);
  const root = await openApp(page);
  await editNames(root, ROSTER);
  await generate(root);
  const first = await copyLastLine(page, root);
  expect(first).toMatch(LINE);
  expect(countIn(first)).toBe(1);
  await shuffleAgain(root);
  expect(countIn(await copyLastLine(page, root))).toBe(2);
  await editNames(root, " gergana\nVESKO\n\nboris  \nAna"); // other order, case, spaces: the same people
  await generate(root);
  const third = await copyLastLine(page, root);
  expect(countIn(third)).toBe(3);
  expect(await copyLastLine(page, root)).toBe(third); // copying again: the same teams, the same number
  await editNames(root, `${ROSTER}\nDimitar`); // one more person: another game
  await generate(root);
  const fresh = await copyLastLine(page, root);
  expect(countIn(fresh)).toBe(1);
  // Share sends the same text: without a native share sheet the host offers WhatsApp + Copy.
  await page.evaluate(() => { Object.defineProperty(navigator, "share", { value: undefined, configurable: true }); });
  await root.getByRole("button", { name: "Share", exact: true }).click();
  await expect(shareSheet(page).locator("a").first()).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/u);
  const href = await shareSheet(page).locator("a").first().getAttribute("href");
  expect(decodeURIComponent(href ?? "").split("\n").at(-1)).toBe(fresh);
});

test("the count survives a reload and goes on with the same people", async ({ page }) => {
  await captureCopies(page);
  const root = await openApp(page);
  await editNames(root, ROSTER);
  await generate(root);
  await shuffleAgain(root);
  expect(countIn(await copyLastLine(page, root))).toBe(2);
  await page.reload(); // keeps a hash route
  await expect(root.locator("#names")).toHaveValue(ROSTER);
  await generate(root);
  expect(countIn(await copyLastLine(page, root))).toBe(3);
});
