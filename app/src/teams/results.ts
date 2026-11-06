// Results of the main screen: Generate (names → fair random teams), the team cards and clearing
// them. Used by view.ts and result-actions.ts.
import { makeTeams, parseNames } from "@simeonts/teamsync-random-team-generator-core";
import { t } from "../i18n/index.ts";
import { h } from "../ui/dom.ts";
import { maybeOfferInstall } from "../ui/install.ts";
import { withTransition } from "../ui/transition.ts";
import { postToParent } from "./embed.ts";
import { renderCount, showError } from "./form.ts";
import type { TeamsScreen } from "./screen.ts";

/** Options for {@link renderResults}. */
export interface RenderResultsOptions {
  /** Announce to screen readers and scroll to the teams (a fresh result, not a re-render). */
  readonly announce: boolean;
}

function teamCard(members: readonly string[], index: number): HTMLElement {
  const id = `team-${String(index + 1)}`;
  return h("article", { class: "team-card", "aria-labelledby": id },
    h("header", { class: "team-head" },
      h("h3", { id }, t("app.teamTitle", { n: index + 1 })),
      h("span", { class: "chip" }, t("app.membersCount", { count: members.length }))),
    h("ol", { class: "team-list" }, ...members.map((member) => h("li", {}, member))));
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
    grid.replaceChildren(...teams.map((members, index) => teamCard(members, index)));
    results.hidden = false;
  });
  if (!announce) return;
  status.textContent = t("app.ready", { count: teams.length });
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  results.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

/** Removes the teams and goes back to the names screen (the names box is left as it is). */
export function clearResults(screen: TeamsScreen): void {
  const { workspace, grid, results } = screen.el;
  screen.last = null;
  grid.replaceChildren();
  results.hidden = true;
  workspace.classList.remove("has-results");
}

/**
 * Splits the names into teams and shows them; a problem (no names, more teams than names) is
 * shown under the form and reported to an embedding page as `teamsync:error`.
 */
export function generate(screen: TeamsScreen): void {
  const names = parseNames(screen.el.area.value);
  if (!names.ok) {
    showError(screen, t(`app.error.${names.error.code}`));
    postToParent("error", { code: names.error.code });
    screen.el.area.focus();
    return;
  }
  const made = makeTeams({ names: names.value, teams: screen.teams });
  if (!made.ok) {
    showError(screen, t(`app.error.${made.error.code}`, { teams: screen.teams, names: names.value.length }));
    postToParent("error", { code: made.error.code });
    return;
  }
  showError(screen, null);
  renderResults(screen, made.value, { announce: true });
  postToParent("result", { teams: made.value });
  maybeOfferInstall();
}

/** Re-renders the placeholder, count and teams in the current UI language. */
export function applyLabels(screen: TeamsScreen): void {
  screen.el.area.placeholder = t("app.namesPlaceholder");
  renderCount(screen);
  if (screen.last) renderResults(screen, screen.last, { announce: false });
}
