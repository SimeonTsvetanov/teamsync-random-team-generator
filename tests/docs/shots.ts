// The screenshots the user docs use (forge-engineering → user-docs §6). The docs-writer agent adds
// one entry per image a page needs; `pnpm docs:images` writes docs/images/<page>/<name>-{light,dark}.png.
import type { Locator, Page } from "@playwright/test";

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
export const DOCS_SHOTS: readonly DocsShot[] = [];
