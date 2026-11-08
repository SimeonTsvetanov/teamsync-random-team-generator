import { describe, expect, it } from "vitest";
import { FOLLOWERS } from "@simeonts/teamsync-random-team-generator-core";
import { APP_URL, makeTeamsTool } from "../src/tool.js";

describe("make_teams tool", () => {
  it("splits an array of names into teams with data and share text", () => {
    const r = makeTeamsTool({ names: ["Ana", "Boris", "Vesko", "Gergana"], teams: 2 });
    expect(r.isError).toBeUndefined();
    expect(r.structuredContent?.teams.map((t) => t.length)).toEqual([2, 2]);
    expect(r.content[0]?.text).toContain("🏆 Team 1 | Members - 2");
    expect(r.content[0]?.text.endsWith(`— Made with TeamSync · ${APP_URL}`)).toBe(true);
  });
  it("accepts one-per-line text and the followers cheat", () => {
    const r = makeTeamsTool({ names: "Ana\nthe followers", teams: 3 });
    expect(r.structuredContent?.teams.flat().sort()).toEqual(["Ana", ...FOLLOWERS].sort());
  });
  it("cleans pasted chat text: numbers, bullets, emoji and chat prefixes are removed", () => {
    const r = makeTeamsTool({ names: "1. Ana\n2) Boris\n• Chen\n⚽ Emil\n[06.11.26, 18:03] Moni: Dana", teams: 2 });
    expect(r.structuredContent?.teams.flat().sort()).toEqual(["Ana", "Boris", "Chen", "Dana", "Emil"]);
  });
  it("keeps array entries as given (names are not cleaned)", () => {
    const r = makeTeamsTool({ names: ["1. Ana", "Boris"], teams: 2 });
    expect(r.structuredContent?.teams.flat().sort()).toEqual(["1. Ana", "Boris"]);
  });
  it.each([
    [{ names: ["Ana"], teams: 2 }, "TEAMS_MORE_THAN_NAMES"],
    [{ names: "  \n ", teams: 2 }, "NAMES_EMPTY"],
    [{ names: ["Ana", "Boris"], teams: 11 }, "INPUT_INVALID"],
  ])("returns isError with a code for %j", (args, code) => {
    const r = makeTeamsTool(args);
    expect(r.isError).toBe(true);
    expect(JSON.parse(r.content[0]?.text ?? "{}")).toMatchObject({ code });
  });
});
