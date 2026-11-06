// Typed result shared by every core function: expected (user/input) problems come back with a
// stable code the app translates, never as a thrown error (forge-engineering → code-quality §6).

/** Either a value or an error with a stable `code` and an English `message`. */
export type Result<T, C extends string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly code: C; readonly message: string } };

/** Returns a successful {@link Result} holding `value`. */
export function ok<T>(value: T): { readonly ok: true; readonly value: T } {
  return { ok: true, value };
}

/** Returns a failed {@link Result} with a stable `code` and an English `message`. */
export function fail<C extends string>(code: C, message: string): { readonly ok: false; readonly error: { readonly code: C; readonly message: string } } {
  return { ok: false, error: { code, message } };
}
