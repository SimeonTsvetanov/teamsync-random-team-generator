// Who a copied or shared result names in its attribution line ("— Made with <name> · <url>"): a
// host app (Quizzard) may name itself instead of TeamSync. Used by the team screen (miniapp).
import * as z from "zod";

/** The app a copied or shared result names: its display name and address. */
export interface Attribution {
  readonly name: string;
  readonly url: string;
}

/** Most characters in an attribution name (it is a short app name, not a sentence). */
export const MAX_ATTRIBUTION_NAME_LENGTH = 40;
/** Most characters in an attribution address. */
export const MAX_ATTRIBUTION_URL_LENGTH = 200;

/**
 * Letters, digits, spaces and a few name marks; it starts with a letter or digit and ends with a
 * letter, so a number fused to it ("Quizzard3") always reads as the count. A one-character name
 * must therefore be a letter (a lone digit passed until CI's property test found it, 2026-11-22).
 */
const NAME_PATTERN = /^(?:\p{L}|[\p{L}\p{N}][\p{L}\p{M}\p{N} .'’&+!-]*[\p{L}\p{M}])$/u;

const AttributionSchema = z.object({
  name: z.string().trim().max(MAX_ATTRIBUTION_NAME_LENGTH).regex(NAME_PATTERN),
  // No spaces and no "@" (no user:password@ part); then a real https address on a domain name.
  url: z.string().trim().max(MAX_ATTRIBUTION_URL_LENGTH).regex(/^https:\/\/[^\s@]+$/u)
    .pipe(z.url({ protocol: /^https$/, hostname: z.regexes.domain, normalize: true })),
});

/**
 * Returns a valid attribution from untrusted input (a host's launch parameters), or null.
 * @param value - `{ name, url }` from outside: name = short plain text, url = an https address
 * without credentials
 * @returns the trimmed name and the normalised address, or null for anything else
 */
export function parseAttribution(value: unknown): Attribution | null {
  const parsed = AttributionSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * Returns the app name as the attribution line shows it: with the shuffle count fused on
 * ("Quizzard3", no space) when one is given, else the name alone.
 * @param name - the attribution name
 * @param count - shuffles of the roster behind the result, or null for none
 */
export function attributionName(name: string, count: number | null): string {
  return count === null ? name : `${name}${String(count)}`;
}
