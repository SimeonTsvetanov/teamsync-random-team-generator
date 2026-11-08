// Toasts in a polite live region: one at a time; a pinned toast (e.g. "New version available")
// comes back after any later toast ends, until its action runs. While a modal is open the toast
// lives inside the topmost open dialog — outside it would be inert and hidden (accessibility §5);
// it moves back to the page when that dialog closes.
import { t } from "../i18n/index.ts";
import { h } from "./dom.ts";

export interface ToastOptions {
  readonly message: string;
  readonly action?: { readonly label: string; readonly run: () => void };
  readonly persistent?: boolean;
  /** Persistent and shown again whenever a later toast ends, until its action runs (update offer). */
  readonly pinned?: boolean;
  /** ms; default 5000 — toasts with an action last at least ACTION_MIN_MS (WCAG 2.2.1, HIG). */
  readonly duration?: number;
}

interface LiveToast {
  readonly toast: HTMLElement;
  /** The control that had focus when the toast appeared; focus returns there. */
  readonly trigger: Element | null;
  readonly timer: ReturnType<typeof pausableTimer> | null;
}

const ACTION_MIN_MS = 10_000;
let pinnedToast: ToastOptions | null = null;
let live: LiveToast | null = null;
let isWatchingDialogs = false;

/** Returns a new, empty polite toast region; dialog.ts puts one in every sheet. */
export function createToastRegion(): HTMLDivElement {
  return h("div", { class: "toast-region", role: "status", "aria-live": "polite", "data-toasts": "" });
}

/** The region inside the topmost open modal dialog (created on demand), else the page's region. */
function currentRegion(): HTMLElement | null {
  const dialog = [...document.querySelectorAll("dialog")].filter((d) => d.matches(":modal")).at(-1);
  if (!dialog) return document.querySelector<HTMLElement>("body > [data-toasts]");
  return dialog.querySelector<HTMLElement>(":scope > [data-toasts]") ?? dialog.appendChild(createToastRegion());
}

/**
 * Returns a timer that calls `onEnd` after `ms`, paused while `pause()` holds and resumed with the
 * remaining time on `resume()` — for toasts that wait while hovered or focused.
 */
export function pausableTimer(ms: number, onEnd: () => void): { pause: () => void; resume: () => void; cancel: () => void } {
  let remaining = ms;
  let startedAt = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(onEnd, remaining);
  return {
    pause: () => {
      if (timer === undefined) return;
      clearTimeout(timer);
      timer = undefined;
      remaining -= Date.now() - startedAt;
    },
    resume: () => {
      if (timer !== undefined) return;
      startedAt = Date.now();
      timer = setTimeout(onEnd, Math.max(remaining, 0));
    },
    cancel: () => {
      clearTimeout(timer);
      timer = undefined;
    },
  };
}

/** Removes the live toast and its timer; if it had focus, focus goes back to its trigger. */
function dismissLive(): void {
  if (!live) return;
  const { toast, trigger, timer } = live;
  live = null;
  timer?.cancel();
  const hadFocus = toast.contains(document.activeElement);
  toast.remove();
  if (hadFocus && trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
}

function render(region: HTMLElement, options: ToastOptions): void {
  const { message, action, persistent = false, pinned = false } = options;
  const duration = action ? Math.max(options.duration ?? ACTION_MIN_MS, ACTION_MIN_MS) : (options.duration ?? 5000);
  dismissLive(); // one at a time: the old toast's timer stops, and its focus goes home first
  if (!isWatchingDialogs) {
    // A closing dialog (sheet, alert, menu) takes its region with it: bring the toast back.
    // `close` does not bubble, so listen in the capture phase.
    document.addEventListener("close", () => { relocateToasts(); }, true);
    isWatchingDialogs = true;
  }
  const trigger = document.activeElement; // focus returns here if the toast goes while focused
  const toast = h("div", { class: "toast" }, h("span", {}, message));
  if (action) {
    const button = h("button", { type: "button" }, action.label);
    button.addEventListener("click", () => {
      dismissLive();
      if (pinned) pinnedToast = null;
      action.run();
      restorePinned();
    });
    toast.append(button);
  }
  region.append(toast);
  const timer = persistent || pinned ? null : pausableTimer(duration, () => { dismissLive(); restorePinned(); });
  live = { toast, trigger, timer };
  if (!timer) return;
  // Time-boxed content waits while the person is on it (WCAG 2.2.1, HIG): hover or focus pauses.
  let isHovered = false;
  const sync = (): void => { if (isHovered || toast.contains(document.activeElement)) timer.pause(); else timer.resume(); };
  toast.addEventListener("pointerenter", () => { isHovered = true; sync(); });
  toast.addEventListener("pointerleave", () => { isHovered = false; sync(); });
  toast.addEventListener("focusin", sync);
  toast.addEventListener("focusout", () => { setTimeout(sync); }); // activeElement updates after focusout
}

/** Shows the pinned toast again when no toast is visible (a later toast has ended). */
function restorePinned(): void {
  const region = currentRegion();
  if (pinnedToast && region && !live) render(region, pinnedToast);
}

/**
 * Moves the visible toast into the region that is perceivable now: into a modal that just opened,
 * back to the page (or the next modal) when one closes. Call after showModal() and on close.
 */
export function relocateToasts(): void {
  const region = currentRegion();
  if (live && region && live.toast.parentElement !== region) region.append(live.toast);
  restorePinned();
}

/** Shows one toast at a time (inside the open modal, if any); a `pinned` toast returns after later ones. */
export function showToast(options: ToastOptions): void {
  const region = currentRegion();
  if (!region) return;
  if (options.pinned) pinnedToast = options;
  render(region, options);
}

/**
 * Undo instead of "Are you sure?" for small, reversible actions (remove one item, clear a field):
 * do the action at once, then offer Undo for ≥ 10 s, paused while hovered/focused (forge-design →
 * ui-patterns §4, §6). Bulk or irreversible actions still use confirmAction().
 */
export function showUndo(message: string, undo: () => void, duration = ACTION_MIN_MS): void {
  showToast({ message, duration, action: { label: t("shell.undo"), run: () => { undo(); showToast({ message: t("shell.undone") }); } } });
}
