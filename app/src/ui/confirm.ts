import { t } from "../i18n/index.ts";
import { h } from "./dom.ts";
import { closeDelay } from "./dialog.ts";

export interface ConfirmOptions {
  readonly title: string; // the question with the action: "Delete all data?" — never "Are you sure?"
  readonly message: string; // the consequence: "This can't be undone."
  readonly confirm: string; // the verb again: "Delete" — never "OK" / "Yes"
  readonly cancel?: string; // default "Cancel"
  readonly danger?: boolean; // red confirm button (default true: confirms guard losing something)
}

/**
 * Modal confirmation for every action that deletes, replaces or discards something
 * (forge-design → ui-patterns §4). Centered alert over a blurred backdrop; Cancel has the
 * focus (safe default); Esc and a click outside = Cancel. Resolves true only on confirm.
 */
export function confirmAction(o: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const cancel = h("button", { class: "button", type: "button", value: "cancel" }, o.cancel ?? t("shell.cancel"));
    const ok = h("button", { class: `button ${o.danger === false ? "button--primary" : "button--danger"}`, type: "button", value: "ok" }, o.confirm);
    const dialog = h("dialog", { class: "alert", role: "alertdialog", "aria-labelledby": "alert-title", "aria-describedby": "alert-text" },
      h("h2", { id: "alert-title", class: "alert-title" }, o.title),
      h("p", { id: "alert-text", class: "alert-text" }, o.message),
      h("div", { class: "alert-actions" }, cancel, ok));
    let result = false;
    cancel.addEventListener("click", () => { dialog.close(); });
    ok.addEventListener("click", () => { result = true; dialog.close(); });
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }); // backdrop
    dialog.addEventListener("close", () => { resolve(result); setTimeout(() => { dialog.remove(); }, closeDelay()); });
    document.body.append(dialog);
    dialog.showModal();
    cancel.focus();
  });
}
