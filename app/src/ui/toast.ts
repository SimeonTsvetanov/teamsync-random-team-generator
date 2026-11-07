// Toasts in the polite live region: one at a time; a pinned toast (e.g. "New version available")
// comes back after any later toast ends, until its action runs.
import { t } from "../i18n/index.ts";

export interface ToastOptions {
  readonly message: string;
  readonly action?: { readonly label: string; readonly run: () => void };
  readonly persistent?: boolean;
  /** Persistent and shown again whenever a later toast ends, until its action runs (update offer). */
  readonly pinned?: boolean;
  readonly duration?: number; // ms, default 5000
}

let pinnedToast: ToastOptions | null = null;

/** Shows the pinned toast again when the region is empty (a later toast has ended). */
function restorePinned(region: HTMLElement): void {
  if (pinnedToast && region.childElementCount === 0) render(region, pinnedToast);
}

function render(region: HTMLElement, { message, action, persistent = false, pinned = false, duration = 5000 }: ToastOptions): void {
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
    b.addEventListener("click", () => {
      toast.remove();
      if (pinned) pinnedToast = null;
      action.run();
      restorePinned(region);
    });
    toast.append(b);
  }
  region.append(toast);
  if (!persistent && !pinned) setTimeout(() => { toast.remove(); restorePinned(region); }, duration);
}

/** Shows one toast at a time in the polite live region; a `pinned` toast returns after later ones. */
export function showToast(options: ToastOptions): void {
  const region = document.querySelector<HTMLElement>("[data-toasts]");
  if (!region) return;
  if (options.pinned) pinnedToast = options;
  render(region, options);
}

/**
 * Undo instead of "Are you sure?" for small, reversible actions (remove one item, clear a field):
 * do the action at once, then offer Undo for 8 s (forge-design → ui-patterns §4). Bulk or
 * irreversible actions still use confirmAction().
 */
export function showUndo(message: string, undo: () => void, duration = 8000): void {
  showToast({ message, duration, action: { label: t("shell.undo"), run: () => { undo(); showToast({ message: t("shell.undone") }); } } });
}
