// The buttons under the results: Shuffle again, Share, Copy, Clear and start over, and the
// phone-only "‹ Names" back link. Wired by mount.ts; toasts, the question and sharing come from
// the host (`context.shell`).
import { formatTeams, type FormatLabels } from "@simeonts/teamsync-random-team-generator-core";
import { withTransition } from "../dom/transition.ts";
import { attributionLine } from "./attribution.ts";
import { renderCount, showError } from "./form.ts";
import { cancelPendingSave } from "./names-input.ts";
import { clearResults, generate } from "./results.ts";
import type { TeamsScreen } from "./screen.ts";

/** Copy/Share text labels in the current language (structure: core formatTeams). */
function shareLabels(screen: TeamsScreen): FormatLabels {
  return {
    heading: screen.t("copyHeading"),
    team: (n, members) => screen.t("copyTeam", { n, members }),
    attribution: attributionLine(screen.t, screen.attribution.attribution, screen.lastShuffleCount),
  };
}

function copyTeams(screen: TeamsScreen, teams: readonly (readonly string[])[]): void {
  const { shell } = screen.context;
  navigator.clipboard.writeText(formatTeams(teams, shareLabels(screen))).then(
    () => {
      shell.toast(screen.t("copied"));
    },
    () => {
      shell.toast(screen.t("copyFailed"), { tone: "error" });
    },
  );
}

/** Clear and start over (Moni 2026-11-06): asks first, then empties names and teams. */
async function startOver(screen: TeamsScreen): Promise<void> {
  const confirmed = await screen.context.shell.confirm({ title: screen.t("startOverTitle"), text: screen.t("startOverMessage"), confirm: screen.t("startOverConfirm") });
  if (!confirmed || screen.signal.aborted) return;
  cancelPendingSave(screen);
  screen.saved.setNames("");
  withTransition(() => {
    screen.el.area.value = "";
    clearResults(screen);
    renderCount(screen);
    showError(screen, null);
  });
  window.scrollTo({ top: 0 });
}

/** Wires the result buttons and the "‹ Names" back link; listeners end with `screen.signal`. */
export function initResultActions(screen: TeamsScreen): void {
  const { regenerate, copy, share, startOver: startOverButton, back, workspace, area } = screen.el;
  const { signal } = screen;
  regenerate.addEventListener("click", () => {
    generate(screen);
  }, { signal });
  copy.addEventListener("click", () => {
    if (screen.last) copyTeams(screen, screen.last);
  }, { signal });
  share.addEventListener("click", () => {
    // One Share button: the host's share flow (standalone: share sheet, else WhatsApp + Copy).
    if (screen.last) void screen.context.shell.share({ text: formatTeams(screen.last, shareLabels(screen)) });
  }, { signal });
  startOverButton.addEventListener("click", () => {
    void startOver(screen);
  }, { signal });
  // Phones: results are the next screen; "‹ Names" goes back (desktop shows both side by side).
  back.addEventListener("click", () => {
    withTransition(() => {
      workspace.classList.remove("has-results");
    });
    area.focus({ preventScroll: true });
  }, { signal });
}
