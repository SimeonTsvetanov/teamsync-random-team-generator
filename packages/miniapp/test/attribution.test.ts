// @vitest-environment jsdom
// The attribution line of copied and shared teams (DECISIONS 2026-11-22): the app the host names,
// and the shuffle count fused to it — counted per roster, kept with the teams on screen, remembered.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import teams from "../src/index.ts";
import type { Unmount } from "../src/contract.ts";
import { emitTeamsEvent } from "../src/host-api.ts";
import { SHUFFLE_COUNT_IN_ATTRIBUTION, attributionFromQuery } from "../src/teams/attribution.ts";
import { fakeHost, stubBrowser, type FakeHost } from "./fake-host.ts";

const TEAMSYNC_URL = "https://simeontsvetanov.github.io/teamsync-random-team-generator/";
const QUIZZARD_QUERY = `attribution-name=Quizzard&attribution-url=${encodeURIComponent("https://simeontsvetanov.github.io/Quizzard/")}`;

let element: HTMLElement;
let writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;

const node = (selector: string): HTMLElement => {
  const found = element.querySelector(selector);
  if (!(found instanceof HTMLElement)) throw new Error(`missing ${selector}`);
  return found;
};
const type = (text: string): void => {
  const area = node("#names");
  if (!(area instanceof HTMLTextAreaElement)) throw new Error("#names is no textarea");
  area.value = text;
  area.dispatchEvent(new Event("input"));
};
const shuffle = (): void => { node("[data-regenerate]").click(); };
const generate = (text: string): void => {
  type(text);
  node("[data-teams-form]").dispatchEvent(new Event("submit", { cancelable: true }));
};
/** The last line of the text Copy wrote. */
const copiedLine = async (): Promise<string> => {
  node("[data-copy]").click();
  await vi.waitFor(() => { expect(writeText).toHaveBeenCalled(); });
  const text = writeText.mock.lastCall?.[0] ?? "";
  writeText.mockClear();
  return text.split("\n").at(-1) ?? "";
};
const mount = async (host: FakeHost): Promise<Unmount> => teams.mount(element, host.context);

beforeEach(() => {
  stubBrowser();
  element = document.createElement("div");
  document.body.replaceChildren(element);
  writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
  // jsdom has no Clipboard API; removed again after each test.
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});
afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard");
  document.body.replaceChildren();
});

describe("attributionFromQuery", () => {
  it("names TeamSync with the count on by default", () => {
    expect(SHUFFLE_COUNT_IN_ATTRIBUTION).toBe(true);
    expect(attributionFromQuery(new URLSearchParams())).toEqual({ attribution: { name: "TeamSync", url: TEAMSYNC_URL }, isShuffleCountOn: true });
  });
  it("takes a valid name and https address from the host; anything else gives TeamSync", () => {
    expect(attributionFromQuery(new URLSearchParams(QUIZZARD_QUERY)).attribution).toEqual({ name: "Quizzard", url: "https://simeontsvetanov.github.io/Quizzard/" });
    for (const query of ["attribution-name=Quizzard", "attribution-name=Quizzard&attribution-url=http%3A%2F%2Fx.com%2F", "attribution-name=%3Cb%3E&attribution-url=https%3A%2F%2Fx.com%2F"]) {
      expect(attributionFromQuery(new URLSearchParams(query)).attribution.name).toBe("TeamSync");
    }
  });
  it.each([["shuffle-count=off", false], ["shuffle-count=on", true], ["shuffle-count=OFF", true], ["shuffle-count=", true]])("%s → %s", (query, isOn) => {
    expect(attributionFromQuery(new URLSearchParams(query)).isShuffleCountOn).toBe(isOn);
  });
});

describe("the count in copied and shared teams", () => {
  it("1 on the first shuffle, +1 per Shuffle again; copying twice repeats the number", async () => {
    const host = fakeHost();
    const share = vi.spyOn(host.context.shell, "share");
    const unmount = await mount(host);
    generate("Ana\nBoris\nVesko\nGergana");
    expect(await copiedLine()).toBe(`— Made with TeamSync1 · ${TEAMSYNC_URL}`);
    shuffle();
    shuffle();
    expect(await copiedLine()).toBe(`— Made with TeamSync3 · ${TEAMSYNC_URL}`);
    expect(await copiedLine()).toBe(`— Made with TeamSync3 · ${TEAMSYNC_URL}`);
    node("[data-share]").click();
    expect(share.mock.lastCall?.[0].text.endsWith(`— Made with TeamSync3 · ${TEAMSYNC_URL}`)).toBe(true);
    unmount();
  });

  it("continues after cosmetic edits, other options, a failed try and a remount; resets when the people change", async () => {
    const host = fakeHost();
    let unmount = await mount(host);
    generate("Ana\nBoris\nVesko\nGergana");
    generate(" gergana\n\nVESKO\nboris   \nAna"); // order, case, spaces, blank line
    node("[data-teams-inc]").click(); // 3 teams
    generate("Ana\nBoris\nVesko\nGergana");
    expect(await copiedLine()).toContain("TeamSync3 ·");
    generate("Ana"); // fails: more teams than names — not a shuffle, teams on screen unchanged
    expect(await copiedLine()).toContain("TeamSync3 ·");
    unmount();
    unmount = await mount(host); // reload / reopen
    generate("Ana\nBoris\nVesko\nGergana");
    expect(await copiedLine()).toContain("TeamSync4 ·");
    generate("Ana\nBoris\nVesko\nGergana\nDimitar"); // a person added
    expect(await copiedLine()).toContain("TeamSync1 ·");
    generate("Ana\nBoris\nVesko\nGergana"); // a person removed
    expect(await copiedLine()).toContain("TeamSync1 ·");
    generate("Ana\nBoris\nVasil\nGergana"); // renamed
    expect(await copiedLine()).toContain("TeamSync1 ·");
    expect([...host.stored.keys()]).toContain("shuffles");
    expect(JSON.stringify(host.stored.get("shuffles"))).not.toMatch(/ana|boris|vasil|gergana/i);
    unmount();
  });

  it("counts teams the host asks for (teams:make) and starts at 1 over corrupt data", async () => {
    const host = fakeHost();
    host.stored.set("shuffles", { fingerprint: "not hex", count: -4 });
    const unmount = await mount(host);
    emitTeamsEvent(element, "teams:make", { names: ["Ana", "Boris", "Vesko"], teams: 2 });
    expect(await copiedLine()).toContain("TeamSync1 ·");
    unmount();
  });

  it("names the host's app in its language (Quizzard, BG)", async () => {
    const host = fakeHost(QUIZZARD_QUERY);
    const unmount = await mount(host);
    generate("Ana\nBoris");
    expect(await copiedLine()).toBe("— Made with Quizzard1 · https://simeontsvetanov.github.io/Quizzard/");
    host.setLanguage("bg");
    expect(await copiedLine()).toBe("— Направено с Quizzard1 · https://simeontsvetanov.github.io/Quizzard/");
    unmount();
  });

  it("off: the line is exactly as before and nothing is counted or stored", async () => {
    const host = fakeHost("shuffle-count=off");
    const unmount = await mount(host);
    generate("Ana\nBoris");
    shuffle();
    expect(await copiedLine()).toBe(`— Made with TeamSync · ${TEAMSYNC_URL}`);
    expect(host.stored.has("shuffles")).toBe(false);
    unmount();
  });
});
