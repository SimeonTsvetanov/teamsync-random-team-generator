import { h } from "./dom.ts";
import { icon } from "./icons.ts";
import { t } from "../i18n/index.ts";

/** ms to keep a closed dialog for its exit animation (0 with reduced motion). */
export const closeDelay = (): number =>
  matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--duration-sheet")) || 0;

export interface DialogOptions {
  /** Called before the user closes the dialog (X, Esc). Return false to keep it open — e.g. ask
   *  `confirmAction()` when a form has unsaved input (forge-design → ui-patterns §4). */
  readonly beforeClose?: () => boolean | Promise<boolean>;
}

/**
 * Opens a native modal <dialog> (Esc closes, focus trapped and restored) with a title and body.
 * Phones get a full-height sheet via CSS. Each dialog has a deep link (#help, #settings, …).
 */
export function openDialog(id: string, title: string, body: Node[], options: DialogOptions = {}): HTMLDialogElement {
  // Only one sheet at a time (deep links can change while one is open).
  document.querySelectorAll<HTMLDialogElement>("dialog.sheet[open]").forEach((d) => { d.close(); });
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const close = h("button", { class: "icon-button", type: "button", "aria-label": t("shell.close") });
  close.append(icon("close"));
  const heading = h("h2", { id: `dlg-${id}`, tabindex: "-1", autofocus: "" }, title);
  const dialog = h("dialog", { class: "sheet", "data-dialog": id, "aria-labelledby": `dlg-${id}` },
    h("header", { class: "sheet-head" }, heading, close),
    h("div", { class: "sheet-body" }, ...body));
  const tryClose = async (): Promise<void> => {
    if (!options.beforeClose || (await options.beforeClose())) dialog.close();
  };
  close.addEventListener("click", () => { void tryClose(); });
  // Light dismiss: a tap on the dimmed area outside closes it (same guard as X / Esc).
  dialog.addEventListener("click", (e) => {
    const r = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) void tryClose();
  });
  dialog.addEventListener("cancel", (e) => { // Esc
    if (!options.beforeClose) return;
    e.preventDefault();
    void tryClose();
  });
  dialog.addEventListener("close", () => {
    // Keep it in the DOM until the closing animation ends (CSS overlay/display allow-discrete).
    setTimeout(() => { dialog.remove(); }, closeDelay());
    if (location.hash === `#${id}`) history.replaceState(null, "", location.pathname + location.search);
    opener?.focus();
  });
  document.body.append(dialog);
  dialog.showModal();
  if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
  return dialog;
}
