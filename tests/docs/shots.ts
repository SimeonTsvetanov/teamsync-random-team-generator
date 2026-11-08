// The screenshots the user docs use (forge-engineering → user-docs §6). The docs-writer agent adds
// one entry per image a page needs; `pnpm docs:images` writes docs/images/<page>/<name>-{light,dark}.png.
import type { Locator, Page } from "@playwright/test";

/** Sample names only (user-docs §5: real-looking, mixed). */
const SAMPLE_NAMES = ["Maria", "Liam", "Aisha", "Kenji", "Elena", "Diego", "Priya", "Tom", "Fatima", "Lucas", "Ana", "Noah"];

/** Types the sample list and picks 3 teams. */
async function fillForm(page: Page): Promise<void> {
  await page.locator("#names").fill(SAMPLE_NAMES.join("\n"));
  await page.getByRole("button", { name: "More teams" }).click();
  await page.locator("[data-teams-value]").filter({ hasText: "3" }).waitFor();
}

/** One docs image: where it goes, how to reach the state, and what to crop to. */
export interface DocsShot {
  /** Page folder under docs/images/, e.g. "create-teams" for docs/how-to/create-teams.md. */
  readonly page: string;
  /** Image name without theme suffix, e.g. "result". */
  readonly name: string;
  /** Viewport: "phone" (390×844) or "desktop" (1280×800). */
  readonly device: "phone" | "desktop";
  /** Brings the app into the state to capture (sample data only — never personal data). */
  readonly setUp: (page: Page) => Promise<void>;
  /** Part of the page to crop to; whole viewport when omitted. */
  readonly crop?: (page: Page) => Locator;
  /** Parts to cover with a solid mask (personal or changing data). */
  readonly mask?: (page: Page) => Locator[];
  /** Keep toasts visible — only for an image that documents a toast (hidden by default). */
  readonly showToasts?: boolean;
}

/**
 * Every docs image, added by the docs-writer agent with the page that embeds it (an image no page
 * uses fails `pnpm docs:check`). Example:
 * `{ page: "create-teams", name: "result", device: "phone", setUp: async (page: Page): Promise<void> => { … }, crop: (page) => page.locator(".results") }`
 */
export const DOCS_SHOTS: readonly DocsShot[] = [
  {
    page: "create-teams", name: "form", device: "phone",
    setUp: async (page: Page): Promise<void> => {
      await fillForm(page);
      // On a phone the card fills the screen and the names box stretches with it; for the picture the
      // card hugs the sample list, so the image shows no tall empty box.
      await page.addStyleTag({ content: ".tool { min-height: auto; } #names { field-sizing: content; height: auto; }" });
    },
    crop: (page) => page.locator(".tool"),
  },
  {
    page: "create-teams", name: "result", device: "phone",
    setUp: async (page: Page): Promise<void> => {
      await fillForm(page);
      await page.getByRole("button", { name: "Generate teams" }).click();
      await page.locator("[data-results]").waitFor();
    },
    crop: (page) => page.locator("[data-results]"),
  },
  {
    page: "share-results", name: "share-sheet", device: "desktop",
    setUp: async (page: Page): Promise<void> => {
      await fillForm(page);
      await page.getByRole("button", { name: "Generate teams" }).click();
      // Most desktop browsers have no share sheet: TeamSync then offers WhatsApp and Copy.
      await page.evaluate(() => { Object.defineProperty(navigator, "share", { value: undefined, configurable: true }); });
      await page.locator("[data-share]").click();
      await page.locator("dialog[data-dialog=share]").waitFor();
    },
    crop: (page) => page.locator("dialog[data-dialog=share]"),
  },
];
