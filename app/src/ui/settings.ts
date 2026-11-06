import { app } from "../config.ts";
import { clearAll, estimate, exportAll, importAll, isPersisted, requestPersist } from "../storage/index.ts";
import { formatBytes, h } from "./dom.ts";
import { openDialog } from "./dialog.ts";
import { applyTheme, getTheme, type Theme } from "./theme.ts";
import { showToast } from "./toast.ts";
import { getLanguage, LANG_NAMES, setLanguage, t } from "../i18n/index.ts";

export function openSettings(): void {
  const themeGroup = h("fieldset", { class: "segmented" }, h("legend", {}, t("shell.theme.label")));
  for (const th of ["system", "light", "dark"] as const satisfies readonly Theme[]) {
    const input = h("input", { type: "radio", name: "theme", value: th, id: `theme-${th}` });
    input.checked = getTheme() === th;
    input.addEventListener("change", () => { applyTheme(th, true); });
    themeGroup.append(h("label", { for: `theme-${th}` }, input, t(`shell.theme.${th}`)));
  }
  // Language picker only when the app ships more than one language (forge-app-shell rule 9).
  const langGroup = h("fieldset", { class: "segmented" }, h("legend", {}, t("shell.language.label")));
  for (const l of app.languages) {
    const input = h("input", { type: "radio", name: "lang", value: l, id: `lang-${l}` });
    input.checked = getLanguage() === l;
    input.addEventListener("change", () => { setLanguage(l); openSettings(); });
    langGroup.append(h("label", { for: `lang-${l}`, lang: l }, input, LANG_NAMES[l]));
  }
  const used = h("p", {}, t("shell.settings.usedPending"));
  const persisted = h("p", {}, t("shell.settings.keptPending"));
  void estimate().then((e) => { used.textContent = e ? t("shell.settings.used", { size: formatBytes(e.usage) }) : t("shell.settings.usedNA"); });
  void isPersisted().then((ok) => { persisted.textContent = ok ? t("shell.settings.keptYes") : t("shell.settings.keptNo"); });
  const keep = h("button", { class: "button", type: "button" }, t("shell.settings.keep"));
  keep.addEventListener("click", () => {
    void requestPersist().then((ok) => {
      persisted.textContent = ok ? t("shell.settings.keptYes") : t("shell.settings.keptDenied");
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
    if (f) void importAll(f).then((n) => { showToast({ message: t("shell.settings.imported", { count: n }) }); }, (e: unknown) => {
      showToast({ message: e instanceof Error ? e.message : t("shell.settings.importFailed") });
    });
  });
  const clear = h("button", { class: "button button--danger", type: "button" }, t("shell.settings.clear"));
  clear.addEventListener("click", () => {
    if (confirm(t("shell.settings.clearConfirm", { name: app.name, stores: app.storage.stores.join(", ") }))) {
      void clearAll().then(() => { showToast({ message: t("shell.settings.cleared") }); });
    }
  });
  openDialog("settings", t("shell.settings.title"), [
    themeGroup,
    ...(app.languages.length > 1 ? [langGroup] : []),
    h("section", { class: "panel" }, h("h3", {}, t("shell.settings.storage")), used, persisted,
      h("div", { class: "actions" }, keep, exportBtn, importBtn, clear), file,
      h("p", { class: "hint" }, t("shell.settings.hint"))),
  ]);
}
