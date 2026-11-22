// What the team screen reaches through the contract's host services (`context.shell`: toast,
// confirm, share) lives in the host's own UI, outside the mini-app root. Mini-app specs find it only
// here: ONE place to adapt per host. `E2E_HOST` selects it ("standalone" by default; Quizzard's
// project `teams` sets "quizzard").
import type { Locator, Page } from "@playwright/test";

/** Where a host shows the contract's services. */
interface HostUi {
  /** Every toast region (page-level, or inside an open sheet). */
  readonly toasts: (page: Page) => Locator;
  /** The question `shell.confirm` asks. */
  readonly confirmDialog: (page: Page) => Locator;
  /** The WhatsApp + Copy sheet `shell.share` opens where the device has no share sheet. */
  readonly shareSheet: (page: Page) => Locator;
  /** The app the last line of copied and shared teams names: "— Made with <name><count> · <url>". */
  readonly attribution: { readonly name: string; readonly url: string };
}

/**
 * The forge template's toast region, alert and share sheet (this repo's app/src/ui).
 * Quizzard's app/src/ui (toast.ts, confirm.ts, dialog.ts + share.ts at Quizzard 9615996) builds the
 * same parts with the same hooks, so it shares this entry until one of them changes.
 */
const FORGE_SHELL = {
  toasts: (page: Page) => page.locator("[data-toasts]"),
  confirmDialog: (page: Page) => page.getByRole("alertdialog"),
  shareSheet: (page: Page) => page.locator('dialog[data-dialog="share"]'),
};

const HOSTS = {
  standalone: { ...FORGE_SHELL, attribution: { name: "TeamSync", url: "https://simeontsvetanov.github.io/teamsync-random-team-generator/" } },
  // Quizzard names itself in the line (it passes `attribution-name` / `attribution-url` to the screen).
  quizzard: { ...FORGE_SHELL, attribution: { name: "Quizzard", url: "https://simeontsvetanov.github.io/Quizzard/" } },
} as const satisfies Record<string, HostUi>;

function isHostName(name: string): name is keyof typeof HOSTS {
  return Object.hasOwn(HOSTS, name);
}

/**
 * Returns the UI of the host under test.
 * @throws {@link Error} `E2E_HOST_UNKNOWN` for an `E2E_HOST` that has no entry here
 */
function hostUi(): HostUi {
  const name = process.env["E2E_HOST"] ?? "standalone";
  if (!isHostName(name)) throw new Error(`E2E_HOST_UNKNOWN: ${name} (known: ${Object.keys(HOSTS).join(", ")})`);
  return HOSTS[name];
}

/** Returns the host's toast regions (`context.shell.toast`). */
export function toasts(page: Page): Locator {
  return hostUi().toasts(page);
}

/** Returns the host's confirmation alert (`context.shell.confirm`). */
export function confirmDialog(page: Page): Locator {
  return hostUi().confirmDialog(page);
}

/** Returns the host's fallback share sheet (`context.shell.share` without a native share sheet). */
export function shareSheet(page: Page): Locator {
  return hostUi().shareSheet(page);
}

/** Returns the app name and address the host puts in the last line of copied and shared teams. */
export function attribution(): HostUi["attribution"] {
  return hostUi().attribution;
}
