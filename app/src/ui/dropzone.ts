import { h } from "./dom.ts";
import { icon } from "./icons.ts";

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
  const choose = h("button", { class: "button button--primary", type: "button" }, "Choose file");
  const zone = h("div", { class: "dropzone" }, icon("download", 28), h("p", { class: "dropzone-label" }, o.label),
    h("p", { class: "hint" }, `or paste · max ${String(o.maxMB)} MB`), choose, input);
  const take = (list: Iterable<File>): void => {
    const files = [...list];
    const bad = files.find((f) => !o.accept.includes(f.type));
    if (bad) { o.onError(`“${bad.name}” isn't a supported file. Use: ${o.accept.join(", ")}.`); return; }
    const big = files.find((f) => f.size > o.maxMB * 1024 * 1024);
    if (big) { o.onError(`“${big.name}” is larger than ${String(o.maxMB)} MB.`); return; }
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
