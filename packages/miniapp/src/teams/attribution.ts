// The last line of copied and shared teams: the app it names (the host's launch parameters, else
// TeamSync) and, while the switch is on, the shuffle count fused to that name (DECISIONS 2026-11-22).
// Used by mount.ts (settings), results.ts (counting) and result-actions.ts (the line).
import { attributionName, nextShuffleCount, parseAttribution, rosterFingerprint, type Attribution } from "@simeonts/teamsync-random-team-generator-core";
import { ATTRIBUTION_NAME_PARAM, ATTRIBUTION_URL_PARAM, SHUFFLE_COUNT_PARAM } from "../host-api.ts";
import { STANDALONE_URL } from "../meta.ts";
import type { Translate } from "../i18n/translate.ts";
import type { Saved } from "./state.ts";

/**
 * The switch (DECISIONS 2026-11-22): true = copied and shared teams end with the app name plus how
 * many times in a row the same people were shuffled ("— Made with Quizzard3 · …"). A host overrides
 * it with the launch parameter `shuffle-count=on|off`.
 */
export const SHUFFLE_COUNT_IN_ATTRIBUTION = true;

/** The standalone app, named when the host names no valid app of its own. */
const TEAMSYNC: Attribution = { name: "TeamSync", url: STANDALONE_URL };

/** What one mount's attribution line says, read once from the launch parameters. */
export interface AttributionSettings {
  readonly attribution: Attribution;
  /** The shuffle count is counted, remembered and fused to the name. */
  readonly isShuffleCountOn: boolean;
}

function isShuffleCountOn(query: URLSearchParams): boolean {
  const value = query.get(SHUFFLE_COUNT_PARAM);
  if (value === "on") return true;
  if (value === "off") return false;
  return SHUFFLE_COUNT_IN_ATTRIBUTION;
}

/**
 * Returns the attribution settings of a mount from its launch parameters.
 * @param query - `context.query`; a missing or invalid name/address pair gives TeamSync
 */
export function attributionFromQuery(query: URLSearchParams): AttributionSettings {
  const fromHost = parseAttribution({ name: query.get(ATTRIBUTION_NAME_PARAM), url: query.get(ATTRIBUTION_URL_PARAM) });
  return { attribution: fromHost ?? TEAMSYNC, isShuffleCountOn: isShuffleCountOn(query) };
}

/**
 * Counts one successful shuffle of `names` and remembers it (fingerprint + count, never names).
 * @param saved - the screen's remembered values
 * @param names - the parsed names the teams were just made from
 * @returns the count that belongs to these teams (1 after the people changed)
 */
export function countShuffle(saved: Saved, names: readonly string[]): number {
  const next = nextShuffleCount(saved.shuffleCount(), rosterFingerprint(names));
  saved.setShuffleCount(next);
  return next.count;
}

/**
 * Returns the attribution line in the current language.
 * @param t - the translator
 * @param attribution - the app to name
 * @param count - the shuffle count of the teams on screen, or null to show the name alone
 */
export function attributionLine(t: Translate, attribution: Attribution, count: number | null): string {
  return t("attribution", { name: attributionName(attribution.name, count), url: attribution.url });
}
