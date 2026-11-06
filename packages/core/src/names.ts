import { fail, ok, type Result } from "./result.js";

/** Limits shared by the app, URL handling and MCP (SPEC §7). */
export const MAX_NAMES = 1000;
export const MAX_NAME_LENGTH = 100;

/** The cheat word: a line with exactly this text (any case, surrounding spaces ignored). */
export const FOLLOWERS_CHEAT = "the followers";

/** The friends a `the followers` line expands to — same names and order as the original TeamSync. */
export const FOLLOWERS: readonly string[] = [
  "Moni", "Iliyana", "George", "Viki", "Eli", "Asen", "Lubomir", "Ralica", "Venci",
  "Slavi", "Joni", "Apapa", "Mitaka G", "Tonkata", "Dinkata", "Raiko", "Tancheto",
];

export type NamesErrorCode = "NAMES_EMPTY" | "NAMES_TOO_MANY" | "NAME_TOO_LONG";

/** True for a line that is the cheat word. */
export const isFollowersLine = (line: string): boolean => line.trim().toLowerCase() === FOLLOWERS_CHEAT;

/**
 * Expands every `the followers` line in place, keeping all other lines exactly as typed.
 * Used live in the textarea (like the original app) and by `parseNames`.
 */
export function expandFollowers(text: string): string {
  const lines = text.split(/\r?\n/);
  if (!lines.some(isFollowersLine)) return text;
  return lines.flatMap((line) => (isFollowersLine(line) ? FOLLOWERS : [line])).join("\n");
}

/**
 * Turns the textarea content into a clean list: one name per line, spaces around a name
 * trimmed, blank lines ignored, duplicates kept (two people can share a name), the cheat expanded.
 */
export function parseNames(text: string): Result<string[], NamesErrorCode> {
  const names = expandFollowers(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (names.length === 0) return fail("NAMES_EMPTY", "Add at least one name, one per line.");
  if (names.length > MAX_NAMES) return fail("NAMES_TOO_MANY", `Use at most ${String(MAX_NAMES)} names.`);
  const long = names.find((n) => n.length > MAX_NAME_LENGTH);
  if (long !== undefined) return fail("NAME_TOO_LONG", `A name can have at most ${String(MAX_NAME_LENGTH)} characters.`);
  return ok(names);
}
