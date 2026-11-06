// The buttons under the results: Shuffle again, Share, Copy, Clear and start over, and the
// phone-only "‹ Names" back link. Wired by view.ts.
import { formatTeams, type FormatLabels } from "@simeonts/teamsync-random-team-generator-core";
import { app } from "../config.ts";
import { t } from "../i18n/index.ts";
import { confirmAction } from "../ui/confirm.ts";
import { shareText } from "../ui/share.ts";
import { showToast } from "../ui/toast.ts";
import { withTransition } from "../ui/transition.ts";
import { renderCount, showError } from "./form.ts";
import { cancelPendingSave } from "./names-input.ts";
import { clearResults, generate } from "./results.ts";
import type { TeamsScreen } from "./screen.ts";
import { saved } from "./state.ts";

/** Copy/Share text labels in the current UI language (structure: core formatTeams). */
function shareLabels(): FormatLabels {
  return {
    heading: t("app.copyHeading"),
    team: (n, members) => t("app.copyTeam", { n, members }),
    attribution: t("app.attribution", { url: app.url }),
  };
}

function copyTeams(teams: readonly (readonly string[])[]): void {
  navigator.clipboard.writeText(formatTeams(teams, shareLabels())).then(
    () => {
      showToast({ message: t("app.copied") });
    },
    () => {
      showToast({ message: t("app.copyFailed") });
    },
  );
}

/** Clear and start over (Moni 2026-11-06): asks first, then empties names and teams. */
async function startOver(screen: TeamsScreen): Promise<void> {
  const confirmed = await confirmAction({ title: t("app.startOverTitle"), message: t("app.startOverMessage"), confirm: t("app.startOverConfirm") });
  if (!confirmed) return;
  cancelPendingSave(screen);
  saved.setNames("");
  withTransition(() => {
    screen.el.area.value = "";
    clearResults(screen);
    renderCount(screen);
    showError(screen, null);
  });
  window.scrollTo({ top: 0 });
}

/** Wires the result buttons and the "‹ Names" back link. */
export function initResultActions(screen: TeamsScreen): void {
  const { regenerate, copy, share, startOver: startOverButton, back, workspace, area } = screen.el;
  regenerate.addEventListener("click", () => {
    generate(screen);
  });
  copy.addEventListener("click", () => {
    if (screen.last) copyTeams(screen.last);
  });
  share.addEventListener("click", () => {
    // One Share button: the device's share sheet, else WhatsApp + Copy (template ui/share.ts).
    if (screen.last) void shareText(formatTeams(screen.last, shareLabels()));
  });
  startOverButton.addEventListener("click", () => {
    void startOver(screen);
  });
  // Phones: results are the next screen; "‹ Names" goes back (desktop shows both side by side).
  back.addEventListener("click", () => {
    withTransition(() => {
      workspace.classList.remove("has-results");
    });
    area.focus({ preventScroll: true });
  });
}
