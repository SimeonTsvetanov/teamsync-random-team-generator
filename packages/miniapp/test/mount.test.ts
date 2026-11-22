// @vitest-environment jsdom
// The Teams body behind the contract (PLAN TS-01): render and hydrate, mount → unmount → mount,
// no listener or subscription left behind, texts follow the host's language, saved list, events.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import teams from "../src/index.ts";
import type { Unmount } from "../src/contract.ts";
import { emitTeamsEvent, onTeamsEvent } from "../src/host-api.ts";
import { renderScreen } from "../src/teams/render.ts";
import { fakeHost, stubBrowser, type FakeHost } from "./fake-host.ts";

const query = (root: ParentNode, selector: string): HTMLElement => {
  const found = root.querySelector(selector);
  if (!(found instanceof HTMLElement)) throw new Error(`missing ${selector}`);
  return found;
};
const area = (root: ParentNode): HTMLTextAreaElement => {
  const found = query(root, "#names");
  if (!(found instanceof HTMLTextAreaElement)) throw new Error("#names is no textarea");
  return found;
};
const type = (root: ParentNode, text: string): void => {
  area(root).value = text;
  area(root).dispatchEvent(new Event("input"));
};
const click = (root: ParentNode, selector: string): void => { query(root, selector).click(); };
const mount = async (element: HTMLElement, host: FakeHost): Promise<Unmount> => teams.mount(element, host.context);

let element: HTMLElement;

beforeEach(() => {
  stubBrowser();
  element = document.createElement("div");
  document.body.replaceChildren(element);
});
afterEach(() => { vi.useRealTimers(); });

describe("render mode (Quizzard: empty element)", () => {
  it("renders the screen, empties the element on unmount and mounts again", async () => {
    const host = fakeHost();
    const unmount = await mount(element, host);
    expect(element.querySelector("[data-teams-form]")).not.toBeNull();
    expect(query(element, "[data-teams-dec]").querySelector("svg")).not.toBeNull();
    unmount();
    expect(element.childNodes).toHaveLength(0);
    const again = await mount(element, host);
    type(element, "Ana\nBoris\nVesko");
    expect(query(element, "[data-names-count]").textContent).toBe("3 names");
    again();
  });

  it("makes teams and tells the host", async () => {
    const host = fakeHost();
    const unmount = await mount(element, host);
    const results = vi.fn();
    onTeamsEvent(element, "teams:result", results);
    type(element, "Ana\nBoris\nVesko\nGergana");
    area(element).form?.requestSubmit();
    expect(element.querySelectorAll("article.team-card")).toHaveLength(2);
    expect(results).toHaveBeenCalledOnce();
    unmount();
  });
});

describe("hydrate mode (standalone: the page has the markup)", () => {
  beforeEach(() => { renderScreen(element); });

  it("mounts at once, keeps the markup on unmount and mounts again over it", async () => {
    const host = fakeHost();
    const result = teams.mount(element, host.context);
    expect(typeof result).toBe("function"); // no markup to load: mounted at once
    const form = query(element, "[data-teams-form]");
    (await result)();
    expect(query(element, "[data-teams-form]")).toBe(form);
    const again = await mount(element, host);
    click(element, "[data-teams-inc]");
    expect(query(element, "[data-teams-value]").textContent).toBe("3");
    again();
  });

  it("leaves no listener and no subscription behind", async () => {
    const add = vi.spyOn(EventTarget.prototype, "addEventListener");
    const host = fakeHost();
    const unmount = await mount(element, host);
    const signals = add.mock.calls.map(([, , options]) => (typeof options === "object" ? options.signal : undefined));
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.every((signal) => signal instanceof AbortSignal && !signal.aborted)).toBe(true);
    expect(host.languageListeners()).toBe(1);
    unmount();
    expect(signals.every((signal) => signal?.aborted === true)).toBe(true);
    expect(host.languageListeners()).toBe(0);
    click(element, "[data-teams-inc]");
    type(element, "Ana\nBoris");
    emitTeamsEvent(element, "teams:make", { names: ["A", "B"], teams: 2 });
    expect(query(element, "[data-teams-value]").textContent).toBe("2");
    expect(query(element, "[data-names-count]").textContent).toBe("");
    expect(element.querySelectorAll("article")).toHaveLength(0);
  });
});

describe("host services", () => {
  it("translates its own subtree when the host's language changes", async () => {
    const host = fakeHost();
    const unmount = await mount(element, host);
    type(element, "Ана");
    host.setLanguage("bg");
    expect(query(element, "#names-label").textContent).toBe("Имена");
    expect(area(element).placeholder).toBe("По едно име на ред…");
    expect(query(element, "[data-names-count]").textContent).toBe("1 име");
    expect(query(element, "[data-teams-dec]").getAttribute("aria-label")).toBe("По-малко отбори");
    host.setLanguage("en");
    expect(query(element, "#names-label").textContent).toBe("Names");
    unmount();
  });

  it("starts from the remembered list and the teams launch parameter, and saves typing after a pause", async () => {
    vi.useFakeTimers();
    const host = fakeHost("teams=4");
    host.stored.set("names", "Ana\nBoris");
    host.stored.set("teams", 3);
    const unmount = await mount(element, host);
    expect(area(element).value).toBe("Ana\nBoris");
    expect(query(element, "[data-teams-value]").textContent).toBe("4");
    type(element, "Ana\nBoris\nVesko");
    vi.advanceTimersByTime(300);
    expect(host.stored.get("names")).toBe("Ana\nBoris\nVesko");
    expect(host.notifySaved).toHaveBeenCalled();
    unmount();
  });

  it("Clear offers Undo through the host's toast", async () => {
    const host = fakeHost();
    const unmount = await mount(element, host);
    type(element, "Ana\nBoris");
    click(element, "[data-names-clear]");
    expect(area(element).value).toBe("");
    const [message, options] = host.toast.mock.calls[0] ?? [];
    expect(message).toBe("Names list cleared");
    expect(options?.action?.label).toBe("Undo");
    options?.action?.run();
    expect(area(element).value).toBe("Ana\nBoris");
    expect(host.toast).toHaveBeenLastCalledWith("Undone ✓");
    unmount();
  });

  it("fills the list from shared text (launch parameter `shared`)", async () => {
    const host = fakeHost(`shared=${encodeURIComponent("- Gergana\n- Dimitar")}`);
    const unmount = await mount(element, host);
    expect(area(element).value).toBe("Gergana\nDimitar");
    expect(host.toast).toHaveBeenCalledWith("2 names added from the shared text");
    unmount();
  });
});
