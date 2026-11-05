import { h } from "./dom.ts";
import { icon } from "./icons.ts";

/**
 * Opens a native modal <dialog> (Esc closes, focus trapped and restored) with a title and body.
 * Phones get a full-height sheet via CSS. Each dialog has a deep link (#help, #settings, …).
 */
export function openDialog(id: string, title: string, body: Node[]): HTMLDialogElement {
  // Only one sheet at a time (deep links can change while one is open).
  document.querySelectorAll<HTMLDialogElement>("dialog.sheet[open]").forEach((d) => { d.close(); });
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const close = h("button", { class: "icon-button", type: "button", "aria-label": "Close" });
  close.append(icon("close"));
  const heading = h("h2", { id: `dlg-${id}`, tabindex: "-1", autofocus: "" }, title);
  const dialog = h("dialog", { class: "sheet", "data-dialog": id, "aria-labelledby": `dlg-${id}` },
    h("header", { class: "sheet-head" }, heading, close),
    h("div", { class: "sheet-body" }, ...body));
  close.addEventListener("click", () => { dialog.close(); });
  dialog.addEventListener("close", () => {
    dialog.remove();
    if (location.hash === `#${id}`) history.replaceState(null, "", location.pathname + location.search);
    opener?.focus();
  });
  document.body.append(dialog);
  dialog.showModal();
  if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
  return dialog;
}
