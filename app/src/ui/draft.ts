import { t } from "../i18n/index.ts";
import { prefs } from "../storage/index.ts";
import { h } from "./dom.ts";

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

let hintCount = 0;

/**
 * Returns the small in-context "Saved on this device only." hint for fields whose input persists
 * (legal-pages §3, WP29 04/2012: storage stays exempt from consent but is never hidden). Links it to
 * every field with `aria-describedby`, so screen readers announce it too; place it before the fields.
 */
export function savedOnDeviceHint(fields: readonly Field[]): HTMLParagraphElement {
  hintCount += 1;
  const id = `saved-on-device-${String(hintCount)}`;
  for (const f of fields) f.setAttribute("aria-describedby", [f.getAttribute("aria-describedby"), id].filter(Boolean).join(" "));
  return h("p", { class: "hint", id }, t("shell.draft.saved"));
}
