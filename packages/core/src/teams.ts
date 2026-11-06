import * as z from "zod";
import { MAX_NAME_LENGTH, MAX_NAMES } from "./names.js";
import { fail, ok, type Result } from "./result.js";

export const MIN_TEAMS = 2;
export const MAX_TEAMS = 10;

/** One schema for the app, deep links and the MCP tool. */
export const TeamsInput = z.object({
  names: z.array(z.string().trim().min(1).max(MAX_NAME_LENGTH)).min(1).max(MAX_NAMES),
  teams: z.int().min(MIN_TEAMS).max(MAX_TEAMS),
});
export type TeamsInput = z.input<typeof TeamsInput>;

export type TeamsErrorCode = "TEAMS_OUT_OF_RANGE" | "TEAMS_MORE_THAN_NAMES" | "NAMES_INVALID";

/** Web Crypto, present in browsers and Node ≥ 19. Typed locally: core has no DOM/Node types. */
const webCrypto = (globalThis as unknown as { crypto: { getRandomValues: (a: Uint32Array) => Uint32Array } }).crypto;

/** Random integer in [0, maxExclusive). */
export type RandomInt = (maxExclusive: number) => number;

/**
 * Unbiased random integer from the browser/Node crypto source. Rejection sampling avoids the
 * modulo bias of `random % n` (the old app used the biased `sort(() => 0.5 - Math.random())`).
 */
export const cryptoRandomInt: RandomInt = (maxExclusive) => {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > 2 ** 32) throw new RangeError("maxExclusive must be an integer in 1..2^32");
  const limit = 2 ** 32 - (2 ** 32 % maxExclusive); // largest multiple of maxExclusive ≤ 2^32
  const buf = new Uint32Array(1);
  for (;;) {
    webCrypto.getRandomValues(buf);
    const v = buf[0] ?? 0;
    if (v < limit) return v % maxExclusive;
  }
};

/** Fisher–Yates shuffle (returns a new array; every order is equally likely). */
export function shuffle<T>(items: readonly T[], randomInt: RandomInt = cryptoRandomInt): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
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
