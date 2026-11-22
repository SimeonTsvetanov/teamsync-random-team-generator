// What a host may add around the Teams body beyond the contract: launch parameters it reads from
// `context.query` and events on the mount element. The standalone site uses them for the `?teams=`
// address, embed mode (postMessage), Android share-target and its install offer (PLAN §1.5); a host
// that needs none of it (Quizzard) ignores them. Quizzard may name itself in copied teams.

/** `context.query` key: the number of teams to start with (2–10; else the remembered value). */
export const TEAMS_PARAM = "teams";

/** `context.query` key: text shared from another app; its names replace the list (with Undo). */
export const SHARED_TEXT_PARAM = "shared";

/**
 * `context.query` keys: the app copied and shared teams name in their last line ("— Made with
 * <name> · <url>"), e.g. `Quizzard` + `https://simeontsvetanov.github.io/Quizzard/`. Both or
 * neither: a short plain-text name ending in a letter and an https address; anything else gives
 * TeamSync and its own address. A host sets them itself — never from an address someone could link.
 */
export const ATTRIBUTION_NAME_PARAM = "attribution-name";
/** See {@link ATTRIBUTION_NAME_PARAM}. */
export const ATTRIBUTION_URL_PARAM = "attribution-url";

/**
 * `context.query` key: `on` or `off` overrides the package's `SHUFFLE_COUNT_IN_ATTRIBUTION`
 * (DECISIONS 2026-11-22); any other value keeps it. A host sets it itself, like the attribution.
 */
export const SHUFFLE_COUNT_PARAM = "shuffle-count";

/** Every event on the mount element and its `detail`. */
export interface TeamsEventDetails {
  /** Out: the stepper changed (not fired for the start value). */
  readonly "teams:count": { readonly teams: number };
  /** Out: teams were made (Generate, Shuffle again or `teams:make`). */
  readonly "teams:result": { readonly teams: readonly (readonly string[])[] };
  /** Out: teams could not be made; `code` is the core error code shown under the form. */
  readonly "teams:error": { readonly code: string };
  /** In: show these names, set the number of teams and make the teams (the list is not saved). */
  readonly "teams:make": { readonly names: readonly string[]; readonly teams: number };
}

/** The name of a Teams event. */
export type TeamsEventType = keyof TeamsEventDetails;

/**
 * Dispatches a Teams event on `target` (the mount element); it does not bubble.
 * @param target - the mount element
 * @param type - the event name
 * @param detail - its payload
 */
export function emitTeamsEvent<T extends TeamsEventType>(target: EventTarget, type: T, detail: TeamsEventDetails[T]): void {
  target.dispatchEvent(new CustomEvent(type, { detail }));
}

/**
 * Listens for a Teams event on `target`.
 * @param target - the mount element
 * @param type - the event name
 * @param listener - gets the event's `detail`
 * @param signal - removes the listener when aborted
 */
export function onTeamsEvent<T extends TeamsEventType>(target: EventTarget, type: T, listener: (detail: TeamsEventDetails[T]) => void, signal?: AbortSignal): void {
  target.addEventListener(type, (event) => {
    // because only emitTeamsEvent dispatches these names, always with the matching detail.
    if (event instanceof CustomEvent) listener(event.detail as TeamsEventDetails[T]);
  }, signal === undefined ? {} : { signal });
}
