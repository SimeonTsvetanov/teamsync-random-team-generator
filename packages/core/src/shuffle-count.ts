// How many times teams were made from the same people in a row (DECISIONS 2026-11-22): a stable
// fingerprint of the roster and the counter that follows it. Used by the team screen (miniapp).
import * as z from "zod";

/** The highest count kept and shown; further shuffles of the same roster stay at it. */
export const MAX_SHUFFLE_COUNT = 999;

/** The remembered count: whose roster (fingerprint, never the names) and how many shuffles. */
export interface ShuffleCount {
  /** {@link rosterFingerprint} of the roster the count belongs to. */
  readonly fingerprint: string;
  /** Shuffles of that roster in a row, 1…{@link MAX_SHUFFLE_COUNT}. */
  readonly count: number;
}

/** Length of a fingerprint: 53 bits as hex, zero-padded. */
const FINGERPRINT_LENGTH = 14;

const ShuffleCountSchema = z.object({
  fingerprint: z.string().regex(new RegExp(`^[0-9a-f]{${String(FINGERPRINT_LENGTH)}}$`)),
  count: z.int().min(1).max(MAX_SHUFFLE_COUNT),
});

/**
 * Returns the form of a name two people would call "the same name": Unicode NFC, a case fold
 * (upper then lower, so "Straße" = "STRASSE"), surrounding spaces trimmed and inner runs of any
 * whitespace collapsed to one space.
 */
export function normalizeRosterName(name: string): string {
  return name.normalize("NFC").toUpperCase().toLowerCase().normalize("NFC").replace(/\s+/gu, " ").trim();
}

/**
 * cyrb53 (public domain, bryc): a fast 53-bit string hash. Synchronous on purpose — the count must
 * be final when the teams are drawn, and Web Crypto's digest is async and needs a secure context.
 */
function hash53(text: string): string {
  let first = 0xdeadbeef;
  let second = 0x41c6ce57;
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    first = Math.imul(first ^ code, 2654435761);
    second = Math.imul(second ^ code, 1597334677);
  }
  first = Math.imul(first ^ (first >>> 16), 2246822507) ^ Math.imul(second ^ (second >>> 13), 3266489909);
  second = Math.imul(second ^ (second >>> 16), 2246822507) ^ Math.imul(first ^ (first >>> 13), 3266489909);
  const value = 4294967296 * (2097151 & second) + (first >>> 0);
  return value.toString(16).padStart(FINGERPRINT_LENGTH, "0");
}

/**
 * Returns a short, non-reversible fingerprint of a roster: the same people give the same value
 * whatever the order, case or spacing; blank names are ignored and a repeated name counts each
 * time (two people can share a name, as in `parseNames`).
 * @param names - the parsed names list
 * @returns 14 lower-case hex characters
 */
export function rosterFingerprint(names: readonly string[]): string {
  const roster = names.map(normalizeRosterName).filter((name) => name.length > 0);
  // Normalised names hold no line breaks, so "\n" separates them unambiguously.
  return hash53(roster.sort().join("\n"));
}

/**
 * Returns the count after one more successful shuffle of the roster `fingerprint`: the previous
 * count + 1 (at most {@link MAX_SHUFFLE_COUNT}) for the same roster, else 1 (the people changed).
 * @param previous - the remembered count, or null when there is none
 * @param fingerprint - {@link rosterFingerprint} of the roster just shuffled
 */
export function nextShuffleCount(previous: ShuffleCount | null, fingerprint: string): ShuffleCount {
  if (previous?.fingerprint !== fingerprint) return { fingerprint, count: 1 };
  return { fingerprint, count: Math.min(previous.count + 1, MAX_SHUFFLE_COUNT) };
}

/**
 * Returns a remembered count read from storage, or null when it is missing or not valid.
 * @param value - anything (storage is not trusted)
 */
export function parseShuffleCount(value: unknown): ShuffleCount | null {
  const parsed = ShuffleCountSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
