// Translates the static markup of the team screen (screen.html) — the body's part of what the
// standalone app's `applyStatic()` did for the whole page before TS-01.
import type { TextKey, Translate } from "./translate.ts";

/**
 * Sets `data-teams-i18n` texts and `data-teams-i18n-aria-label` labels under `root`.
 * @remarks Own attribute names, so a host's page-wide `data-i18n` pass never touches the body.
 */
export function translateSubtree(root: ParentNode, t: Translate): void {
  root.querySelectorAll<HTMLElement>("[data-teams-i18n]").forEach((element) => {
    element.textContent = t(textKey(element.dataset["teamsI18n"]));
  });
  root.querySelectorAll<HTMLElement>("[data-teams-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(textKey(element.dataset["teamsI18nAriaLabel"])));
  });
}

function textKey(value: string | undefined): TextKey {
  // because the keys in screen.html are this package's own; i18n.test.ts checks each one exists.
  return (value ?? "") as TextKey;
}
