import { t } from "../i18n/index.ts";

export interface ToastOptions {
  readonly message: string;
  readonly action?: { readonly label: string; readonly run: () => void };
  readonly persistent?: boolean;
  readonly duration?: number; // ms, default 5000
}

/** Shows one toast at a time in the polite live region. */
export function showToast({ message, action, persistent = false, duration = 5000 }: ToastOptions): void {
  const region = document.querySelector<HTMLElement>("[data-toasts]");
  if (!region) return;
  region.replaceChildren();
  const toast = document.createElement("div");
  toast.className = "toast";
  const text = document.createElement("span");
  text.textContent = message;
  toast.append(text);
  if (action) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = action.label;
    b.addEventListener("click", () => { toast.remove(); action.run(); });
    toast.append(b);
  }
  region.append(toast);
  if (!persistent) setTimeout(() => { toast.remove(); }, duration);
}

/**
 * Undo instead of "Are you sure?" for small, reversible actions (remove one item, clear a field):
 * do the action at once, then offer Undo for 8 s (forge-design → ui-patterns §4). Bulk or
 * irreversible actions still use confirmAction().
 */
export function showUndo(message: string, undo: () => void, duration = 8000): void {
  showToast({ message, duration, action: { label: t("shell.undo"), run: () => { undo(); showToast({ message: t("shell.undone") }); } } });
}
