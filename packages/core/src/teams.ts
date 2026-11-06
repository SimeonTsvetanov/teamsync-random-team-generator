// Fair random teams: unbiased crypto shuffle, then round-robin dealing. Used by the app and MCP.
import * as z from "zod";
import { MAX_NAME_LENGTH, MAX_NAMES } from "./names.js";
import { fail, ok, type Result } from "./result.js";

/** Fewest teams a split can have. */
export const MIN_TEAMS = 2;
/** Most teams a split can have. */
export const MAX_TEAMS = 10;

/** One schema for the app, deep links and the MCP tool. */
export const TeamsInput = z.object({
  names: z.array(z.string().trim().min(1).max(MAX_NAME_LENGTH)).min(1).max(MAX_NAMES),
  teams: z.int().min(MIN_TEAMS).max(MAX_TEAMS),
});
/** Input of {@link makeTeams}: names and number of teams, before validation. */
export type TeamsInput = z.input<typeof TeamsInput>;

/** Why {@link makeTeams} refused to split. */
export type TeamsErrorCode = "TEAMS_OUT_OF_RANGE" | "TEAMS_MORE_THAN_NAMES" | "NAMES_INVALID";

/** Web Crypto, present in browsers and Node ≥ 19. */
// because core is built without DOM/Node types, the global is typed here by hand.
const webCrypto = (globalThis as unknown as { crypto: { getRandomValues: (a: Uint32Array) => Uint32Array } }).crypto;

/** Returns a random integer in [0, maxExclusive). */
export type RandomInt = (maxExclusive: number) => number;

/**
 * Returns an unbiased random integer in [0, maxExclusive) from the browser/Node crypto source.
 * Rejection sampling avoids the modulo bias of `random % n` (the old app used the biased
 * `sort(() => 0.5 - Math.random())`).
 *
 * @throws {@link RangeError} when `maxExclusive` is not an integer in 1..2^32 (a caller bug).
 */
export function cryptoRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > 2 ** 32) throw new RangeError("maxExclusive must be an integer in 1..2^32");
  const limit = 2 ** 32 - (2 ** 32 % maxExclusive); // largest multiple of maxExclusive ≤ 2^32
  const buf = new Uint32Array(1);
  for (;;) {
    webCrypto.getRandomValues(buf);
    const v = buf[0] ?? 0;
    if (v < limit) return v % maxExclusive;
  }
}

/** Returns a Fisher–Yates shuffled copy of `items`; every order is equally likely. */
export function shuffle<T>(items: readonly T[], randomInt: RandomInt = cryptoRandomInt): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    // because i and j are always inside 0..result.length-1, both reads are defined.
    const tmp = result[i] as T;
    result[i] = result[j] as T;
    result[j] = tmp;
  }
  return result;
}

/**
 * Splits names into `teams` fair, random teams: shuffle, then deal round-robin, so team sizes
 * differ by at most 1 and the bigger teams come first (11 names / 3 teams → 4, 4, 3).
 */
export function makeTeams(input: TeamsInput, randomInt: RandomInt = cryptoRandomInt): Result<string[][], TeamsErrorCode> {
  if (!Number.isInteger(input.teams) || input.teams < MIN_TEAMS || input.teams > MAX_TEAMS) {
    return fail("TEAMS_OUT_OF_RANGE", `Choose between ${String(MIN_TEAMS)} and ${String(MAX_TEAMS)} teams.`);
  }
  const parsed = TeamsInput.safeParse(input);
  if (!parsed.success) return fail("NAMES_INVALID", "Names must be 1–100 characters each, at most 1,000 names.");
  const { names, teams } = parsed.data;
  if (teams > names.length) return fail("TEAMS_MORE_THAN_NAMES", `You need at least ${String(teams)} names for ${String(teams)} teams.`);
  const result: string[][] = Array.from({ length: teams }, () => []);
  shuffle(names, randomInt).forEach((name, i) => { result[i % teams]?.push(name); });
  return ok(result);
}
