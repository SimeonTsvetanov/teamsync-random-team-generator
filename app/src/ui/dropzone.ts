import { h } from "./dom.ts";
import { icon } from "./icons.ts";
import { t } from "../i18n/index.ts";

export interface DropzoneOptions {
  readonly accept: readonly string[]; // MIME types, e.g. ["application/pdf"]
  readonly maxMB: number;
  readonly label: string; // e.g. "Drop a PDF here"
  readonly onFiles: (files: File[]) => void;
  readonly onError: (message: string) => void;
}

/**
 * File input for every input type (APP-STANDARD §15.1 #3): drag & drop, paste (Ctrl/Cmd+V,
 * incl. clipboard images) and a real "Choose file" button. Validates type and size first.
 */
export function createDropzone(o: DropzoneOptions): HTMLElement {
  const input = h("input", { type: "file", accept: o.accept.join(","), hidden: "", multiple: "" });
  const choose = h("button", { class: "button button--primary", type: "button" }, t("shell.dropzone.choose"));
  const zone = h("div", { class: "dropzone" }, icon("download", 28), h("p", { class: "dropzone-label" }, o.label),
    h("p", { class: "hint" }, t("shell.dropzone.hint", { mb: o.maxMB })), choose, input);
  const take = (list: Iterable<File>): void => {
    const files = [...list];
    const bad = files.find((f) => !o.accept.includes(f.type));
    if (bad) { o.onError(t("shell.dropzone.badType", { file: bad.name, types: o.accept.join(", ") })); return; }
    const big = files.find((f) => f.size > o.maxMB * 1024 * 1024);
    if (big) { o.onError(t("shell.dropzone.tooBig", { file: big.name, mb: o.maxMB })); return; }
    if (files.length) o.onFiles(files);
  };
  choose.addEventListener("click", () => { input.click(); });
  input.addEventListener("change", () => { if (input.files) take(input.files); input.value = ""; });
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("is-over"); });
  zone.addEventListener("dragleave", () => { zone.classList.remove("is-over"); });
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("is-over");
    if (e.dataTransfer) take(e.dataTransfer.files);
  });
  document.addEventListener("paste", (e) => {
    if (e.clipboardData?.files.length) take(e.clipboardData.files);
  });
  return zone;
}
