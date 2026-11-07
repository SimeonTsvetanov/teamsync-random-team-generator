// Unit tests for pwa.ts (forge-pwa → pwa §5): update helpers and the initPwa wiring — periodic and
// foreground checks, multi-tab controller change, reload-once after a stale chunk. Browser globals
// are small stubs; the plugin's registerSW and the toast are mocked.
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import type { RegisterSWOptions } from "vite-plugin-pwa/types";

const updateSW = vi.fn<(reload?: boolean) => Promise<void>>(() => Promise.resolve());
vi.mock("virtual:pwa-register", () => ({ registerSW: vi.fn(() => updateSW) }));
vi.mock("./ui/toast.ts", () => ({ showToast: vi.fn() }));
vi.mock("./i18n/index.ts", () => ({ t: (key: string) => key }));

const { registerSW } = await import("virtual:pwa-register");
const { showToast } = await import("./ui/toast.ts");
const pwa = await import("./pwa.ts");
const { checkForUpdate, controllerChangeAction, shouldReloadAfterPreloadError, initPwa } = pwa;

function registration(installing: boolean): { installing: ServiceWorker | null; update: Mock<() => Promise<void>> } {
  // because only "is something installing" matters here, not a real ServiceWorker
  return { installing: installing ? ({} as unknown as ServiceWorker) : null, update: vi.fn(() => Promise.resolve()) };
}

function memoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const items = new Map<string, string>();
  return { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => { items.set(key, value); } };
}

/** Stubs window, document, navigator, location and sessionStorage, then runs initPwa(). */
function start({ controlled = true, storage = memoryStorage() }: { controlled?: boolean; storage?: Pick<Storage, "getItem" | "setItem"> } = {}) {
  const win = new EventTarget();
  const doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const serviceWorker = Object.assign(new EventTarget(), { controller: controlled ? {} : null });
  const reload = vi.fn();
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", doc);
  vi.stubGlobal("navigator", { serviceWorker, onLine: true });
  vi.stubGlobal("location", { reload });
  vi.stubGlobal("sessionStorage", storage);
  initPwa();
  const options: RegisterSWOptions | undefined = vi.mocked(registerSW).mock.calls.at(-1)?.[0];
  if (!options) throw new Error("initPwa() did not call registerSW()");
  return { win, doc, serviceWorker, reload, options };
}

/** Runs the action of the last toast shown (the Reload button). */
function tapLastToastAction(): void {
  vi.mocked(showToast).mock.calls.at(-1)?.[0].action?.run();
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("checkForUpdate", () => {
  it("fetches the script uncached and calls update() on 200", async () => {
    const reg = registration(false);
    const fetchScript = vi.fn(() => Promise.resolve({ status: 200 }));
    await expect(checkForUpdate({ swUrl: "/app/sw.js", registration: reg, isOnline: () => true, fetchScript })).resolves.toBe(true);
    expect(fetchScript).toHaveBeenCalledWith("/app/sw.js", expect.objectContaining({ cache: "no-store" }));
    expect(reg.update).toHaveBeenCalledOnce();
  });
  it("skips while a new worker is installing", async () => {
    const reg = registration(true);
    const fetchScript = vi.fn(() => Promise.resolve({ status: 200 }));
    await expect(checkForUpdate({ swUrl: "sw.js", registration: reg, isOnline: () => true, fetchScript })).resolves.toBe(false);
    expect(fetchScript).not.toHaveBeenCalled();
  });
  it("skips offline", async () => {
    const reg = registration(false);
    const fetchScript = vi.fn(() => Promise.resolve({ status: 200 }));
    await expect(checkForUpdate({ swUrl: "sw.js", registration: reg, isOnline: () => false, fetchScript })).resolves.toBe(false);
    expect(fetchScript).not.toHaveBeenCalled();
  });
  it("does not update when the script answers 404 or the fetch fails", async () => {
    const reg = registration(false);
    await expect(checkForUpdate({ swUrl: "sw.js", registration: reg, isOnline: () => true, fetchScript: () => Promise.resolve({ status: 404 }) })).resolves.toBe(false);
    await expect(checkForUpdate({ swUrl: "sw.js", registration: reg, isOnline: () => true, fetchScript: () => Promise.reject(new TypeError("offline")) })).resolves.toBe(false);
    expect(reg.update).not.toHaveBeenCalled();
  });
});

describe("controllerChangeAction", () => {
  it("reloads only the tab that asked for the update", () => {
    expect(controllerChangeAction({ hadController: true, updateRequested: true })).toBe("reload");
  });
  it("offers a reload when another tab activated the new version", () => {
    expect(controllerChangeAction({ hadController: true, updateRequested: false })).toBe("offer-reload");
  });
  it("ignores the first service worker taking control", () => {
    expect(controllerChangeAction({ hadController: false, updateRequested: false })).toBe("ignore");
  });
});

describe("shouldReloadAfterPreloadError", () => {
  it("reloads the first time", () => {
    expect(shouldReloadAfterPreloadError(null, 1_000)).toBe(true);
  });
  it("does not reload again right after a reload (no loop)", () => {
    expect(shouldReloadAfterPreloadError(1_000, 1_000 + pwa.PRELOAD_RELOAD_WINDOW_MS)).toBe(false);
  });
  it("reloads again for a later deploy in the same session", () => {
    expect(shouldReloadAfterPreloadError(1_000, 1_001 + pwa.PRELOAD_RELOAD_WINDOW_MS)).toBe(true);
  });
});

describe("initPwa: updates", () => {
  it("replaces the plugin's reload-every-tab default with a no-op", () => {
    const { options, reload } = start();
    expect(options.onNeedReload).toBeTypeOf("function");
    options.onNeedReload?.();
    expect(reload).not.toHaveBeenCalled();
  });
  it("Reload in this tab applies the update and reloads on controllerchange", () => {
    const { options, serviceWorker, reload } = start();
    options.onNeedRefresh?.();
    expect(vi.mocked(showToast)).toHaveBeenLastCalledWith(expect.objectContaining({ pinned: true }));
    tapLastToastAction();
    expect(updateSW).toHaveBeenCalledWith(true);
    serviceWorker.dispatchEvent(new Event("controllerchange"));
    expect(reload).toHaveBeenCalledOnce();
  });
  it("another tab's update only offers a reload here, never reloads by itself", () => {
    const { serviceWorker, reload } = start();
    serviceWorker.dispatchEvent(new Event("controllerchange"));
    expect(reload).not.toHaveBeenCalled();
    expect(vi.mocked(showToast)).toHaveBeenLastCalledWith(expect.objectContaining({ pinned: true }));
    tapLastToastAction();
    expect(reload).toHaveBeenCalledOnce();
  });
  it("the first service worker taking control does nothing", () => {
    const { serviceWorker, reload } = start({ controlled: false });
    serviceWorker.dispatchEvent(new Event("controllerchange"));
    expect(reload).not.toHaveBeenCalled();
    expect(vi.mocked(showToast)).not.toHaveBeenCalled();
  });
  it("a tab without a controller (hard reload) reloads directly after Reload", async () => {
    const { options, reload } = start({ controlled: false });
    options.onNeedRefresh?.();
    tapLastToastAction();
    await vi.waitFor(() => { expect(reload).toHaveBeenCalledOnce(); });
    expect(updateSW).toHaveBeenCalledWith(true);
  });
});

describe("initPwa: update checks", () => {
  it("registers one hourly interval and one visibility listener", () => {
    const { options, doc } = start();
    const interval = vi.spyOn(globalThis, "setInterval");
    const listen = vi.spyOn(doc, "addEventListener");
    // because the checks only read installing/update(), not a full registration
    options.onRegisteredSW?.("sw.js", registration(false) as unknown as ServiceWorkerRegistration);
    expect(interval).toHaveBeenCalledOnce();
    expect(interval).toHaveBeenCalledWith(expect.any(Function), pwa.UPDATE_CHECK_INTERVAL_MS);
    expect(listen.mock.calls.filter(([type]) => type === "visibilitychange")).toHaveLength(1);
  });
  it("checks on return to the foreground at most every 5 minutes, and every hour", () => {
    vi.useFakeTimers();
    const fetchScript = vi.fn(() => Promise.resolve({ status: 200 }));
    const { options, doc } = start();
    vi.stubGlobal("fetch", fetchScript);
    options.onRegisteredSW?.("sw.js", registration(false) as unknown as ServiceWorkerRegistration);
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(fetchScript).not.toHaveBeenCalled();
    vi.advanceTimersByTime(pwa.UPDATE_CHECK_MIN_GAP_MS);
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(fetchScript).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(pwa.UPDATE_CHECK_INTERVAL_MS);
    expect(fetchScript).toHaveBeenCalledTimes(2);
  });
});

describe("initPwa: stale chunk after a deploy (vite:preloadError)", () => {
  const preloadError = (): Event => new Event("vite:preloadError", { cancelable: true });

  it("reloads once, then lets a repeat reach the error screen", () => {
    const { win, reload } = start();
    const first = preloadError();
    win.dispatchEvent(first);
    expect(first.defaultPrevented).toBe(true);
    const second = preloadError();
    win.dispatchEvent(second);
    expect(second.defaultPrevented).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });
  it("never reloads when sessionStorage throws (no guard, no loop)", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    const { win, reload } = start({ storage: blocked });
    const event = preloadError();
    win.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
