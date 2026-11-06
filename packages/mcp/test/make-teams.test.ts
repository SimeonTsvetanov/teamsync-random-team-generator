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
