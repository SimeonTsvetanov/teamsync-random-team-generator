import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { attributionName, parseAttribution } from "../src/index.js";

const QUIZZARD = { name: "Quizzard", url: "https://simeontsvetanov.github.io/Quizzard/" };

describe("parseAttribution", () => {
  it("accepts a short name and an https address (trimmed)", () => {
    expect(parseAttribution(QUIZZARD)).toEqual(QUIZZARD);
    expect(parseAttribution({ name: "  Quiz Night ", url: " https://example.com/quiz " })).toEqual({ name: "Quiz Night", url: "https://example.com/quiz" });
  });
  it.each([
    ["no object", "Quizzard"],
    ["missing url", { name: "Quizzard" }],
    ["empty name", { name: " ", url: QUIZZARD.url }],
    ["name with a line break", { name: "Quiz\nzard", url: QUIZZARD.url }],
    ["name with markup", { name: "<b>Quizzard</b>", url: QUIZZARD.url }],
    ["name ending in a digit (the count would merge)", { name: "Quizzard 2", url: QUIZZARD.url }],
    ["name too long", { name: "Q".repeat(41), url: QUIZZARD.url }],
    ["http address", { name: "Quizzard", url: "http://example.com/" }],
    ["data address", { name: "Quizzard", url: "data:text/plain,Quizzard" }],
    ["ftp address", { name: "Quizzard", url: "ftp://example.com/" }],
    ["credentials in the address", { name: "Quizzard", url: "https://user:pw@example.com/" }],
    ["address with spaces", { name: "Quizzard", url: "https://exa mple.com/" }],
    ["no domain", { name: "Quizzard", url: "https://localhost/" }],
    ["a lone digit as the name", { name: "7", url: "https://example.com/" }],
    ["a name ending in a digit", { name: "App 2", url: "https://example.com/" }],
  ])("null for %s", (_, value) => {
    expect(parseAttribution(value)).toBeNull();
  });
  // A failing property prints `seed` + `path`: replay with fc.assert(p, { seed, path, endOnFailure: true }).
  it("never throws; anything accepted is https and has a name ending in a letter (property)", () => {
    fc.assert(fc.property(fc.anything(), fc.record({ name: fc.string(), url: fc.oneof(fc.webUrl(), fc.string()) }), (anything, record) =>
      [anything, record].every((value) => {
        const parsed = parseAttribution(value);
        return parsed === null || (parsed.url.startsWith("https://") && /\p{L}|\p{M}$/u.test(parsed.name.slice(-1)));
      })));
  });
});

describe("attributionName", () => {
  it("fuses the count to the name with no space, or leaves the name alone", () => {
    expect(attributionName("Quizzard", 1)).toBe("Quizzard1");
    expect(attributionName("TeamSync", 999)).toBe("TeamSync999");
    expect(attributionName("TeamSync", null)).toBe("TeamSync");
  });
});
