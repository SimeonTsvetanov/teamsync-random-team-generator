// The eager description of the Teams mini-app (contract `MiniAppMeta`): Quizzard's Home card,
// route and Settings → Data read it without loading the body; app/ reads its storage area.
import type { MiniAppMeta } from "./contract.ts";

/**
 * The Teams mini-app's meta.
 * @remarks
 * - `icon` is a path relative to the host page, not a bundled asset: each host serves its own mark
 *   there (Quizzard: `miniapps/teams.svg`, PLAN T-18) or replaces the field. The standalone site
 *   shows no mini-app icon, so the package ships none and needs no bundler plugin.
 * - `storage` is the standalone site's real area (Quizzard PLAN §1.1 item 8). The body writes only
 *   `names` (the last list; removed when empty) and `teams` (the stepper value) under the prefix.
 *   The standalone shell keeps its own prefs under the same prefix (`theme`, `lang`,
 *   `last-seen-version`, `install-dismissed-at`, `report-queue`, `persist-offered`, `draft:*`);
 *   there are no keys outside it, no IndexedDB database and no OPFS folder.
 */
export const meta: MiniAppMeta = {
  contract: 1,
  id: "teams",
  name: { en: "Teams", bg: "Отбори" },
  tagline: { en: "Fair random teams in seconds", bg: "Честни случайни отбори за секунди" },
  icon: "miniapps/teams.svg",
  languages: ["en", "bg"],
  status: "ready",
  storage: { prefix: "teamsync-random-team-generator:v1:" },
};

/**
 * The standalone TeamSync site; copied and shared teams end with it (the attribution line).
 * @remarks = `app.config.url` (scripts/miniapp-sync.test.ts); kept here because the package never
 * imports the repo's app.config.ts.
 */
export const STANDALONE_URL = "https://simeontsvetanov.github.io/teamsync-random-team-generator/";
