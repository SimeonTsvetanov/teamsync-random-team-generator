/** Typed result: user/input problems are returned with a stable code, never thrown. */
export type Result<T, C extends string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly code: C; readonly message: string } };

export const ok = <T>(value: T): { readonly ok: true; readonly value: T } => ({ ok: true, value });
export const fail = <C extends string>(code: C, message: string): { readonly ok: false; readonly error: { readonly code: C; readonly message: string } } =>
  ({ ok: false, error: { code, message } });
