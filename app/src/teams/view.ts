// The TeamSync main screen (PLAN T-05 – T-07): names → number of teams → fair random teams.
// Called once from main.ts; the parts live in screen.ts, form.ts, names-input.ts, results*.ts.
import { icon } from "../ui/icons.ts";
import { initEmbed } from "./embed.ts";
import { renderCount, renderStepper, setTeams } from "./form.ts";
import { cancelPendingSave, initNamesInput } from "./names-input.ts";
import { initResultActions } from "./result-actions.ts";
import { applyLabels, clearResults, generate } from "./results.ts";
import { findTeamsElements, type TeamsScreen } from "./screen.ts";
import { saved, teamsFromUrl } from "./state.ts";

function initStepper(screen: TeamsScreen): void {
  const { decrease, increase } = screen.el;
  decrease.replaceChildren(icon("minus"));
  increase.replaceChildren(icon("plus"));
  decrease.addEventListener("click", () => {
    setTeams(screen, screen.teams - 1);
  });
  increase.addEventListener("click", () => {
    setTeams(screen, screen.teams + 1);
  });
}

/** Settings → Clear my data: the screen must not keep (and re-save) the deleted list. */
function onDataCleared(screen: TeamsScreen): void {
  cancelPendingSave(screen);
  screen.el.area.value = "";
  clearResults(screen);
  screen.teams = saved.teams();
  renderStepper(screen);
  renderCount(screen);
}

/** Sets up the main screen; does nothing on a page without it. */
export function initTeams(): void {
  const el = findTeamsElements();
  if (!el) return;
  const screen: TeamsScreen = { el, teams: teamsFromUrl() ?? saved.teams(), last: null, saveTimer: undefined };
  initNamesInput(screen);
  initStepper(screen);
  initResultActions(screen);
  el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    generate(screen);
  });
  // Desktop: the names box has the focus from the start (phones: no keyboard pop-up on launch).
  if (matchMedia("(min-width: 601px) and (pointer: fine)").matches) el.area.focus({ preventScroll: true });
  initEmbed((names, teams) => {
    el.area.value = names.join("\n");
    setTeams(screen, teams);
    renderCount(screen);
    generate(screen);
  });
  document.addEventListener("i18n:change", () => {
    applyLabels(screen);
  });
  document.addEventListener("app:data-cleared", () => {
    onDataCleared(screen);
  });
  renderStepper(screen);
  applyLabels(screen);
}
