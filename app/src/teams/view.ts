import { MAX_TEAMS, MIN_TEAMS, expandFollowers, formatTeams, makeTeams, parseNames, type FormatLabels } from "@simeonts/teamsync-random-team-generator-core";
import { app } from "../config.ts";
import { t } from "../i18n/index.ts";
import { h } from "../ui/dom.ts";
import { icon } from "../ui/icons.ts";
import { maybeOfferInstall } from "../ui/install.ts";
import { showToast, showUndo } from "../ui/toast.ts";
import { withTransition } from "../ui/transition.ts";
import { initEmbed, postToParent } from "./embed.ts";
import { clampTeams, saved, teamsFromUrl, writeTeamsToUrl } from "./state.ts";

/** The main screen (PLAN T-05 – T-07): names → number of teams → fair random teams. */
export function initTeams(): void {
  const form = document.querySelector<HTMLFormElement>("[data-teams-form]");
  const area = document.querySelector<HTMLTextAreaElement>("#names");
  const countEl = document.querySelector<HTMLElement>("[data-names-count]");
  const valueEl = document.querySelector<HTMLOutputElement>("[data-teams-value]");
  const dec = document.querySelector<HTMLButtonElement>("[data-teams-dec]");
  const inc = document.querySelector<HTMLButtonElement>("[data-teams-inc]");
  const clear = document.querySelector<HTMLButtonElement>("[data-names-clear]");
  const errorEl = document.querySelector<HTMLElement>("[data-teams-error]");
  const results = document.querySelector<HTMLElement>("[data-results]");
  const grid = document.querySelector<HTMLElement>("[data-teams-grid]");
  const status = document.querySelector<HTMLElement>("[data-results-status]");
  if (!form || !area || !countEl || !valueEl || !dec || !inc || !clear || !errorEl || !results || !grid || !status) return;

  let teams = teamsFromUrl() ?? saved.teams();
  let last: string[][] | null = null;

  const labels = (): FormatLabels => ({
    heading: t("app.copyHeading"),
    team: (n, members) => t("app.copyTeam", { n, members }),
    attribution: t("app.attribution", { url: app.url }),
  });
  const nameCount = (): number => { const r = parseNames(area.value); return r.ok ? r.value.length : 0; };
  const showError = (message: string | null): void => {
    errorEl.hidden = message === null;
    errorEl.textContent = message ?? "";
    area.setAttribute("aria-invalid", String(message !== null));
  };

  const renderCount = (): void => {
    const n = nameCount();
    countEl.textContent = n ? t("app.namesCount", { count: n }) : "";
    clear.hidden = !area.value.trim();
  };
  const renderTeams = (): void => {
    valueEl.textContent = String(teams);
    dec.disabled = teams <= MIN_TEAMS;
    inc.disabled = teams >= MAX_TEAMS;
  };
  const setTeams = (n: number): void => {
    teams = clampTeams(n);
    saved.setTeams(teams);
    writeTeamsToUrl(teams);
    renderTeams();
    showError(null);
  };
  const renderResults = (value: string[][], announce: boolean): void => {
    last = value;
    withTransition(() => {
      grid.replaceChildren(...value.map((members, i) =>
        h("article", { class: "team-card", "aria-labelledby": `team-${String(i + 1)}` },
          h("header", { class: "team-head" },
            h("h3", { id: `team-${String(i + 1)}` }, t("app.teamTitle", { n: i + 1 })),
            h("span", { class: "chip" }, t("app.membersCount", { count: members.length }))),
          h("ol", { class: "team-list" }, ...members.map((m) => h("li", {}, m))))));
      results.hidden = false;
    });
    if (announce) {
      status.textContent = t("app.ready", { count: value.length });
      results.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
  };
  const applyLabels = (): void => {
    area.placeholder = t("app.namesPlaceholder");
    renderCount();
    if (last) renderResults(last, false);
  };

  // Restore the last list (SPEC F7), the cheat expands live like the original app (SPEC F6).
  area.value = saved.names();
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  area.addEventListener("input", () => {
    const expanded = expandFollowers(area.value);
    if (expanded !== area.value) {
      area.value = expanded;
      area.setSelectionRange(expanded.length, expanded.length);
    }
    renderCount();
    showError(null);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saved.setNames(area.value); }, 300);
  });
  clear.addEventListener("click", () => {
    const before = area.value;
    area.value = "";
    saved.setNames("");
    renderCount();
    area.focus();
    // Clearing one field is reversible → Undo, not a confirmation (forge-design ui-patterns §4).
    showUndo(t("app.cleared"), () => { area.value = before; saved.setNames(before); renderCount(); });
  });
  dec.addEventListener("click", () => { setTeams(teams - 1); });
  inc.addEventListener("click", () => { setTeams(teams + 1); });

  const generate = (): void => {
    const names = parseNames(area.value);
    if (!names.ok) { showError(t(`app.error.${names.error.code}`)); postToParent("error", { code: names.error.code }); area.focus(); return; }
    const made = makeTeams({ names: names.value, teams });
    if (!made.ok) {
      showError(t(`app.error.${made.error.code}`, { teams, names: names.value.length }));
      postToParent("error", { code: made.error.code });
      return;
    }
    showError(null);
    renderResults(made.value, true);
    postToParent("result", { teams: made.value });
    maybeOfferInstall();
  };



  form.addEventListener("submit", (e) => { e.preventDefault(); generate(); });
  document.querySelector("[data-regenerate]")?.addEventListener("click", generate);
  document.querySelector("[data-copy]")?.addEventListener("click", () => {
    if (!last) return;
    navigator.clipboard.writeText(formatTeams(last, labels())).then(
      () => { showToast({ message: t("app.copied") }); },
      () => { showToast({ message: t("app.copyFailed") }); },
    );
  });
  document.querySelector("[data-share]")?.addEventListener("click", () => {
    if (!last) return;
    const text = formatTeams(last, labels());
    const copyInstead = (): void => { void navigator.clipboard.writeText(text).then(() => { showToast({ message: t("app.copied") }); }); };
    // Native share sheet where available; otherwise (or on failure) copy. Cancelling is silent.
    if (typeof navigator.share !== "function") { copyInstead(); return; }
    navigator.share({ title: app.name, text }).catch((e: unknown) => {
      if (!(e instanceof DOMException && e.name === "AbortError")) copyInstead();
    });
  });

  initEmbed((names, n) => { area.value = names.join("\n"); setTeams(n); renderCount(); generate(); });
  document.addEventListener("i18n:change", applyLabels);
  // Settings → Clear my data: the screen must not keep (and re-save) the deleted list.
  document.addEventListener("app:data-cleared", () => {
    clearTimeout(saveTimer);
    area.value = "";
    last = null;
    grid.replaceChildren();
    results.hidden = true;
    teams = saved.teams();
    renderTeams();
    renderCount();
  });
  dec.replaceChildren(icon("minus"));
  inc.replaceChildren(icon("plus"));
  renderTeams();
  applyLabels();
}
