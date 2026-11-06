// What the main screen remembers (names, number of teams) and the `?teams=` deep link.
// Used by the teams view modules.
import { MAX_TEAMS, MIN_TEAMS } from "@simeonts/teamsync-random-team-generator-core";
import { prefs, registerPrefCheck } from "../storage/index.ts";

// Imported data must have the right types (a broken export can never break the app).
registerPrefCheck("names", (v) => typeof v === "string" && v.length <= 110_000);
registerPrefCheck("teams", (v) => Number.isInteger(v));

/** What TeamSync remembers on this device (SPEC F7): the last names list and team count. */
export const saved = {
  names(): string {
    const value = prefs.get<unknown>("names", "");
    return typeof value === "string" ? value : "";
  },
  /** An empty list is removed, not stored (nothing personal stays behind). */
  setNames(text: string): void {
    if (text.trim()) prefs.set("names", text);
    else prefs.remove("names");
  },
  teams(): number {
    return clampTeams(prefs.get<number>("teams", MIN_TEAMS));
  },
  setTeams(teams: number): void {
    prefs.set("teams", teams);
  },
};

/** Returns `teams` limited to MIN_TEAMS…MAX_TEAMS; a non-integer gives MIN_TEAMS. */
export function clampTeams(teams: number): number {
  return Number.isInteger(teams) ? Math.min(MAX_TEAMS, Math.max(MIN_TEAMS, teams)) : MIN_TEAMS;
}

/** `?teams=N` deep link (SPEC F9). Names are never put in the URL. Returns null when absent/invalid. */
export function teamsFromUrl(): number | null {
  const raw = new URLSearchParams(location.search).get("teams");
  if (raw === null || !/^\d{1,2}$/.test(raw)) return null;
  const teams = Number(raw);
  return teams >= MIN_TEAMS && teams <= MAX_TEAMS ? teams : null;
}

/** Keeps `?teams=` in the address bar in step with the selector (replaceState, no history spam). */
export function writeTeamsToUrl(teams: number): void {
  const query = new URLSearchParams(location.search);
  query.set("teams", String(teams));
  history.replaceState(null, "", `${location.pathname}?${query.toString()}${location.hash}`);
}
