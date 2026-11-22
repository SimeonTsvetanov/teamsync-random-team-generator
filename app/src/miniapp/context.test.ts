// @vitest-environment jsdom
// The standalone MiniAppContext (PLAN TS-01): the Teams body gets this app's own language, theme,
// toast, confirm and share, and its prefs land under the same keys as before the split.
import { beforeEach, describe, expect, it, vi } from "vitest";

const shell = vi.hoisted((): { language: "en" | "bg" } => ({ language: "en" }));
vi.mock("../i18n/index.ts", () => ({ getLanguage: () => shell.language }));
vi.mock("../ui/toast.ts", () => ({ showToast: vi.fn() }));
vi.mock("../ui/confirm.ts", () => ({ confirmAction: vi.fn(() => Promise.resolve(true)) }));
vi.mock("../ui/share.ts", () => ({ shareText: vi.fn(() => Promise.resolve()) }));
const { showToast } = await import("../ui/toast.ts");
const { confirmAction } = await import("../ui/confirm.ts");
const { shareText } = await import("../ui/share.ts");
const { createStandaloneContext } = await import("./context.ts");

const area = { prefix: "teamsync-random-team-generator:v1:" };
const context = () => createStandaloneContext({ area, query: new URLSearchParams("teams=3") });

beforeEach(() => {
  shell.language = "en";
  localStorage.clear();
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
});

describe("createStandaloneContext", () => {
  it("refuses a storage area that is not this app's prefix", () => {
    expect(() => createStandaloneContext({ area: { prefix: "other:v1:" }, query: new URLSearchParams() })).toThrow(/^STORAGE_AREA_MISMATCH/);
  });

  it("is the standalone host with the launch parameters it was given", () => {
    const { host, query } = context();
    expect(host).toBe("standalone");
    expect(query.get("teams")).toBe("3");
  });

  it("tells language subscribers about real changes only, until they unsubscribe", () => {
    const { language } = context();
    const listener = vi.fn();
    const stop = language.subscribe(listener);
    document.dispatchEvent(new Event("i18n:change"));
    shell.language = "bg";
    document.dispatchEvent(new Event("i18n:change"));
    expect(listener.mock.calls).toEqual([["bg"]]);
    stop();
    shell.language = "en";
    document.dispatchEvent(new Event("i18n:change"));
    expect(listener).toHaveBeenCalledOnce();
  });

  it("follows the theme the toggle sets on <html>", async () => {
    const { theme } = context();
    const listener = vi.fn();
    const stop = theme.subscribe(listener);
    expect(theme.get()).toBe("light");
    document.documentElement.setAttribute("data-theme", "dark");
    await Promise.resolve(); // MutationObserver callbacks run as a microtask
    expect(listener).toHaveBeenCalledWith("dark");
    stop();
    document.documentElement.removeAttribute("data-theme");
  });

  it("adapts toast, confirm and share to this app's modules", async () => {
    const { shell: services } = context();
    const run = vi.fn();
    services.toast("Names list cleared", { action: { label: "Undo", run } });
    const [options] = vi.mocked(showToast).mock.calls[0] ?? [];
    expect(options?.message).toBe("Names list cleared");
    expect(options?.action?.label).toBe("Undo");
    options?.action?.run();
    expect(run).toHaveBeenCalledOnce();
    await expect(services.confirm({ title: "Clear?", text: "Gone.", confirm: "Clear" })).resolves.toBe(true);
    expect(confirmAction).toHaveBeenCalledWith({ title: "Clear?", message: "Gone.", confirm: "Clear" });
    await expect(services.share({ text: "teams" })).resolves.toBe("shared");
    expect(shareText).toHaveBeenCalledWith("teams", "TeamSync");
  });

  it("keeps prefs under the app's own keys", () => {
    const { storage } = context();
    storage.prefs.set("names", "Ana\nBoris");
    expect(localStorage.getItem("teamsync-random-team-generator:v1:names")).toBe(JSON.stringify("Ana\nBoris"));
    expect(storage.prefs.get("names", "")).toBe("Ana\nBoris");
    storage.prefs.remove("names");
    expect(localStorage.getItem("teamsync-random-team-generator:v1:names")).toBeNull();
  });
});
