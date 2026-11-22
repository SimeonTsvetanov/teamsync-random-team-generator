// Mounts the team screen (PLAN T-05 – T-07: names → number of teams → fair random teams) into a host
// element and returns its unmount (Quizzard PLAN §1.5). The standalone page already has the markup
// (hydrate); Quizzard gives an empty element (render). Parts: screen.ts, form.ts, names-input.ts,
// results.ts, result-actions.ts.
import type { Lang, MiniAppContext, Unmount } from "../contract.ts";
import { hydrateIcons, icon } from "../dom/icons.ts";
import { SHARED_TEXT_PARAM, onTeamsEvent } from "../host-api.ts";
import { translateSubtree } from "../i18n/subtree.ts";
import { createTranslator } from "../i18n/translate.ts";
import { renderCount, renderStepper, setTeams } from "./form.ts";
import { applySharedText, flushPendingSave, initNamesInput } from "./names-input.ts";
import { attributionFromQuery } from "./attribution.ts";
import { initResultActions } from "./result-actions.ts";
import { applyLabels, clearResults, generate } from "./results.ts";
import { findTeamsElements, type TeamsScreen } from "./screen.ts";
import { createSaved, teamsFromQuery } from "./state.ts";

function initStepper(screen: TeamsScreen): void {
  const { decrease, increase } = screen.el;
  const { signal } = screen;
  decrease.replaceChildren(icon("minus"));
  increase.replaceChildren(icon("plus"));
  decrease.addEventListener("click", () => {
    setTeams(screen, screen.teams - 1);
  }, { signal });
  increase.addEventListener("click", () => {
    setTeams(screen, screen.teams + 1);
  }, { signal });
}

/** Desktop: the names box gets the focus (phones: no keyboard pop-up on launch). */
function focusNamesOnDesktop(screen: TeamsScreen): void {
  // Only when nothing else has the focus: a remount must not pull it out of an open dialog.
  const isFocusFree = document.activeElement === null || document.activeElement === document.body;
  if (isFocusFree && matchMedia("(min-width: 601px) and (pointer: fine)").matches) screen.el.area.focus({ preventScroll: true });
}

/** Re-translates the static markup and the texts the body set (count, placeholder, teams). */
function onLanguage(screen: TeamsScreen, lang: Lang): void {
  screen.t = createTranslator(lang);
  translateSubtree(screen.host, screen.t);
  applyLabels(screen);
}

/** Wires the form, the stepper, the result buttons and the host's `teams:make`. */
function wire(screen: TeamsScreen): void {
  const { el, signal } = screen;
  initNamesInput(screen);
  const shared = screen.context.query.get(SHARED_TEXT_PARAM);
  if (shared) applySharedText(screen, shared);
  initStepper(screen);
  initResultActions(screen);
  el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    generate(screen);
  }, { signal });
  focusNamesOnDesktop(screen);
  onTeamsEvent(screen.host, "teams:make", ({ names, teams }) => {
    el.area.value = names.join("\n");
    setTeams(screen, teams);
    renderCount(screen);
    generate(screen);
  }, signal);
}

/** Starts the screen that is now in `element`; `isRendered` = this mount put the markup there. */
function start(element: HTMLElement, context: MiniAppContext, { isRendered }: { readonly isRendered: boolean }): Unmount {
  const el = findTeamsElements(element);
  if (el === null) throw new Error("TEAMS_SCREEN_INCOMPLETE: the mount element holds a partial team screen");
  const controller = new AbortController();
  const saved = createSaved(context.storage);
  const screen: TeamsScreen = {
    el, host: element, context, saved, signal: controller.signal,
    attribution: attributionFromQuery(context.query),
    t: createTranslator(context.language.get()),
    teams: teamsFromQuery(context.query) ?? saved.teams(),
    last: null,
    lastShuffleCount: null,
    saveTimer: undefined,
  };
  hydrateIcons(element);
  translateSubtree(element, screen.t);
  clearResults(screen); // a remount over the standalone page's markup starts again from the names
  wire(screen);
  const stopLanguage = context.language.subscribe((lang) => { onLanguage(screen, lang); });
  renderStepper(screen);
  applyLabels(screen);
  return () => {
    if (controller.signal.aborted) return;
    // Flushed first, so the last typing survives leaving the screen (TS-02). It cannot undo a
    // host's "clear my data": a save waits at most 300 ms, and a host clears only after its own
    // confirmation, by which time that save has run; nothing is written after this point.
    flushPendingSave(screen);
    controller.abort();
    stopLanguage();
    if (isRendered) element.replaceChildren();
  };
}

/**
 * Mounts the team screen into `element`.
 * @param element - holding the standalone page's screen (hydrated at once) or empty (screen.html is
 * loaded and rendered first, so the result is a promise)
 * @param context - the host's services; launch parameters `teams`, `shared`, the attribution and
 * `shuffle-count` (host-api.ts)
 * @returns the unmount: writes a pending save of the names, removes every listener and the language
 * subscription and empties `element` only if the screen was rendered here
 * @throws {@link Error} `TEAMS_SCREEN_INCOMPLETE` when `element` holds only part of the screen
 */
export function mountTeams(element: HTMLElement, context: MiniAppContext): Unmount | Promise<Unmount> {
  if (element.querySelector("[data-workspace]") !== null) return start(element, context, { isRendered: false });
  return import("./render.ts").then(({ renderScreen }) => {
    renderScreen(element);
    return start(element, context, { isRendered: true });
  });
}
