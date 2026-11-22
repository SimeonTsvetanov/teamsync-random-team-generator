// The team screen's DOM nodes and live state (screen.html → [data-workspace]) for one mount, shared
// by the body's modules (mount.ts, form.ts, names-input.ts, results.ts, result-actions.ts).
import type { MiniAppContext } from "../contract.ts";
import type { Translate } from "../i18n/translate.ts";
import type { AttributionSettings } from "./attribution.ts";
import type { Saved } from "./state.ts";

/** Every node of the screen the body reads or changes, found by its data-* hook. */
export interface TeamsElements {
  readonly workspace: HTMLElement;
  readonly form: HTMLFormElement;
  readonly area: HTMLTextAreaElement;
  readonly count: HTMLElement;
  readonly clear: HTMLButtonElement;
  readonly decrease: HTMLButtonElement;
  readonly increase: HTMLButtonElement;
  readonly teamsValue: HTMLOutputElement;
  readonly error: HTMLElement;
  readonly results: HTMLElement;
  readonly grid: HTMLElement;
  readonly status: HTMLElement;
  readonly resultsTitle: HTMLElement;
  readonly back: HTMLButtonElement;
  readonly regenerate: HTMLButtonElement;
  readonly copy: HTMLButtonElement;
  readonly share: HTMLButtonElement;
  readonly startOver: HTMLButtonElement;
}

/** One mounted screen: its nodes, its host services and what the user chose and got. */
export interface TeamsScreen {
  readonly el: TeamsElements;
  /** The mount element: host events go out from it and `teams:make` comes in on it. */
  readonly host: HTMLElement;
  readonly context: MiniAppContext;
  readonly saved: Saved;
  /** The app copied and shared teams name, and whether the shuffle count goes with it. */
  readonly attribution: AttributionSettings;
  /** Aborted at unmount: every listener of this mount is added with it. */
  readonly signal: AbortSignal;
  /** Texts in the host's current language; replaced when the language changes. */
  t: Translate;
  /** Number of teams on the stepper (MIN_TEAMS…MAX_TEAMS). */
  teams: number;
  /** The teams on screen; null before the first Generate and after a clear. */
  last: string[][] | null;
  /** The shuffle count of the teams on screen; null when the count is off or no teams are shown. */
  lastShuffleCount: number | null;
  /** Pending debounced save of the names list (names-input.ts). */
  saveTimer: ReturnType<typeof setTimeout> | undefined;
}

type Nullable<T> = { [K in keyof T]: T[K] | null };

function hasAll(found: Nullable<TeamsElements>): found is TeamsElements {
  return Object.values(found).every((node) => node !== null);
}

/**
 * Finds the screen's nodes under `root`.
 * @returns the nodes, or null when the screen is not (completely) there
 */
export function findTeamsElements(root: ParentNode): TeamsElements | null {
  const found: Nullable<TeamsElements> = {
    workspace: root.querySelector<HTMLElement>("[data-workspace]"),
    form: root.querySelector<HTMLFormElement>("[data-teams-form]"),
    area: root.querySelector<HTMLTextAreaElement>("#names"),
    count: root.querySelector<HTMLElement>("[data-names-count]"),
    clear: root.querySelector<HTMLButtonElement>("[data-names-clear]"),
    decrease: root.querySelector<HTMLButtonElement>("[data-teams-dec]"),
    increase: root.querySelector<HTMLButtonElement>("[data-teams-inc]"),
    teamsValue: root.querySelector<HTMLOutputElement>("[data-teams-value]"),
    error: root.querySelector<HTMLElement>("[data-teams-error]"),
    results: root.querySelector<HTMLElement>("[data-results]"),
    grid: root.querySelector<HTMLElement>("[data-teams-grid]"),
    status: root.querySelector<HTMLElement>("[data-results-status]"),
    resultsTitle: root.querySelector<HTMLElement>("#results-title"),
    back: root.querySelector<HTMLButtonElement>("[data-results-back]"),
    regenerate: root.querySelector<HTMLButtonElement>("[data-regenerate]"),
    copy: root.querySelector<HTMLButtonElement>("[data-copy]"),
    share: root.querySelector<HTMLButtonElement>("[data-share]"),
    startOver: root.querySelector<HTMLButtonElement>("[data-start-over]"),
  };
  return hasAll(found) ? found : null;
}
