import * as z from "zod";

/** Input schema reused by the app, URL params, API and MCP (one source). */
export const slugInputSchema = z.string().max(200);

export type SlugResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly error: { readonly code: "SLUG_EMPTY" | "SLUG_TOO_LONG"; readonly message: string } };

/**
 * Example core function: turns any text into a URL-safe slug.
 * @param input - user text (max 200 characters)
 * @returns a typed result with a stable error code instead of throwing
 */
export function appSlug(input: string): SlugResult {
  const parsed = slugInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "SLUG_TOO_LONG", message: "Text is longer than 200 characters." } };
  }
  const value = parsed.data
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return value
    ? { ok: true, value }
    : { ok: false, error: { code: "SLUG_EMPTY", message: "Text has no letters or digits." } };
}
