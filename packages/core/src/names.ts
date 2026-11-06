// Names handling: the "the followers" cheat, parsing the list and cleaning text shared from chats.
// Used by the app (names box, Generate) and the MCP tool.
import { fail, ok, type Result } from "./result.js";

/** Most names in one list — shared by the app, URL handling and MCP (SPEC §7). */
export const MAX_NAMES = 1000;
/** Most characters in one name (SPEC §7). */
export const MAX_NAME_LENGTH = 100;

/** The cheat word: a line with exactly this text (any case, surrounding spaces ignored). */
export const FOLLOWERS_CHEAT = "the followers";

/** The friends a `the followers` line expands to — the original TeamSync list + Keti (Moni 2026-11-06). */
export const FOLLOWERS: readonly string[] = [
  "Moni", "Iliyana", "George", "Viki", "Eli", "Asen", "Lubomir", "Ralica", "Venci",
  "Slavi", "Joni", "Apapa", "Mitaka G", "Tonkata", "Dinkata", "Keti", "Raiko", "Tancheto",
];

/** Why a names list was rejected by {@link parseNames}. */
export type NamesErrorCode = "NAMES_EMPTY" | "NAMES_TOO_MANY" | "NAME_TOO_LONG";

/** Returns true for a line that is the cheat word. */
export function isFollowersLine(line: string): boolean {
  return line.trim().toLowerCase() === FOLLOWERS_CHEAT;
}

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
  const long = names.find((name) => name.length > MAX_NAME_LENGTH);
  if (long !== undefined) return fail("NAME_TOO_LONG", `A name can have at most ${String(MAX_NAME_LENGTH)} characters.`);
  return ok(names);
}

/**
 * Turns text shared from a chat (WhatsApp, Viber, Messenger, notes…) into one name per line:
 * - drops chat prefixes like "[06.11.26, 18:03] Moni: " or "06/11/2026, 18:03 - Moni: ";
 * - drops list markers: "1.", "2)", "3 -", "-", "*", "•", "·", "–", "[x]", leading emoji;
 * - one line with commas or semicolons ("Ana, Boris; Vesko") becomes one name per item;
 * - a shared TeamSync result ("🏆 Team 1 … 👤 Ana") gives back just the names;
 * - links and empty lines are dropped. The "the followers" line is kept (it expands later).
 */
export function namesFromSharedText(text: string): string {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const teamSyncResult = lines.some((line) => line.includes("👤"));
  const chatPrefix = /^\s*\[?\d{1,4}[./-]\d{1,2}[./-]\d{1,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp]\.?[Mm]\.?)?\]?\s*(?:-\s*)?[^:]{1,40}:\s*/;
  const marker = /^\s*(?:\[[ xX✓]\]\s*|\d{1,3}\s*[.)\-:]\s*|[-*•·–—+>]\s*|(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|️|‍)+\s*)+/u;
  const out: string[] = [];
  for (const raw of lines) {
    if (teamSyncResult && !raw.includes("👤")) continue;
    let line = raw.replace(chatPrefix, "").replace(marker, "").trim();
    if (!line || /^https?:\/\//i.test(line) || /^[—–-]\s*(made with|направено с)/i.test(line)) continue;
    const parts = lines.filter((other) => other.trim()).length === 1 && /[,;]/.test(line) ? line.split(/[,;]/) : [line];
    for (const part of parts) {
      line = part.replace(marker, "").trim();
      if (line) out.push(line);
    }
  }
  return out.join("\n");
}
