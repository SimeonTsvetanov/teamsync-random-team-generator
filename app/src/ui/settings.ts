import { app } from "../config.ts";
import { clearAll, estimate, exportAll, importAll, isPersisted, requestPersist } from "../storage/index.ts";
import { formatBytes, h } from "./dom.ts";
import { openDialog } from "./dialog.ts";
import { applyTheme, getTheme, type Theme } from "./theme.ts";
import { showToast } from "./toast.ts";

export function openSettings(): void {
  const themeGroup = h("fieldset", { class: "segmented" }, h("legend", {}, "Theme"));
  for (const t of ["system", "light", "dark"] as const satisfies readonly Theme[]) {
    const input = h("input", { type: "radio", name: "theme", value: t, id: `theme-${t}` });
    input.checked = getTheme() === t;
    input.addEventListener("change", () => { applyTheme(t, true); });
    themeGroup.append(h("label", { for: `theme-${t}` }, input, `${t.charAt(0).toUpperCase()}${t.slice(1)}`));
  }
  const used = h("p", {}, "Space used: …");
  const persisted = h("p", {}, "Kept on this device: …");
  void estimate().then((e) => { used.textContent = e ? `Space used: ${formatBytes(e.usage)} (shared by all apps on this site)` : "Space used: not available in this browser"; });
  void isPersisted().then((ok) => { persisted.textContent = ok ? "Kept on this device: yes ✓" : "Kept on this device: the browser may clear it when space is low"; });
  const keep = h("button", { class: "button", type: "button" }, "Keep my data on this device");
  keep.addEventListener("click", () => {
    void requestPersist().then((ok) => {
      persisted.textContent = ok ? "Kept on this device: yes ✓" : "The browser didn't allow it this time — export your data to be safe.";
    });
  });
  const exportBtn = h("button", { class: "button", type: "button" }, "Export my data");
  exportBtn.addEventListener("click", () => {
    void exportAll().then((blob) => {
      const ext = blob.type === "application/zip" ? "zip" : "json";
      const a = h("a", { href: URL.createObjectURL(blob), download: `${app.id}-data-${new Date().toISOString().slice(0, 10)}.${ext}` });
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); }, 1000);
    });
  });
  const file = h("input", { type: "file", accept: "application/json,application/zip,.zip", hidden: "" });
  const importBtn = h("button", { class: "button", type: "button" }, "Import");
  importBtn.addEventListener("click", () => { file.click(); });
  file.addEventListener("change", () => {
    const f = file.files?.[0];
    if (f) void importAll(f).then((n) => { showToast({ message: `Imported ${String(n)} item(s) ✓` }); }, (e: unknown) => {
      showToast({ message: e instanceof Error ? e.message : "Import failed" });
    });
  });
  const clear = h("button", { class: "button button--danger", type: "button" }, "Clear my data");
  clear.addEventListener("click", () => {
    if (confirm(`Delete everything ${app.name} saved on this device (${app.storage.stores.join(", ")})? This can't be undone.`)) {
      void clearAll().then(() => { showToast({ message: "Your data was cleared ✓" }); });
    }
  });
  openDialog("settings", "Settings", [
    themeGroup,
    h("section", { class: "panel" }, h("h3", {}, "Storage"), used, persisted,
      h("div", { class: "actions" }, keep, exportBtn, importBtn, clear), file,
      h("p", { class: "hint" }, "Everything stays only in this browser on this device. Export is your backup.")),
  ]);
}
