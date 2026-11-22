// The one way a mini-app spec (tests/e2e/miniapp) opens the team screen, in whichever host runs the
// suite: this repo's standalone page, or Quizzard (its PLAN §1.4/T-11: Playwright project `teams`,
// its own baseURL, `E2E_MINIAPP_HASH="#/teams"`). Shell specs (tests/e2e/shell) are standalone-only
// and navigate directly.
import { expect, type Locator, type Page } from "@playwright/test";

/** The mini-app's hash route in the host under test (`#/teams` in Quizzard); empty standalone. */
const MINIAPP_HASH = process.env["E2E_MINIAPP_HASH"] ?? "";

/** Options of {@link openApp}. */
export interface OpenAppOptions {
  /** Launch parameters without `?` (contract `context.query`), e.g. `"teams=4"`. */
  readonly query?: string;
}

/**
 * Returns the address of the team screen relative to the baseURL.
 * @remarks Standalone the launch parameters are the page's query (`./?teams=4`); behind a hash
 * route they follow the route (`./#/teams?teams=4`), which is where Quizzard's router reads them.
 */
export function appUrl({ query }: OpenAppOptions = {}): string {
  const search = query ? `?${query}` : "";
  return MINIAPP_HASH ? `./${MINIAPP_HASH}${search}` : `./${search}`;
}

/**
 * Returns the root of the team screen: the `[data-workspace]` element `screen.html` starts with.
 * @remarks Both hosts have exactly one: the standalone page serves it inside `<main>` (whose hero,
 * steps and FAQ are the page's, not the mini-app's) and Quizzard renders it as the only child of
 * `[data-miniapp="teams"]`. The live 1.0.2 site has it too, so this helper works there unchanged.
 */
export function miniAppRoot(page: Page): Locator {
  return page.locator("[data-workspace]");
}

/**
 * Opens the team screen and waits until it is on screen (Quizzard loads it as a lazy chunk).
 * Reloading keeps the hash, so `page.reload()` stays valid in both hosts.
 * @returns the screen's root; scope locators to it where a selector could also match host UI
 */
export async function openApp(page: Page, options?: OpenAppOptions): Promise<Locator> {
  await page.goto(appUrl(options));
  const root = miniAppRoot(page);
  await expect(root).toBeVisible();
  return root;
}
