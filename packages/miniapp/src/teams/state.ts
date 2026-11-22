// What the team screen remembers (names, number of teams, shuffle count) through the host's prefs,
// and the `teams` launch parameter. Used by the body's modules.
import { MAX_TEAMS, MIN_TEAMS, parseShuffleCount, type ShuffleCount } from "@simeonts/teamsync-random-team-generator-core";
import type { MiniAppContext } from "../contract.ts";
import { TEAMS_PARAM } from "../host-api.ts";

/** Prefs key of the shuffle count (DECISIONS 2026-11-22): `{ fingerprint, count }`, never names. */
const SHUFFLE_COUNT_KEY = "shuffles";

/** What TeamSync remembers on this device (SPEC F7): the last names list and team count. */
export interface Saved {
  names(): string;
  /** An empty list is removed, not stored (nothing personal stays behind). */
  setNames(text: string): void;
  teams(): number;
  setTeams(teams: number): void;
  /** The last roster's shuffle count; null when none is stored or the stored value is not valid. */
  shuffleCount(): ShuffleCount | null;
  setShuffleCount(value: ShuffleCount): void;
}

/**
 * Returns the remembered values over the host's storage (keys `names`, `teams`, `shuffles` of
 * `meta.storage`).
 * @param storage - the context's storage; its prefs are already inside the mini-app's area
 */
export function createSaved(storage: MiniAppContext["storage"]): Saved {
  const { prefs } = storage;
  return {
    names: () => {
      const value = prefs.get<unknown>("names", "");
      return typeof value === "string" ? value : "";
    },
    setNames: (text) => {
      if (!text.trim()) {
        prefs.remove("names");
        return;
      }
      prefs.set("names", text);
      storage.notifySaved();
    },
    teams: () => clampTeams(prefs.get<number>("teams", MIN_TEAMS)),
    setTeams: (teams) => {
      prefs.set("teams", teams);
    },
    shuffleCount: () => parseShuffleCount(prefs.get<unknown>(SHUFFLE_COUNT_KEY, null)),
    setShuffleCount: (value) => {
      prefs.set(SHUFFLE_COUNT_KEY, value);
    },
  };
}

/** Returns `teams` limited to MIN_TEAMS…MAX_TEAMS; a non-integer gives MIN_TEAMS. */
export function clampTeams(teams: number): number {
  return Number.isInteger(teams) ? Math.min(MAX_TEAMS, Math.max(MIN_TEAMS, teams)) : MIN_TEAMS;
}

/**
 * Reads the `teams` launch parameter (SPEC F9: `?teams=N`; names are never in the URL).
 * @returns the number of teams, or null when absent or out of range
 */
export function teamsFromQuery(query: URLSearchParams): number | null {
  const raw = query.get(TEAMS_PARAM);
  if (raw === null || !/^\d{1,2}$/.test(raw)) return null;
  const teams = Number(raw);
  return teams >= MIN_TEAMS && teams <= MAX_TEAMS ? teams : null;
}
