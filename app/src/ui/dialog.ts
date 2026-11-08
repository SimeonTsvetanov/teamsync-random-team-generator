import { h } from "./dom.ts";
import { icon } from "./icons.ts";
import { t } from "../i18n/index.ts";
import { createToastRegion, relocateToasts } from "./toast.ts";

/** ms to keep a closed dialog for its exit animation (the short fade with reduced motion). */
export const closeDelay = (): number => {
  const token = matchMedia("(prefers-reduced-motion: reduce)").matches ? "--duration-fade" : "--duration-sheet";
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(token)) || 0;
};

export interface DialogOptions {
  /** Called before the user closes the dialog (X, Esc). Return false to keep it open — e.g. ask
   *  `confirmAction()` when a form has unsaved input (forge-design → ui-patterns §4). */
  readonly beforeClose?: () => boolean | Promise<boolean>;
  /** A few buttons only: compact bottom sheet on phones instead of full screen. */
  readonly compact?: boolean;
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
  const dialog = h("dialog", { class: options.compact ? "sheet sheet--compact" : "sheet", "data-dialog": id, "aria-labelledby": `dlg-${id}` },
    h("header", { class: "sheet-head" }, heading, close),
    h("div", { class: "sheet-body" }, ...body),
    createToastRegion()); // toasts shown while this sheet is open render inside it (accessibility §5)
  let isForced = false; // the browser closed it past the guard (non-cancelable cancel)
  let isAsking = false; // beforeClose is running (e.g. its confirm alert is open)
  const tryClose = async (): Promise<void> => {
    if (!options.beforeClose) {
      dialog.close();
      return;
    }
    isAsking = true;
    const canClose = await options.beforeClose();
    isAsking = false;
    if (canClose) dialog.close();
  };
  close.addEventListener("click", () => { void tryClose(); });
  // Light dismiss: a tap on the dimmed area outside closes it (same guard as X / Esc).
  dialog.addEventListener("click", (e) => {
    const r = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) void tryClose();
  });
  if (options.beforeClose) {
    // Escape: cancelling keydown stops the close request before the browser's close watcher,
    // which would let a second Escape through `cancel.preventDefault()` (HTML close watchers).
    dialog.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      void tryClose();
    });
    // Other close requests (Android Back) — and the alert's own Escape, which the browser groups
    // with this sheet when no user activation came between them: the cancel is then not
    // cancelable and the sheet closes anyway, so the close handler reopens it with its input.
    dialog.addEventListener("cancel", (e) => {
      if (!e.cancelable) {
        isForced = true;
        return;
      }
      e.preventDefault();
      void tryClose();
    });
  }
  dialog.addEventListener("close", () => {
    if (isForced) {
      isForced = false;
      dialog.showModal(); // same element: typed text, scroll and draft stay as they were
      // A forced close while the guard's confirm was open is that alert's Escape: the person
      // already answered "keep editing". Otherwise (Back) let the guard decide — a clean sheet closes.
      if (!isAsking) void tryClose();
      return;
    }
    // Keep it in the DOM until the closing animation ends (CSS overlay/display allow-discrete).
    setTimeout(() => { dialog.remove(); }, closeDelay());
    if (location.hash === `#${id}`) history.replaceState(null, "", location.pathname + location.search);
    opener?.focus();
  });
  document.body.append(dialog);
  dialog.showModal();
  relocateToasts(); // a toast shown before the sheet opened moves into it (accessibility §5)
  if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
  return dialog;
}
