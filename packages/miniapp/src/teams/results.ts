// Results of the team screen: Generate (names → fair random teams), the team cards and clearing
// them. Used by mount.ts and result-actions.ts.
import { makeTeams, parseNames } from "@simeonts/teamsync-random-team-generator-core";
import { h } from "../dom/h.ts";
import { withTransition } from "../dom/transition.ts";
import { emitTeamsEvent } from "../host-api.ts";
import { countShuffle } from "./attribution.ts";
import { renderCount, showError } from "./form.ts";
import type { TeamsScreen } from "./screen.ts";

/** Options for {@link renderResults}. */
export interface RenderResultsOptions {
  /** Announce to screen readers and scroll to the teams (a fresh result, not a re-render). */
  readonly announce: boolean;
}

function teamCard(screen: TeamsScreen, members: readonly string[], index: number): HTMLElement {
  const id = `team-${String(index + 1)}`;
  return h("article", { class: "team-card", "aria-labelledby": id },
    h("header", { class: "team-head" },
      h("h3", { id }, screen.t("teamTitle", { n: index + 1 })),
      h("span", { class: "chip" }, screen.t("membersCount", { count: members.length }))),
    h("ol", { class: "team-list" }, ...members.map((member) => h("li", {}, member))));
}

/** True when the focused element is still on screen (not <body>, not inside hidden content). */
function isFocusVisible(): boolean {
  const focused = document.activeElement;
  return focused instanceof HTMLElement && focused !== document.body && focused.checkVisibility();
}

/**
 * Shows the teams as cards; on phones this switches to the results screen. Also remembers them
 * as `screen.last`, which Copy, Share and relabelling read.
 */
export function renderResults(screen: TeamsScreen, teams: string[][], { announce }: RenderResultsOptions): void {
  const { workspace, grid, results, status } = screen.el;
  screen.last = teams;
  withTransition(() => {
    workspace.classList.add("has-results");
    grid.replaceChildren(...teams.map((members, index) => teamCard(screen, members, index)));
    results.hidden = false;
    // Phones swap to the results screen and hide the focused Generate button: move focus to the
    // results heading instead of letting it drop to <body> (accessibility §3). Inside the
    // transition callback, because that is when the swap happens.
    if (announce && !isFocusVisible()) screen.el.resultsTitle.focus({ preventScroll: true });
  });
  if (!announce) return;
  status.textContent = screen.t("ready", { count: teams.length });
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  results.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

/** Removes the teams and goes back to the names screen (the names box is left as it is). */
export function clearResults(screen: TeamsScreen): void {
  const { workspace, grid, results } = screen.el;
  screen.last = null;
  screen.lastShuffleCount = null;
  grid.replaceChildren();
  results.hidden = true;
  workspace.classList.remove("has-results");
}

/**
 * Splits the names into teams and shows them; a problem (no names, more teams than names) is
 * shown under the form and is not counted as a shuffle. The host hears `teams:result` or `teams:error` (the standalone site posts
 * them to an embedding page and may offer to install the app after a result).
 */
export function generate(screen: TeamsScreen): void {
  const names = parseNames(screen.el.area.value);
  if (!names.ok) {
    showError(screen, screen.t(`error.${names.error.code}`));
    emitTeamsEvent(screen.host, "teams:error", { code: names.error.code });
    screen.el.area.focus();
    return;
  }
  const made = makeTeams({ names: names.value, teams: screen.teams });
  if (!made.ok) {
    showError(screen, screen.t(`error.${made.error.code}`, { teams: screen.teams, names: names.value.length }));
    emitTeamsEvent(screen.host, "teams:error", { code: made.error.code });
    return;
  }
  showError(screen, null);
  // Counted only for teams really made, and kept with them: Copy and Share show the count of the
  // teams on screen, however often they are pressed (DECISIONS 2026-11-22).
  screen.lastShuffleCount = screen.attribution.isShuffleCountOn ? countShuffle(screen.saved, names.value) : null;
  renderResults(screen, made.value, { announce: true });
  emitTeamsEvent(screen.host, "teams:result", { teams: made.value });
}

/** Re-renders the placeholder, count and teams in the current language. */
export function applyLabels(screen: TeamsScreen): void {
  screen.el.area.placeholder = screen.t("namesPlaceholder");
  renderCount(screen);
  if (screen.last) renderResults(screen, screen.last, { announce: false });
}
