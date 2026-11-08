// The main screen's DOM nodes and live state (index.html → [data-workspace]), shared by the
// teams view modules (view.ts, form.ts, names-input.ts, results.ts, result-actions.ts).

/** Every node of the main screen the teams view reads or changes, found by its data-* hook. */
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

/** The main screen: its nodes plus what the user chose and got. */
export interface TeamsScreen {
  readonly el: TeamsElements;
  /** Number of teams on the stepper (MIN_TEAMS…MAX_TEAMS). */
  teams: number;
  /** The teams on screen; null before the first Generate and after a clear. */
  last: string[][] | null;
  /** Pending debounced save of the names list (names-input.ts). */
  saveTimer: ReturnType<typeof setTimeout> | undefined;
}

type Nullable<T> = { [K in keyof T]: T[K] | null };

function hasAll(found: Nullable<TeamsElements>): found is TeamsElements {
  return Object.values(found).every((node) => node !== null);
}

/**
 * Finds the main screen's nodes.
 *
 * @returns The nodes, or null when the page has no teams screen (any node missing).
 */
export function findTeamsElements(): TeamsElements | null {
  const found: Nullable<TeamsElements> = {
    workspace: document.querySelector<HTMLElement>("[data-workspace]"),
    form: document.querySelector<HTMLFormElement>("[data-teams-form]"),
    area: document.querySelector<HTMLTextAreaElement>("#names"),
    count: document.querySelector<HTMLElement>("[data-names-count]"),
    clear: document.querySelector<HTMLButtonElement>("[data-names-clear]"),
    decrease: document.querySelector<HTMLButtonElement>("[data-teams-dec]"),
    increase: document.querySelector<HTMLButtonElement>("[data-teams-inc]"),
    teamsValue: document.querySelector<HTMLOutputElement>("[data-teams-value]"),
    error: document.querySelector<HTMLElement>("[data-teams-error]"),
    results: document.querySelector<HTMLElement>("[data-results]"),
    grid: document.querySelector<HTMLElement>("[data-teams-grid]"),
    status: document.querySelector<HTMLElement>("[data-results-status]"),
    resultsTitle: document.querySelector<HTMLElement>("#results-title"),
    back: document.querySelector<HTMLButtonElement>("[data-results-back]"),
    regenerate: document.querySelector<HTMLButtonElement>("[data-regenerate]"),
    copy: document.querySelector<HTMLButtonElement>("[data-copy]"),
    share: document.querySelector<HTMLButtonElement>("[data-share]"),
    startOver: document.querySelector<HTMLButtonElement>("[data-start-over]"),
  };
  return hasAll(found) ? found : null;
}
