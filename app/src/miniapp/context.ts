// The standalone site's MiniAppContext (contract, Quizzard PLAN §1.2): the same services Quizzard
// gives the Teams body, adapted to this app's own i18n, theme, toast, confirm, share and storage
// modules, so the body behaves exactly as it did when it lived in app/src/teams (PLAN TS-01).
import type { MiniAppContext, Signal, StorageArea } from "@simeonts/teamsync-random-team-generator-miniapp/contract";
import { app } from "../config.ts";
import { getLanguage } from "../i18n/index.ts";
import { setTaskRunning } from "../state.ts";
import { prefs } from "../storage/index.ts";
import { confirmAction } from "../ui/confirm.ts";
import { shareText } from "../ui/share.ts";
import { showToast } from "../ui/toast.ts";

/** Event `setLanguage()` fires on `document` (i18n/index.ts). */
const LANGUAGE_CHANGE_EVENT = "i18n:change";
const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

/** Inputs of {@link createStandaloneContext}. */
export interface StandaloneContextOptions {
  /** The body's storage area (`meta.storage`); must be this app's own prefix. */
  readonly area: StorageArea;
  /** Launch parameters for this mount. */
  readonly query: URLSearchParams;
}

/**
 * Returns a signal over `read` that tells subscribers about real changes; `watch` starts listening
 * for one subscriber and returns how to stop.
 */
function watchedSignal<T>(read: () => T, watch: (onChange: () => void) => () => void): Signal<T> {
  return {
    get: read,
    subscribe(listener) {
      let last = read();
      return watch(() => {
        const value = read();
        if (value === last) return;
        last = value;
        listener(value);
      });
    },
  };
}

/** The resolved theme: the `data-theme` theme.ts sets on <html>, else the OS scheme. */
function resolvedTheme(): "light" | "dark" {
  const chosen = document.documentElement.getAttribute("data-theme");
  if (chosen === "light" || chosen === "dark") return chosen;
  return matchMedia(DARK_SCHEME_QUERY).matches ? "dark" : "light";
}

/** Theme changes: theme.ts only sets `data-theme` (no event), so watch the attribute and the OS. */
function watchTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const scheme = matchMedia(DARK_SCHEME_QUERY);
  scheme.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    scheme.removeEventListener("change", onChange);
  };
}

function watchLanguage(onChange: () => void): () => void {
  document.addEventListener(LANGUAGE_CHANGE_EVENT, onChange);
  return () => { document.removeEventListener(LANGUAGE_CHANGE_EVENT, onChange); };
}

/** Toast, confirm and share of this app; `setTitle` is a no-op (ui/title.ts owns the tab title). */
function shellServices(): MiniAppContext["shell"] {
  return {
    // `tone` is dropped: this app's toasts have one look.
    toast: (message, options) => {
      const action = options?.action;
      showToast(action === undefined ? { message } : { message, action: { label: action.label, run: () => { action.run(); } } });
    },
    confirm: ({ title, text, confirm, cancel, danger }) => confirmAction({ title, message: text ?? "", confirm, ...(cancel === undefined ? {} : { cancel }), ...(danger === undefined ? {} : { danger }) }),
    // The app's Share flow reports no outcome (cancelling the sheet is silent), so it resolves "shared".
    share: async ({ text, title }) => {
      await shareText(text, title ?? app.name);
      return "shared";
    },
    setTitle: () => undefined,
    setBusy: (isBusy) => { setTaskRunning(isBusy); },
  };
}

/**
 * Builds the context the standalone page mounts the Teams body with.
 * @remarks One screen, so `navigation` does nothing; the header has no mini-app buttons, so
 * `slots.headerActions` is a detached element; `notifySaved` does nothing because this app asks
 * for persistent storage only from Settings → Storage.
 * @throws {@link Error} `STORAGE_AREA_MISMATCH` when `area` is not this app's prefix (its prefs
 * module writes `<app.id>:v1:<key>`)
 */
export function createStandaloneContext({ area, query }: StandaloneContextOptions): MiniAppContext {
  if (area.prefix !== `${app.id}:v1:`) throw new Error(`STORAGE_AREA_MISMATCH: ${area.prefix} is not ${app.id}:v1:`);
  return {
    host: "standalone",
    language: watchedSignal(getLanguage, watchLanguage),
    theme: watchedSignal(resolvedTheme, watchTheme),
    query,
    shell: shellServices(),
    navigation: { home: () => undefined, open: () => undefined },
    slots: { headerActions: document.createElement("div") },
    storage: {
      area,
      prefs: { get: (key, fallback) => prefs.get(key, fallback), set: (key, value) => prefs.set(key, value), remove: (key) => { prefs.remove(key); } },
      notifySaved: () => undefined,
    },
  };
}
