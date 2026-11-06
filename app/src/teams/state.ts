import { MAX_TEAMS, MIN_TEAMS } from "@simeonts/teamsync-random-team-generator-core";
import { prefs } from "../storage/index.ts";

/** What TeamSync remembers on this device (SPEC F7): the last names list and team count. */
export const saved = {
  names: (): string => prefs.get<string>("names", ""),
  setNames: (text: string): void => { if (text.trim()) prefs.set("names", text); else prefs.remove("names"); },
  teams: (): number => clampTeams(prefs.get<number>("teams", MIN_TEAMS)),
  setTeams: (n: number): void => { prefs.set("teams", n); },
};

export const clampTeams = (n: number): number => (Number.isInteger(n) ? Math.min(MAX_TEAMS, Math.max(MIN_TEAMS, n)) : MIN_TEAMS);

/** `?teams=N` deep link (SPEC F9). Names are never put in the URL. Returns null when absent/invalid. */
export function teamsFromUrl(): number | null {
  const raw = new URLSearchParams(location.search).get("teams");
  if (raw === null || !/^\d{1,2}$/.test(raw)) return null;
  const n = Number(raw);
  return n >= MIN_TEAMS && n <= MAX_TEAMS ? n : null;
}

/** Keeps `?teams=` in the address bar in step with the selector (replaceState, no history spam). */
export function writeTeamsToUrl(n: number): void {
  const q = new URLSearchParams(location.search);
  q.set("teams", String(n));
  history.replaceState(null, "", `${location.pathname}?${q.toString()}${location.hash}`);
}
