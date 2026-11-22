// The names box: live "the followers" expansion, debounced saving (flushed when the page is hidden
// or closed and at unmount), Clear with Undo, chat-list paste clean-up and text shared from
// another app. Wired by mount.ts.
import { expandFollowers, namesFromSharedText } from "@simeonts/teamsync-random-team-generator-core";
import { countNames, renderCount, setNames, showError } from "./form.ts";
import type { TeamsScreen } from "./screen.ts";

/** Typing pauses this long before the list is saved (one write per burst, not per key). */
const SAVE_DELAY_MS = 300;

/** Cancels a pending save, so a cleared list is never written back a moment later. */
export function cancelPendingSave(screen: TeamsScreen): void {
  clearTimeout(screen.saveTimer);
  screen.saveTimer = undefined;
}

/**
 * Writes a pending save now (once; nothing happens when none is pending), so the last typing
 * survives leaving the screen, hiding the page or closing it inside the 300 ms pause.
 */
export function flushPendingSave(screen: TeamsScreen): void {
  if (screen.saveTimer === undefined) return;
  cancelPendingSave(screen);
  screen.saved.setNames(screen.el.area.value);
}

/**
 * Shows `message` with Undo for ≥ 10 s (the host's action toasts last that long); Undo restores
 * and confirms (forge-design ui-patterns §4: reversible → Undo, not a confirmation).
 */
function offerUndo(screen: TeamsScreen, message: string, undo: () => void): void {
  const { shell } = screen.context;
  shell.toast(message, {
    action: {
      label: screen.t("undo"),
      run: () => {
        undo();
        shell.toast(screen.t("undone"));
      },
    },
  });
}

function onInput(screen: TeamsScreen): void {
  const { area } = screen.el;
  // The cheat expands live, like the original app (SPEC F6).
  const expanded = expandFollowers(area.value);
  if (expanded !== area.value) {
    area.value = expanded;
    area.setSelectionRange(expanded.length, expanded.length);
  }
  renderCount(screen);
  showError(screen, null);
  cancelPendingSave(screen);
  screen.saveTimer = setTimeout(() => {
    flushPendingSave(screen);
  }, SAVE_DELAY_MS);
}

function onClear(screen: TeamsScreen): void {
  const before = screen.el.area.value;
  setNames(screen, "");
  screen.el.area.focus();
  offerUndo(screen, screen.t("cleared"), () => {
    setNames(screen, before);
  });
}

/** Pasting a chat list (numbers, bullets, emoji, "[date] Name:" prefixes) keeps just the names. */
function onPaste(screen: TeamsScreen, event: ClipboardEvent): void {
  const { area } = screen.el;
  const pasted = event.clipboardData?.getData("text/plain") ?? "";
  const cleaned = namesFromSharedText(pasted);
  if (!cleaned || cleaned === pasted.trim()) return;
  event.preventDefault();
  area.setRangeText(cleaned, area.selectionStart, area.selectionEnd, "end");
  area.dispatchEvent(new Event("input"));
}

/**
 * Text shared from another app (Android "Share → TeamSync", launch parameter `shared`) becomes the
 * names; replacing a different list offers Undo, filling an empty box only says so.
 */
export function applySharedText(screen: TeamsScreen, text: string): void {
  const incoming = expandFollowers(namesFromSharedText(text));
  if (!incoming) return;
  const before = screen.el.area.value;
  setNames(screen, incoming);
  const message = screen.t("sharedIn", { count: countNames(incoming) });
  if (before.trim() && before !== incoming) {
    offerUndo(screen, message, () => {
      setNames(screen, before);
    });
  } else {
    screen.context.shell.toast(message);
  }
}

/** Restores the remembered list (SPEC F7) and wires the box; listeners end with `screen.signal`. */
export function initNamesInput(screen: TeamsScreen): void {
  const { area, clear } = screen.el;
  const { signal } = screen;
  area.value = screen.saved.names();
  area.addEventListener("input", () => {
    onInput(screen);
  }, { signal });
  clear.addEventListener("click", () => {
    onClear(screen);
  }, { signal });
  // Desktop shortcut for the main action (accessibility §6; documented in Help → Features).
  area.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    screen.el.form.requestSubmit();
  }, { signal });
  area.addEventListener("paste", (event) => {
    onPaste(screen, event);
  }, { signal });
  // pagehide, not unload/beforeunload: those disable the back/forward cache (app-rules test).
  window.addEventListener("pagehide", () => {
    flushPendingSave(screen);
  }, { signal });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPendingSave(screen);
  }, { signal });
}
