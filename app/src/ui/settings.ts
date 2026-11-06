import { app } from "../config.ts";
import { clearAll, estimate, exportAll, importAll, isPersisted, requestPersist } from "../storage/index.ts";
import { getLanguage, LANG_NAMES, setLanguage, t } from "../i18n/index.ts";
import { formatBytes, h } from "./dom.ts";
import { openDialog } from "./dialog.ts";
import { confirmAction } from "./confirm.ts";
import { applyTheme, getTheme, type Theme } from "./theme.ts";
import { showToast } from "./toast.ts";

/** iOS-style grouped section: small title above a card (forge-design → ui-patterns §12). */
const group = (title: string, ...content: Node[]): HTMLElement =>
  h("section", { class: "group" }, h("h3", { class: "group-title" }, title), h("div", { class: "group-card" }, ...content));
/** Label left, value right; wraps under each other when narrow. */
const row = (label: string, value: HTMLElement): HTMLElement => h("div", { class: "row" }, h("span", { class: "row-label" }, label), value);

function segmented(name: string, legend: string, options: readonly { value: string; label: string; lang?: string }[], current: string, onPick: (v: string) => void): HTMLFieldSetElement {
  const set = h("fieldset", { class: "segmented" }, h("legend", { class: "visually-hidden" }, legend));
  for (const o of options) {
    const input = h("input", { type: "radio", name, value: o.value, id: `${name}-${o.value}` });
    input.checked = current === o.value;
    input.addEventListener("change", () => { onPick(o.value); });
    set.append(h("label", { for: `${name}-${o.value}`, ...(o.lang ? { lang: o.lang } : {}) }, input, o.label));
  }
  return set;
}

export function openSettings(): void {
  const theme = segmented("theme", t("shell.theme.label"),
    (["system", "light", "dark"] as const satisfies readonly Theme[]).map((v) => ({ value: v, label: t(`shell.theme.${v}`) })),
    getTheme(), (v) => { applyTheme(v as Theme, true); });
  // Language picker only when the app ships more than one language (forge-app-shell rule 9).
  const language = segmented("lang", t("shell.language.label"),
    app.languages.map((l) => ({ value: l, label: LANG_NAMES[l], lang: l })),
    getLanguage(), (v) => { setLanguage(v as (typeof app.languages)[number]); openSettings(); });

  const used = h("span", { class: "row-value" }, "…");
  const kept = h("span", { class: "row-value" }, "…");
  void estimate().then((e) => { used.textContent = e ? formatBytes(e.usage) : t("shell.settings.usedNA"); });
  void isPersisted().then((ok) => { kept.textContent = ok ? t("shell.settings.keptYes") : t("shell.settings.keptNo"); });

  const keep = h("button", { class: "button", type: "button" }, t("shell.settings.keep"));
  keep.addEventListener("click", () => {
    void requestPersist().then((ok) => {
      kept.textContent = ok ? t("shell.settings.keptYes") : t("shell.settings.keptNo");
      if (!ok) showToast({ message: t("shell.settings.keptDenied") });
    });
  });
  const exportBtn = h("button", { class: "button", type: "button" }, t("shell.settings.export"));
  exportBtn.addEventListener("click", () => {
    void exportAll().then((blob) => {
      const ext = blob.type === "application/zip" ? "zip" : "json";
      const a = h("a", { href: URL.createObjectURL(blob), download: `${app.id}-data-${new Date().toISOString().slice(0, 10)}.${ext}` });
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); }, 1000);
    });
  });
  const file = h("input", { type: "file", accept: "application/json,application/zip,.zip", hidden: "" });
  const importBtn = h("button", { class: "button", type: "button" }, t("shell.settings.import"));
  importBtn.addEventListener("click", () => { file.click(); });
  file.addEventListener("change", () => {
    const f = file.files?.[0];
    file.value = "";
    if (!f) return;
    void confirmAction({
      title: t("shell.settings.importTitle"), message: t("shell.settings.importMessage", { name: app.name, file: f.name }),
      confirm: t("shell.settings.importConfirm"),
    }).then((yes) => {
      if (!yes) return;
      importAll(f).then((n) => { showToast({ message: t("shell.settings.imported", { count: n }) }); }, (e: unknown) => {
        showToast({ message: e instanceof Error && e.message === "NOT_THIS_APP" ? t("shell.settings.importWrongApp", { name: app.name }) : t("shell.settings.importFailed") });
      });
    });
  });
  const clear = h("button", { class: "button button--danger", type: "button" }, t("shell.settings.clear"));
  clear.addEventListener("click", () => {
    void confirmAction({
      title: t("shell.settings.clearTitle"), message: t("shell.settings.clearMessage", { name: app.name, stores: app.storage.stores.join(", ") }),
      confirm: t("shell.settings.clearConfirm"),
    }).then((yes) => {
      // App code listens for "app:data-cleared" to reset what is on screen (else it could be saved again).
      if (yes) void clearAll().then(() => { document.dispatchEvent(new Event("app:data-cleared")); showToast({ message: t("shell.settings.cleared") }); });
    });
  });

  openDialog("settings", t("shell.settings.title"), [
    group(t("shell.theme.label"), theme),
    ...(app.languages.length > 1 ? [group(t("shell.language.label"), language)] : []),
    group(t("shell.settings.storage"),
      row(t("shell.settings.usedLabel"), used),
      row(t("shell.settings.keptLabel"), kept),
      h("div", { class: "button-stack" }, keep, exportBtn, importBtn), file),
    h("p", { class: "group-note" }, t("shell.settings.hint")),
    group(t("shell.settings.danger"), h("div", { class: "button-stack" }, clear)),
  ]);
}
