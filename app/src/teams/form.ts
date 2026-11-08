// Form helpers of the main screen: names count, Clear link, teams stepper and the error line.
// Used by view.ts, names-input.ts, results.ts and result-actions.ts.
import { MAX_TEAMS, MIN_TEAMS, parseNames } from "@simeonts/teamsync-random-team-generator-core";
import { t } from "../i18n/index.ts";
import type { TeamsScreen } from "./screen.ts";
import { clampTeams, saved, writeTeamsToUrl } from "./state.ts";

/** Returns how many names the text holds after parsing (0 when it has none or is invalid). */
export function countNames(text: string): number {
  const names = parseNames(text);
  return names.ok ? names.value.length : 0;
}

/** Shows the error line under the form (null hides it) and marks the names box invalid. */
export function showError(screen: TeamsScreen, message: string | null): void {
  const { error, area } = screen.el;
  error.hidden = message === null;
  error.textContent = message ?? "";
  area.setAttribute("aria-invalid", String(message !== null));
}

/** Updates the "N names" count and shows Clear only while the box has text. */
export function renderCount(screen: TeamsScreen): void {
  const { area, count, clear } = screen.el;
  const names = countNames(area.value);
  count.textContent = names ? t("app.namesCount", { count: names }) : "";
  clear.hidden = !area.value.trim();
}

/**
 * Shows the number of teams and marks − / + unavailable at the ends of the range with
 * `aria-disabled` — still focusable, so keyboard focus never drops to <body> (accessibility §3).
 */
export function renderStepper(screen: TeamsScreen): void {
  const { teamsValue, decrease, increase } = screen.el;
  teamsValue.textContent = String(screen.teams);
  decrease.setAttribute("aria-disabled", String(screen.teams <= MIN_TEAMS));
  increase.setAttribute("aria-disabled", String(screen.teams >= MAX_TEAMS));
}

/** Sets the number of teams (clamped), remembers it and keeps `?teams=` in the address bar. */
export function setTeams(screen: TeamsScreen, teams: number): void {
  screen.teams = clampTeams(teams);
  saved.setTeams(screen.teams);
  writeTeamsToUrl(screen.teams);
  renderStepper(screen);
  showError(screen, null);
}

/** Replaces the names list, remembers it on this device and updates the count. */
export function setNames(screen: TeamsScreen, text: string): void {
  screen.el.area.value = text;
  saved.setNames(text);
  renderCount(screen);
}
