import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { FOLLOWERS, MAX_NAMES, expandFollowers, parseNames } from "../src/index.js";

describe("parseNames", () => {
  it("one name per line, trimmed, blank lines ignored, duplicates kept", () => {
    expect(parseNames("  Ana \n\nBoris\n   \nAna\r\nVesko")).toEqual({ ok: true, value: ["Ana", "Boris", "Ana", "Vesko"] });
  });
  it("NAMES_EMPTY for nothing but spaces", () => {
    expect(parseNames(" \n \n")).toMatchObject({ ok: false, error: { code: "NAMES_EMPTY" } });
  });
  it(`NAMES_TOO_MANY above ${String(MAX_NAMES)}`, () => {
    expect(parseNames(Array.from({ length: MAX_NAMES + 1 }, (_, i) => `N${String(i)}`).join("\n"))).toMatchObject({ ok: false, error: { code: "NAMES_TOO_MANY" } });
  });
  it("NAME_TOO_LONG above 100 characters", () => {
    expect(parseNames(`Ana\n${"x".repeat(101)}`)).toMatchObject({ ok: false, error: { code: "NAME_TOO_LONG" } });
  });
  it("never throws on any text (property)", () => {
    fc.assert(fc.property(fc.string({ maxLength: 2000 }), (s) => typeof parseNames(s).ok === "boolean"));
  });
});

describe("the followers cheat (SPEC F6, AC5)", () => {
  it("has the 18 names (original order + Keti after Dinkata)", () => {
    expect(FOLLOWERS).toEqual(["Moni", "Iliyana", "George", "Viki", "Eli", "Asen", "Lubomir", "Ralica", "Venci", "Slavi", "Joni", "Apapa", "Mitaka G", "Tonkata", "Dinkata", "Keti", "Raiko", "Tancheto"]);
  });
  it.each(["the followers", "THE FOLLOWERS", "  The Followers  ", "tHe fOlLoWeRs"])("expands %j", (line) => {
    expect(parseNames(line)).toEqual({ ok: true, value: [...FOLLOWERS] });
  });
  it("expands in place among other names", () => {
    expect(expandFollowers("Ana\nthe followers\nBoris")).toBe(["Ana", ...FOLLOWERS, "Boris"].join("\n"));
  });
  it("two cheat lines → the friends twice", () => {
    expect(parseNames("the followers\nthe followers")).toMatchObject({ ok: true, value: [...FOLLOWERS, ...FOLLOWERS] });
  });
  it("only a whole line triggers it", () => {
    expect(parseNames("the followers club\nnot the followers")).toEqual({ ok: true, value: ["the followers club", "not the followers"] });
  });
  it("text without the cheat is returned unchanged (same string)", () => {
    const s = "Ana\n Boris ";
    expect(expandFollowers(s)).toBe(s);
  });
});
