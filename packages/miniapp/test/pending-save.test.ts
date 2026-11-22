// @vitest-environment jsdom
// The debounced save of the names list (PLAN TS-02 regression): typing still waiting for its save
// is written when the screen unmounts (the user leaves `#/teams` inside Quizzard) or the page is
// hidden or closed; after unmount nothing is written any more.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import teams from "../src/index.ts";
import type { Unmount } from "../src/contract.ts";
import { fakeHost, stubBrowser, type FakeHost } from "./fake-host.ts";

const type = (root: ParentNode, text: string): void => {
  const area = root.querySelector("#names");
  if (!(area instanceof HTMLTextAreaElement)) throw new Error("missing #names");
  area.value = text;
  area.dispatchEvent(new Event("input"));
};
const mount = async (element: HTMLElement, host: FakeHost): Promise<Unmount> => teams.mount(element, host.context);
const setVisibility = (state: DocumentVisibilityState): void => {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
};

let element: HTMLElement;

beforeEach(() => {
  stubBrowser();
  vi.useFakeTimers();
  element = document.createElement("div");
  document.body.replaceChildren(element);
});
afterEach(() => {
  setVisibility("visible");
  vi.useRealTimers();
});

describe("pending save of the names list", () => {
  it("TS-02 regression: unmount writes typing that is still waiting for its save", async () => {
    const host = fakeHost();
    const unmount = await mount(element, host);
    type(element, "Ana\nBoris");
    expect(host.stored.has("names")).toBe(false); // still inside the 300 ms pause
    unmount();
    expect(host.stored.get("names")).toBe("Ana\nBoris");
  });

  it("writes nothing after unmount, so data the host clears later is never written back", async () => {
    const host = fakeHost();
    const unmount = await mount(element, host);
    type(element, "Ana\nBoris");
    unmount();
    host.stored.clear();
    vi.advanceTimersByTime(1000);
    window.dispatchEvent(new Event("pagehide"));
    expect(host.stored.has("names")).toBe(false);
  });

  it("unmount without pending typing writes nothing (a cleared list stays cleared)", async () => {
    const host = fakeHost();
    host.stored.set("names", "Ana");
    const unmount = await mount(element, host);
    host.stored.clear();
    unmount();
    expect(host.stored.has("names")).toBe(false);
  });

  it("writes pending typing when the page is closed (pagehide)", async () => {
    const host = fakeHost();
    const unmount = await mount(element, host);
    type(element, "Ana\nBoris\nVesko");
    window.dispatchEvent(new Event("pagehide"));
    expect(host.stored.get("names")).toBe("Ana\nBoris\nVesko");
    unmount();
  });

  it("writes pending typing when the page is hidden, not when it becomes visible", async () => {
    const host = fakeHost();
    const unmount = await mount(element, host);
    type(element, "Ana");
    setVisibility("visible");
    expect(host.stored.has("names")).toBe(false);
    setVisibility("hidden");
    expect(host.stored.get("names")).toBe("Ana");
    unmount();
  });

  it("saves once per burst: a flush leaves no second save behind", async () => {
    const host = fakeHost();
    const set = vi.spyOn(host.context.storage.prefs, "set");
    const unmount = await mount(element, host);
    type(element, "Ana");
    setVisibility("hidden");
    vi.advanceTimersByTime(1000);
    expect(set.mock.calls.filter(([key]) => key === "names")).toHaveLength(1);
    unmount();
  });
});
