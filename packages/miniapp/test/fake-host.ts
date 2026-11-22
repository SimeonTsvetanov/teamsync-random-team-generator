// Test double of a host (contract `MiniAppContext`) and the browser APIs jsdom lacks, for the body's
// DOM tests. Every service is a spy; prefs live in a Map; the language is a settable signal.
import { vi } from "vitest";
import type { Lang, MiniAppContext } from "../src/contract.ts";

/** A fake host: its context plus handles to drive and inspect it. */
export interface FakeHost {
  readonly context: MiniAppContext;
  readonly stored: Map<string, unknown>;
  readonly toast: ReturnType<typeof vi.fn<MiniAppContext["shell"]["toast"]>>;
  readonly notifySaved: ReturnType<typeof vi.fn<() => void>>;
  /** Number of live language subscriptions. */
  languageListeners(): number;
  setLanguage(lang: Lang): void;
}

/** Returns a fake host whose launch parameters are `query`. */
export function fakeHost(query = ""): FakeHost {
  let language: Lang = "en";
  const listeners = new Set<(lang: Lang) => void>();
  const stored = new Map<string, unknown>();
  const toast = vi.fn<MiniAppContext["shell"]["toast"]>();
  const notifySaved = vi.fn<() => void>();
  const context: MiniAppContext = {
    host: "quizzard",
    language: {
      get: () => language,
      subscribe: (listener) => {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
      },
    },
    theme: { get: () => "light", subscribe: () => () => undefined },
    query: new URLSearchParams(query),
    shell: {
      toast,
      confirm: vi.fn(() => Promise.resolve(true)),
      share: vi.fn(() => Promise.resolve("shared" as const)),
      setTitle: vi.fn(),
      setBusy: vi.fn(),
    },
    navigation: { home: vi.fn(), open: vi.fn() },
    slots: { headerActions: document.createElement("div") },
    storage: {
      area: { prefix: "teamsync-random-team-generator:v1:" },
      prefs: {
        get: <T>(key: string, fallback: T): T => (stored.has(key) ? (stored.get(key) as T) : fallback),
        set: (key, value) => { stored.set(key, value); return true; },
        remove: (key) => { stored.delete(key); },
      },
      notifySaved,
    },
  };
  return {
    context, stored, toast, notifySaved,
    languageListeners: () => listeners.size,
    setLanguage: (lang) => {
      language = lang;
      for (const listener of listeners) listener(lang);
    },
  };
}

/** Adds what jsdom does not implement: matchMedia (nothing matches), scrollIntoView, checkVisibility. */
export function stubBrowser(): void {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  Element.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.checkVisibility = () => true;
}
