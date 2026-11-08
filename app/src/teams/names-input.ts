// The names box: live "the followers" expansion, debounced saving, Clear with Undo, chat-list
// paste clean-up and Android "Share → TeamSync". Wired by view.ts.
import { expandFollowers, namesFromSharedText } from "@simeonts/teamsync-random-team-generator-core";
import { t } from "../i18n/index.ts";
import { onShared } from "../ui/share-target.ts";
import { showToast, showUndo } from "../ui/toast.ts";
import { countNames, renderCount, setNames, showError } from "./form.ts";
import type { TeamsScreen } from "./screen.ts";
import { saved } from "./state.ts";

/** Typing pauses this long before the list is saved (one write per burst, not per key). */
const SAVE_DELAY_MS = 300;

/** Cancels a pending save, so a cleared list is never written back a moment later. */
export function cancelPendingSave(screen: TeamsScreen): void {
  clearTimeout(screen.saveTimer);
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
    saved.setNames(area.value);
  }, SAVE_DELAY_MS);
}

function onClear(screen: TeamsScreen): void {
  const before = screen.el.area.value;
  setNames(screen, "");
  screen.el.area.focus();
  // Clearing one field is reversible → Undo, not a confirmation (forge-design ui-patterns §4).
  showUndo(t("app.cleared"), () => {
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

/** Android "Share → TeamSync" (manifest share_target): the shared list becomes the names. */
function onSharedText(screen: TeamsScreen, text: string): void {
  const incoming = expandFollowers(namesFromSharedText(text));
  if (!incoming) return;
  const before = screen.el.area.value;
  setNames(screen, incoming);
  const message = t("app.sharedIn", { count: countNames(incoming) });
  // Replacing a different list is reversible; filling an empty box needs only a note.
  if (before.trim() && before !== incoming) {
    showUndo(message, () => {
      setNames(screen, before);
    });
  } else {
    showToast({ message });
  }
}

/** Restores the remembered list (SPEC F7) and wires every way names get into the box. */
export function initNamesInput(screen: TeamsScreen): void {
  const { area, clear } = screen.el;
  area.value = saved.names();
  area.addEventListener("input", () => {
    onInput(screen);
  });
  clear.addEventListener("click", () => {
    onClear(screen);
  });
  // Desktop shortcut for the main action (accessibility §6; documented in Help → Features).
  area.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    screen.el.form.requestSubmit();
  });
  area.addEventListener("paste", (event) => {
    onPaste(screen, event);
  });
  onShared((content) => {
    onSharedText(screen, content.text || content.title);
  });
}
