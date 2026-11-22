// The mini-app contract (PLAN §1.2): the only API between the Quizzard shell and a mini-app.
// Types only; app repos carry a verbatim copy that `scripts/contract-sync.test.ts` compares.
// Because `mount` receives a DOM element and launch parameters, the contract needs the DOM types
// even though core has no DOM lib of its own; nothing in core uses DOM globals at runtime.
/// <reference lib="dom" />

/** A language the shell can show; a mini-app may support a subset (`MiniAppMeta.languages`). */
export type Lang = "en" | "bg";

/** A text in English plus optional translations; the shell falls back to English. */
export type Text = { readonly en: string } & Partial<Record<Lang, string>>;

/** Stops a subscription; safe to call more than once. */
export type Unsubscribe = () => void;

/**
 * Removes everything a mini-app added: DOM, listeners, timers, observers.
 * The shell calls it once, before the mount element is emptied or reused.
 */
export type Unmount = () => void;

/** A value the shell owns and the mini-app only reads; `subscribe` fires on every change. */
export interface Signal<T> {
  get(): T;
  subscribe(listener: (value: T) => void): Unsubscribe;
}

/**
 * The browser storage a mini-app owns; the shell computes usage and clears data from this alone.
 * @remarks A mini-app must never read or write a key, database or folder that is not declared here.
 * Areas of different mini-apps (and the shell's `quizzard:v1:`) never overlap (`validateRegistry`).
 */
export interface StorageArea {
  /** localStorage prefix, e.g. `"gg-counter:v1:"`; every key starting with it belongs to the area. */
  readonly prefix: string;
  /** Own keys outside the prefix (pre-forge keys kept for compatibility). */
  readonly extraKeys?: readonly string[];
  /** Own IndexedDB database names. */
  readonly databases?: readonly string[];
  /** Own folder under the OPFS root. */
  readonly opfsDir?: string;
}

/**
 * Eager, tiny description of a mini-app: Home card, route, Help and Settings use it without
 * loading the mini-app. It imports nothing but the icon URL.
 */
export interface MiniAppMeta {
  /** Contract version the mini-app was built for; the shell refuses any other value. */
  readonly contract: 1;
  /** Route `#/<id>`, scope `[data-miniapp="<id>"]` and manifest shortcut; a lower-case kebab slug. */
  readonly id: string;
  readonly name: Text;
  readonly tagline: Text;
  /** URL of an SVG mark. */
  readonly icon: string;
  /** Languages the mini-app translates; a missing language falls back to English. */
  readonly languages: readonly Lang[];
  /** `"coming"` = card and reserved route only, nothing to load. */
  readonly status: "ready" | "coming";
  readonly storage: StorageArea;
}

/** The mini-app's part of the shell's Help dialog, in one language. */
export interface HelpSection {
  readonly steps: readonly string[];
  readonly features: readonly { readonly name: string; readonly text: string }[];
  readonly faq: readonly { readonly q: string; readonly a: string }[];
}

/**
 * Everything the shell gives a mounted mini-app.
 * @remarks The shell owns `<html>`, `<body>`, `document.title`, theme (`color-scheme` on `<html>`),
 * language, the service worker and toasts; a mini-app never touches them directly and uses these
 * members instead. The shell guarantees the mount element has no `transform`, `filter`, `contain`
 * or clipping ancestor, so overlays (e.g. Radix portals) render inside it.
 */
export interface MiniAppContext {
  /** Where the mini-app runs: inside Quizzard or in its own standalone site. */
  readonly host: "quizzard" | "standalone";
  readonly language: Signal<Lang>;
  /** Resolved theme; the shell owns `color-scheme` on `<html>`. */
  readonly theme: Signal<"light" | "dark">;
  /** Launch parameters, e.g. `?teams=4`. */
  readonly query: URLSearchParams;
  readonly shell: {
    toast(message: string, options?: { tone?: "info" | "error"; action?: { label: string; run(): void } }): void;
    confirm(options: { title: string; text?: string; confirm: string; cancel?: string; danger?: boolean }): Promise<boolean>;
    share(data: { title?: string; text: string; url?: string }): Promise<"shared" | "copied" | "cancelled" | "failed">;
    /** Sets the part before `— Quizzard` in the page title; `null` = the mini-app's name. */
    setTitle(part: string | null): void;
    /** No update offer is shown while `true` (e.g. during a game). */
    setBusy(isBusy: boolean): void;
  };
  readonly navigation: { home(): void; open(id: string): void };
  /** Shell-owned elements the mini-app may render into, e.g. its header buttons. */
  readonly slots: { readonly headerActions: HTMLElement };
  readonly storage: {
    readonly area: StorageArea;
    /** Small preferences inside the mini-app's area; keys are relative to its prefix. */
    readonly prefs: { get<T>(key: string, fallback: T): T; set(key: string, value: unknown): boolean; remove(key: string): void };
    /** First call → the shell asks the browser for persistent storage once. */
    notifySaved(): void;
  };
}

/**
 * The default export of a mini-app's lazy chunk.
 * @remarks `mount` renders only inside `element` and returns its `Unmount`. If the user clears the
 * mini-app's data while it is open, the shell unmounts it and mounts it again.
 */
export interface MiniAppModule {
  mount(element: HTMLElement, context: MiniAppContext): Unmount | Promise<Unmount>;
  /** Optional own rows for the shell's Settings dialog (export/import …). */
  mountSettings?(element: HTMLElement, context: MiniAppContext): Unmount;
}

/**
 * One line of the shell's registry. `load` exists only for `status: "ready"` (`validateRegistry`).
 * @remarks Only `meta.name`, `meta.tagline` and `help` reach the shell's texts; a mini-app
 * translates its own subtree with its own dictionaries.
 */
export interface MiniAppEntry {
  readonly meta: MiniAppMeta;
  readonly load?: () => Promise<{ default: MiniAppModule }>;
  readonly help?: () => Promise<{ default: { readonly en: HelpSection } & Partial<Record<Lang, HelpSection>> }>;
}

/** The contract version this shell supports (`MiniAppMeta.contract`). */
export const CONTRACT_VERSION: MiniAppMeta["contract"] = 1;
