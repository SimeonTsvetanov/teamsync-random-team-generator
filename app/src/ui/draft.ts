import { prefs } from "../storage/index.ts";

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * Typed text is never lost (APP-STANDARD §15 #12): restores a saved draft into the fields, saves
 * every change (debounced) to prefs `draft:<id>`, and `clear()` removes it after send/discard.
 * Fields are matched by `name`. Never use it for passwords or payment data.
 */
export function keepDraft(id: string, fields: readonly Field[]): { clear: () => void; isEmpty: () => boolean } {
  const key = `draft:${id}`;
  const saved = prefs.get<Record<string, string>>(key, {});
  for (const f of fields) {
    const v = saved[f.name];
    if (v !== undefined) f.value = v;
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const save = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const data = Object.fromEntries(fields.filter((f) => f.value.trim() && f.type !== "password").map((f) => [f.name, f.value]));
      if (Object.keys(data).length) prefs.set(key, data);
      else prefs.remove(key);
    }, 300);
  };
  for (const f of fields) f.addEventListener("input", save);
  return {
    clear: () => { clearTimeout(timer); prefs.remove(key); },
    isEmpty: () => fields.every((f) => f instanceof HTMLSelectElement || !f.value.trim()),
  };
}
