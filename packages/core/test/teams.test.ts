import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { MAX_TEAMS, cryptoRandomInt, makeTeams, shuffle } from "../src/index.js";

const names = (n: number): string[] => Array.from({ length: n }, (_, i) => `P${String(i + 1)}`);
const sizes = (t: string[][]): number[] => t.map((x) => x.length);

describe("makeTeams (AC1)", () => {
  it("10 names, 2 teams → 5 and 5", () => {
    const r = makeTeams({ names: names(10), teams: 2 });
    expect(r.ok && sizes(r.value)).toEqual([5, 5]);
  });
  it("11 names, 3 teams → 4, 4, 3", () => {
    const r = makeTeams({ names: names(11), teams: 3 });
    expect(r.ok && sizes(r.value)).toEqual([4, 4, 3]);
  });
  it("TEAMS_MORE_THAN_NAMES when teams > names (AC4)", () => {
    expect(makeTeams({ names: names(3), teams: 4 })).toMatchObject({ ok: false, error: { code: "TEAMS_MORE_THAN_NAMES" } });
  });
  it.each([1, 11, 2.5, Number.NaN])("TEAMS_OUT_OF_RANGE for %s", (teams) => {
    expect(makeTeams({ names: names(20), teams })).toMatchObject({ ok: false, error: { code: "TEAMS_OUT_OF_RANGE" } });
  });
  it("NAMES_INVALID for an empty name", () => {
    expect(makeTeams({ names: ["A", "  "], teams: 2 })).toMatchObject({ ok: false, error: { code: "NAMES_INVALID" } });
  });
  it("every name exactly once, sizes differ by at most 1, bigger teams first (property)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: MAX_TEAMS }), fc.integer({ min: 0, max: 200 }), (teams, extra) => {
        const list = names(teams + extra);
        const r = makeTeams({ names: list, teams });
        if (!r.ok) return false;
        const s = sizes(r.value);
        const sorted = [...s].sort((a, b) => b - a);
        return r.value.flat().sort().join() === [...list].sort().join() && Math.max(...s) - Math.min(...s) <= 1 && s.join() === sorted.join();
      }),
    );
  });
});

describe("fairness (AC2)", () => {
  it("over 30,000 runs each name lands in each team 1/N of the time ±2 %", () => {
    const list = names(6);
    const teams = 3;
    const runs = 30_000;
    const counts = new Map<string, number[]>(list.map((n) => [n, Array<number>(teams).fill(0)]));
    for (let i = 0; i < runs; i++) {
      const r = makeTeams({ names: list, teams });
      if (!r.ok) throw new Error(r.error.code);
      r.value.forEach((team, t) => {
        for (const n of team) {
          const row = counts.get(n);
          if (row) row[t] = (row[t] ?? 0) + 1;
        }
      });
    }
    for (const [, perTeam] of counts) for (const c of perTeam) expect(Math.abs(c / runs - 1 / teams)).toBeLessThan(0.02);
  });
});

describe("shuffle and cryptoRandomInt", () => {
  it("shuffle keeps the items and does not change the input", () => {
    const input = names(10);
    const copy = [...input];
    const out = shuffle(input);
    expect([...out].sort()).toEqual([...input].sort());
    expect(input).toEqual(copy);
  });
  it("uses the injected random source (deterministic)", () => {
    expect(shuffle(["a", "b", "c"], () => 0)).toEqual(["b", "c", "a"]);
  });
  it("cryptoRandomInt stays in range and rejects bad limits", () => {
    for (let i = 0; i < 1000; i++) {
      const v = cryptoRandomInt(7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
    }
    expect(() => cryptoRandomInt(0)).toThrow(RangeError);
  });
});
